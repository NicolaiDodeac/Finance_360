"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  mapSpeechRecognitionError,
  normaliseMerchantSpeech,
  SPEECH_SILENCE_AUTO_STOP_MS,
  type SpeechRecognitionInstance,
  type SpeechRecognitionResultEvent,
  unsupportedSpeechMessage,
  vibrateSpeechFeedback,
} from "@/lib/voice/speech-recognition";

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    () => {
      const handle = createSpeechRecognition();
      if (!handle) {
        setError(unsupportedSpeechMessage());
        return false;
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
            finals += (finals ? " " : "") + normaliseMerchantSpeech(text);
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
    [clearSilenceTimer, stopListening]
  );

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError(unsupportedSpeechMessage());
      return;
    }

    stopListening();
    setError(null);

    const started = beginRecognition();
    if (started) return;

    setError("Could not start voice input. Tap the microphone to try again.");
    setIsListening(false);
  }, [beginRecognition, isSupported, stopListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
