"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";

interface Language {
  id: string;
  language_name: string;
  language_slug: string;
}

export default function LanguageHeader() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  const { locale, setLocale } = useLanguage();

  useEffect(() => {
    const loadLanguages = async () => {
        const { data, error } = await supabase
        .from("recruit_language")
        .select("id, language_name, language_slug")
        .order("id");

        if (error) {
            console.error("Language Error:", error);
            return;
        }

        const languageData = data ?? [];

        setLanguages(languageData);

        const savedLang =
        localStorage.getItem("language_slug");

        const defaultLang =
        savedLang &&
        languageData.some(
            (item) => item.language_slug === savedLang
        )
            ? savedLang
            : languageData[0]?.language_slug;

        if (defaultLang) {
        setLocale(defaultLang);
        localStorage.setItem(
            "language_slug",
            defaultLang
        );
        }
    };

    loadLanguages();
    }, [setLocale]);

    const handleChange = (
        e: React.ChangeEvent<HTMLSelectElement>
        ) => {
            const value = e.target.value;

            setLocale(value);

            localStorage.setItem(
                "language_slug",
                value
            );
    };

  return (
    <header className="w-full border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="text-base font-semibold text-gray-900">
          Recruitment System
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-gray-500 sm:block">
            Language
          </span>

          <select
            className="min-w-[140px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={locale}
            onChange={handleChange}
          >
            {languages.length === 0 ? (
              <option value="">No language</option>
            ) : (
              languages.map((lang) => (
                <option key={lang.language_slug} value={lang.language_slug}>
                  {lang.language_name.toUpperCase()}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </header>
  );
}