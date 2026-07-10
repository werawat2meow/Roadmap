"use client";

import { useEffect, useState } from "react";
import {
  CheckCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons";

import {
  formatThaiTaxId,
  isValidThaiTaxId,
  onlyDigits,
} from "@/lib/validators";

export default function TaxIdField({
  label = "เลขประจำตัวผู้เสียภาษี",
  value = "",
  required = false,
  disabled = false,
  placeholder = "เลขประจำตัวผู้เสียภาษี 13 หลัก",
  onChange,
}) {
  const [text, setText] = useState("");
  const [valid, setValid] = useState(null);

  useEffect(() => {
    const digits = onlyDigits(value);

    setText(formatThaiTaxId(digits));

    if (!digits) {
      setValid(null);
      return;
    }

    if (digits.length < 13) {
      setValid(false);
      return;
    }

    setValid(isValidThaiTaxId(digits));
  }, [value]);

  const handleChange = (e) => {
    const digits = onlyDigits(e.target.value).slice(0, 13);

    onChange?.(digits);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        type="text"
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onChange={handleChange}
        className={`
            w-full rounded-2xl
            border
            px-4
            py-3
            text-sm
            outline-none
            transition

            ${
              valid === true
                ? "border-green-500 focus:ring-4 focus:ring-green-100"
                : valid === false
                ? "border-red-500 focus:ring-4 focus:ring-red-100"
                : "border-slate-300 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            }
        `}
      />

      {valid === true && (
        <div className="mt-2 flex items-center text-sm text-green-600">
          <CheckCircleFilled className="mr-2" />

          เลขประจำตัวผู้เสียภาษีถูกต้อง
        </div>
      )}

      {valid === false && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <CloseCircleFilled className="mr-2" />

          เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง
        </div>
      )}
    </div>
  );
}