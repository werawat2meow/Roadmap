import { Translation } from "@/app/jobs/types/common";

export const getText = (
  value: Translation,
  locale: string = "TH"
) => {
  return value?.[locale as keyof Translation] || "";
};