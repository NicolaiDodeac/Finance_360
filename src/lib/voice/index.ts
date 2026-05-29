export {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  mapSpeechRecognitionError,
  normaliseMerchantSpeech,
  SPEECH_SILENCE_AUTO_STOP_MS,
  unsupportedSpeechMessage,
  vibrateSpeechFeedback,
} from "@/lib/voice/speech-recognition";
export type {
  SpeechRecognitionHandle,
  SpeechRecognitionErrorKind,
} from "@/lib/voice/speech-recognition";
export { useSpeechRecognition } from "@/lib/voice/use-speech-recognition";
export type { UseSpeechRecognitionResult } from "@/lib/voice/use-speech-recognition";
