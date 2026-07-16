import { uiText } from "@/app/jobs/components/translations";

export function getUIText(
  text: Record<string, string>,
  locale: string
): string {
  return (
    text[locale] ??
    text.en ??
    Object.values(text)[0] ??
    ""
  );
}