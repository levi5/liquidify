import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Locale = "en" | "pt-BR";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const STORAGE_KEY = "liquidify-docs-locale";
const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  try {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem(STORAGE_KEY) === "pt-BR" ? "pt-BR" : "en";
  } catch {
    return "en";
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readStoredLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
    }
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute("content", locale === "pt-BR" ? "pt_BR" : "en_US");
  }, [locale]);

  return <LocaleContext value={{ locale, setLocale }}>{children}</LocaleContext>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
