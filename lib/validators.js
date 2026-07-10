/* =========================
   Common Validators
========================= */

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

export function formatThaiTaxId(value = "") {
  const digits = onlyDigits(value).slice(0, 13);

  return digits.replace(
    /^(\d{1})(\d{0,4})(\d{0,5})(\d{0,2})(\d{0,1}).*/,
    (_, a, b, c, d, e) => [a, b, c, d, e].filter(Boolean).join("-")
  );
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

export function isValidWebsite(value = "") {
  if (!value) return true;

  try {
    const url = value.startsWith("http")
      ? value
      : `https://${value}`;

    new URL(url);
    return true;
  } catch {
    return false;
  }
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