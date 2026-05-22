export type AppLanguage = "en" | "uk";

export const APP_LANGUAGE_STORAGE_KEY = "finance360-app-language";

export const APP_LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  uk: "Українська",
};

/** BCP-47 locales for Web Speech API. */
export type SpeechRecognitionLocale = "en-GB" | "uk-UA";

export const SPEECH_LOCALE_BY_APP_LANGUAGE: Record<
  AppLanguage,
  SpeechRecognitionLocale
> = {
  en: "en-GB",
  uk: "uk-UA",
};

export const SPEECH_FALLBACK_LOCALE: SpeechRecognitionLocale = "en-GB";

export function getSpeechLocaleForAppLanguage(
  language: AppLanguage
): SpeechRecognitionLocale {
  return SPEECH_LOCALE_BY_APP_LANGUAGE[language];
}

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === "en" || value === "uk";
}

export function readStoredAppLanguage(): AppLanguage | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    return isAppLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function storeAppLanguage(language: AppLanguage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* ignore quota / private mode */
  }
}

export function detectBrowserAppLanguage(): AppLanguage {
  if (typeof navigator === "undefined") return "en";
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of langs) {
    const lower = tag.toLowerCase();
    if (lower.startsWith("uk")) return "uk";
  }
  return "en";
}
