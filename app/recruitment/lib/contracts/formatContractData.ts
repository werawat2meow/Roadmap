export type ContractNumericValue = number | string | bigint | null | undefined;
export type ContractDateValue = Date | string | null | undefined;

const THAI_DIGITS = [
  "ศูนย์",
  "หนึ่ง",
  "สอง",
  "สาม",
  "สี่",
  "ห้า",
  "หก",
  "เจ็ด",
  "แปด",
  "เก้า",
] as const;

const THAI_PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"] as const;

export function toContractNumber(value: ContractNumericValue): number | null {
  if (value === null || value === undefined || value === "") return null;

  const normalized =
    typeof value === "string" ? value.replaceAll(",", "").trim() : value;
  const result = Number(normalized);

  return Number.isFinite(result) ? result : null;
}

function normalizeGregorianYear(year: number): number {
  return year >= 2400 ? year - 543 : year;
}

function createLocalDate(year: number, month: number, day: number): Date | null {
  const date = new Date(normalizeGregorianYear(year), month - 1, day, 12, 0, 0, 0);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== normalizeGregorianYear(year) ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function parseContractDate(value: ContractDateValue): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  const text = value.trim();
  if (!text) return null;

  const dayFirstMatch = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dayFirstMatch) {
    return createLocalDate(
      Number(dayFirstMatch[3]),
      Number(dayFirstMatch[2]),
      Number(dayFirstMatch[1])
    );
  }

  const yearFirstMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);
  if (yearFirstMatch) {
    return createLocalDate(
      Number(yearFirstMatch[1]),
      Number(yearFirstMatch[2]),
      Number(yearFirstMatch[3])
    );
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatContractDateTH(value: ContractDateValue): string | null {
  const date = parseContractDate(value);
  if (!date) return null;

  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatContractDateEN(value: ContractDateValue): string | null {
  const date = parseContractDate(value);
  if (!date) return null;

  return new Intl.DateTimeFormat("en-GB-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatContractMoney(value: ContractNumericValue): string {
  const amount = toContractNumber(value);
  if (amount === null) return "-";

  const hasSatang = Math.round(Math.abs(amount) * 100) % 100 !== 0;
  const formatted = new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: hasSatang ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} บาท`;
}

function readThaiUnderMillion(value: number): string {
  if (value === 0) return "";

  const digits = String(value).padStart(6, "0").split("").map(Number);
  let result = "";

  digits.forEach((digit, index) => {
    if (digit === 0) return;

    const place = digits.length - index - 1;

    if (place === 1) {
      if (digit === 1) {
        result += THAI_PLACES[place];
      } else if (digit === 2) {
        result += `ยี่${THAI_PLACES[place]}`;
      } else {
        result += `${THAI_DIGITS[digit]}${THAI_PLACES[place]}`;
      }
      return;
    }

    if (place === 0 && digit === 1 && value % 100 > 10) {
      result += "เอ็ด";
      return;
    }

    result += `${THAI_DIGITS[digit]}${THAI_PLACES[place]}`;
  });

  return result;
}

function readThaiInteger(value: number): string {
  if (value === 0) return THAI_DIGITS[0];
  if (value < 1_000_000) return readThaiUnderMillion(value);

  const millions = Math.floor(value / 1_000_000);
  const remainder = value % 1_000_000;

  return `${readThaiInteger(millions)}ล้าน${readThaiUnderMillion(remainder)}`;
}

export function numberToThaiBahtText(value: ContractNumericValue): string {
  const amount = toContractNumber(value);
  if (amount === null) return "-";

  const absoluteAmount = Math.abs(amount);
  const totalSatang = Math.round(absoluteAmount * 100);

  if (!Number.isSafeInteger(totalSatang)) return "-";

  const baht = Math.floor(totalSatang / 100);
  const satang = totalSatang % 100;
  const prefix = amount < 0 ? "ลบ" : "";
  const bahtText = `${readThaiInteger(baht)}บาท`;
  const satangText = satang === 0 ? "ถ้วน" : `${readThaiInteger(satang)}สตางค์`;

  return `${prefix}${bahtText}${satangText}`;
}

