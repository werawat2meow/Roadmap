"use client";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

export default function PhoneField({
  label = "เบอร์โทร",
  value = "",
  required = false,
  disabled = false,
  onChange,
}) {
  const normalizedValue = value?.startsWith("+")
    ? value.replace("+", "")
    : value || "";

  const phoneForValidate = normalizedValue ? `+${normalizedValue}` : "";

  const valid = phoneForValidate
    ? isValidPhoneNumber(phoneForValidate)
    : null;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <PhoneInput
        country="th"
        enableSearch
        disabled={disabled}
        countryCodeEditable={false}
        value={normalizedValue}
        onChange={(phone) => onChange?.(phone ? `+${phone}` : "")}
        inputClass={`
          !w-full !rounded-2xl !border !px-4 !py-3 !pl-14 !text-sm !h-auto
          ${
            valid === true
              ? "!border-green-500"
              : valid === false
              ? "!border-red-500"
              : "!border-slate-300"
          }
        `}
        buttonClass="!rounded-l-2xl !border-slate-300"
        containerClass="!w-full"
      />

      {valid === true && (
        <div className="mt-2 flex items-center text-sm text-green-600">
          <CheckCircleFilled className="mr-2" />
          เบอร์โทรถูกต้อง
        </div>
      )}

      {valid === false && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <CloseCircleFilled className="mr-2" />
          เบอร์โทรไม่ถูกต้อง
        </div>
      )}
    </div>
  );
}