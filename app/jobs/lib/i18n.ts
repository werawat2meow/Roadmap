import type { Translation } from "@/app/jobs/types/common";

type MultiLangLike = Translation | Record<string, string> | null | undefined;

export const getText = (value: MultiLangLike, locale: string = "TH") => {
  if (!value) return "";

  const normalizedLocale = locale.toUpperCase();
  const directValue =
    (value as Record<string, string>)[locale] ??
    (value as Record<string, string>)[locale.toUpperCase()] ??
    (value as Record<string, string>)[locale.toLowerCase()] ??
    (value as Record<string, string>)[normalizedLocale];

  if (typeof directValue === "string" && directValue.trim()) {
    return directValue;
  }

  if ("th" in value || "en" in value) {
    const translation = value as Translation;
    if (normalizedLocale === "TH") return translation.th || "";
    if (normalizedLocale === "EN") return translation.en || "";
  }

  return "";
};