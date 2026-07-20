/* =========================
   Common Validators
========================= */

import { parsePhoneNumberFromString, isValidPhoneNumber } from "libphonenumber-js";

export function onlyDigits(value = "") {
  return String(value || "").replace(/\D/g, "");
}

export function isValidEmail(value = "") {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function isValidThaiCitizenId(value = "") {
  const digits = onlyDigits(value).slice(0, 13);

  if (digits.length !== 13) return false;
  if (/^(\d)\1{12}$/.test(digits)) return false;

  const sum = digits
    .slice(0, 12)
    .split("")
    .reduce((total, digit, index) => {
      return total + Number(digit) * (13 - index);
    }, 0);

  const checkDigit = (11 - (sum % 11)) % 10;

  return checkDigit === Number(digits[12]);
}

export function isValidThaiTaxId(value = "") {
  return isValidThaiCitizenId(value);
}

export function isValidPassport(value = "") {
  const passport = String(value || "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();

  if (!passport) return true;

  return /^[A-Z0-9]{6,12}$/.test(passport);
}

export function cleanPassport(value = "") {
  return String(value || "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 12);
}

export function normalizeWebsite(value = "") {
  const text = String(value || "").trim();

  if (!text) return "";

  return text.startsWith("http") ? text : `https://${text}`;
}

export function isThaiZipCode(value = "") {
  const digits = onlyDigits(value);
  return /^\d{5}$/.test(digits);
}

export function cleanThaiZipCode(value = "") {
  return onlyDigits(value).slice(0, 5);
}

export function isOnlyNumber(value = "") {
  return /^\d+$/.test(String(value || ""));
}

export function normalizeThaiPhone(value = "") {
  const raw = String(value || "").trim();

  if (!raw) return "";

  // เหลือเฉพาะตัวเลขและเครื่องหมาย +
  const cleaned = raw.replace(/[^\d+]/g, "");

  // กรณีผู้ใช้กรอก 66812345678 แต่ไม่มี +
  const normalizedInput =
    cleaned.startsWith("66") && !cleaned.startsWith("+")
      ? `+${cleaned}`
      : cleaned;

  const phone = parsePhoneNumberFromString(normalizedInput, "TH");

  if (!phone) return normalizedInput;

  return phone.number;
}

export function isValidThaiPhone(value = "") {
  const raw = String(value || "").trim();

  if (!raw) return true;

  try {
    const normalized = normalizeThaiPhone(raw);
    const phone = parsePhoneNumberFromString(normalized, "TH");

    return Boolean(
      phone &&
      phone.country === "TH" &&
      isValidPhoneNumber(phone.number)
    );
  } catch {
    return false;
  }
}

export function isValidPhone(value = "") {
  if (!value) return true;

  try {
    return isValidPhoneNumber(String(value));
  } catch {
    return false;
  }
}

export function isValidWebsite(value = "") {
  if (!value) return true;

  try {
    const normalized = String(value).startsWith("http://") ||
      String(value).startsWith("https://")
      ? String(value)
      : `https://${String(value)}`;

    const url = new URL(normalized);

    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.hostname.includes(".") &&
      !url.hostname.startsWith(".") &&
      !url.hostname.endsWith(".")
    );
  } catch {
    return false;
  }
}

export function normalizeThaiTaxId(value = "") {
  return String(value).replace(/\D/g, "");
}

export function formatThaiTaxId(value = "") {
  const digits = normalizeThaiTaxId(value);

  if (digits.length !== 13) return value;

  return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits[12]}`;
}