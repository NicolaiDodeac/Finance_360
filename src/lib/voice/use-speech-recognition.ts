"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppLanguage } from "@/components/providers/app-language-provider";
import {
  createSpeechRecognitionForAppLanguage,
  isSpeechRecognitionSupported,
  mapSpeechRecognitionError,
  SPEECH_SILENCE_AUTO_STOP_MS,
  type SpeechRecognitionInstance,
  type SpeechRecognitionResultEvent,
  unsupportedSpeechMessage,
  ukrainianFallbackNotice,
  vibrateSpeechFeedback,
} from "@/lib/voice/speech-recognition";

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  languageFallbackNotice: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const { language } = useAppLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [languageFallbackNotice, setLanguageFallbackNotice] = useState<
    string | null
  >(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSupported = isSpeechRecognitionSupported();

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        recognition.onspeechend = null;
        recognition.stop();
      } catch {
        try {
          recognition.abort();
        } catch {
          /* ignore */
        }
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
    vibrateSpeechFeedback(8);
  }, [clearSilenceTimer]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  const beginRecognition = useCallback(
    (preferFallback: boolean) => {
      const handle = createSpeechRecognitionForAppLanguage(language, {
        preferFallback,
      });
      if (!handle) {
        setError(unsupportedSpeechMessage());
        return false;
      }

      if (handle.usedFallback) {
        setLanguageFallbackNotice(ukrainianFallbackNotice());
      }

      const scheduleSilenceStop = () => {
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
        }, SPEECH_SILENCE_AUTO_STOP_MS);
      };

      const recognition = handle.recognition;
      recognitionRef.current = recognition;

      recognition.onresult = (event: SpeechRecognitionResultEvent) => {
        scheduleSilenceStop();

        let interim = "";
        let finals = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript?.trim() ?? "";
          if (!text) continue;
          if (result.isFinal) {
            finals += (finals ? " " : "") + text;
          } else {
            interim += (interim ? " " : "") + text;
          }
        }

        if (finals) {
          setTranscript((prev) => (prev ? `${prev} ${finals}` : finals));
          setInterimTranscript("");
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event) => {
        const mapped = mapSpeechRecognitionError(event.error);
        if (mapped.kind === "aborted") return;
        if (mapped.message) setError(mapped.message);
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
        recognitionRef.current = null;
        clearSilenceTimer();
      };

      recognition.onspeechend = scheduleSilenceStop;

      try {
        recognition.start();
        setIsListening(true);
        setError(null);
        vibrateSpeechFeedback(10);
        return true;
      } catch {
        recognitionRef.current = null;
        return false;
      }
    },
    [clearSilenceTimer, language, stopListening]
  );

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError(unsupportedSpeechMessage());
      return;
    }

    stopListening();
    setLanguageFallbackNotice(null);
    setError(null);

    const started = beginRecognition(false);
    if (started) return;

    if (language === "uk") {
      const fallbackStarted = beginRecognition(true);
      if (fallbackStarted) return;
    }

    setError("Could not start voice input. Tap the microphone to try again.");
    setIsListening(false);
  }, [beginRecognition, isSupported, language, stopListening]);

  useEffect(() => {
    if (isListening) stopListening();
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopListening(), [stopListening]);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    languageFallbackNotice,
    startListening,
    stopListening,
    resetTranscript,
  };
}
