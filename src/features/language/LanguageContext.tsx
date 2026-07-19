import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { languageCopy, languageStorageKey } from "./language.copy";
import type { AppLanguage } from "./language.copy";

type LanguageContextValue = {
  copy: typeof languageCopy[AppLanguage];
  language: AppLanguage;
  localized: (hindi: string, english: string) => string;
  setLanguage: (language: AppLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "hi" || value === "en";
}

function getInitialLanguage(): AppLanguage {
  try {
    const storedLanguage = window.localStorage.getItem(languageStorageKey);

    return isAppLanguage(storedLanguage) ? storedLanguage : "hi";
  } catch {
    return "hi";
  }
}

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<AppLanguage>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;

    try {
      window.localStorage.setItem(languageStorageKey, language);
    } catch {
      // The UI should keep working even when browser storage is unavailable.
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    copy: languageCopy[language],
    language,
    localized: (hindi, english) => (language === "en" ? english : hindi),
    setLanguage
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    return {
      copy: languageCopy.hi,
      language: "hi" as const,
      localized: (hindi: string) => hindi,
      setLanguage: () => undefined
    };
  }

  return context;
}
