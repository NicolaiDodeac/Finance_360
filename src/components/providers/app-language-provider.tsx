"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type AppLanguage,
  detectBrowserAppLanguage,
  readStoredAppLanguage,
  storeAppLanguage,
} from "@/lib/i18n/app-language";

interface AppLanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  hydrated: boolean;
}

const AppLanguageContext = createContext<AppLanguageContextValue | null>(null);

export function AppLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredAppLanguage();
    setLanguageState(stored ?? detectBrowserAppLanguage());
    setHydrated(true);
  }, []);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    storeAppLanguage(next);
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, hydrated }),
    [language, setLanguage, hydrated]
  );

  return (
    <AppLanguageContext.Provider value={value}>
      {children}
    </AppLanguageContext.Provider>
  );
}

export function useAppLanguage(): AppLanguageContextValue {
  const ctx = useContext(AppLanguageContext);
  if (!ctx) {
    throw new Error("useAppLanguage must be used within AppLanguageProvider");
  }
  return ctx;
}
