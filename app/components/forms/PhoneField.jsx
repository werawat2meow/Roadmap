"use client";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {CheckCircleFilled,CloseCircleFilled,} from "@ant-design/icons";
import {isValidThaiPhone,normalizeThaiPhone,} from "@/lib/validators";

export default function PhoneField({label = "เบอร์โทร",value = "",required = false,disabled = false,onChange,}) {
  const normalizedValue = String(value || "").replace(/^\+/, "");
  const valid = value ? isValidThaiPhone(value) : null;
  const handleChange = (phone) => {
    if (!phone) {
      onChange?.("");
      return;
    }

    const normalized = normalizeThaiPhone(`+${phone}`);

    onChange?.(normalized);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <PhoneInput
        country="th"
        onlyCountries={["th"]}
        countryCodeEditable={false}
        enableSearch={false}
        disabled={disabled}
        value={normalizedValue}
        onChange={handleChange}
        inputProps={{
          name: "phone",
          autoComplete: "tel",
        }}
        inputClass={`
          !h-[46px]
          !w-full
          !rounded-2xl
          !py-3
          !pl-14
          !pr-4
          !text-sm
          ${
            valid === true
              ? "!border-green-500"
              : valid === false
              ? "!border-red-500"
              : "!border-slate-300"
          }
        `}
        buttonClass={`
          !rounded-l-2xl
          ${
            valid === true
              ? "!border-green-500"
              : valid === false
              ? "!border-red-500"
              : "!border-slate-300"
          }
        `}
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