"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
}

const LanguageContext =
  createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, setLocale] = useState<string>("EN");

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}