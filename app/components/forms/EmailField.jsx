"use client";

import { useEffect, useState } from "react";
import {
  MailOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons";

import { isValidEmail } from "@/lib/validators";

export default function EmailField({
  label = "Email",
  value = "",
  required = false,
  disabled = false,
  placeholder = "example@company.com",
  onChange,
}) {
  const [valid, setValid] = useState(null);

  useEffect(() => {
    if (!value) {
      setValid(null);
      return;
    }

    setValid(isValidEmail(value));
  }, [value]);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <div className="relative">
        <MailOutlined
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="email"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value.trim())}
          className={`
            w-full rounded-2xl
            border
            py-3
            pl-11
            pr-4
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
      </div>

      {valid === true && (
        <div className="mt-2 flex items-center text-sm text-green-600">
          <CheckCircleFilled className="mr-2" />
          Email ถูกต้อง
        </div>
      )}

      {valid === false && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <CloseCircleFilled className="mr-2" />
          รูปแบบ Email ไม่ถูกต้อง
        </div>
      )}
    </div>
  );
}