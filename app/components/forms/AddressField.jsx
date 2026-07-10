"use client";

import { useEffect } from "react";

import {CountrySelect,ProvinceSelect,DistrictSelect,SubDistrictSelect,} from "@/app/components/selectors/location";

export default function AddressField({value = {},disabled = false,onChange,}) {
  
  const update = (field, fieldValue) => {
    onChange?.({
      ...value,
      [field]: fieldValue,
    });
  };

  useEffect(() => {
    if (!value.country_code) {
      update("country_code", "TH");
    }
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          ที่อยู่
        </label>

        <textarea
          rows={3}
          disabled={disabled}
          value={value.address || ""}
          onChange={(e) =>
            update("address", e.target.value)
          }
          className="
            w-full
            rounded-2xl
            border
            border-slate-300
            px-4
            py-3
            text-sm
            outline-none
            focus:border-slate-500
            focus:ring-4
            focus:ring-slate-100
          "
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            ประเทศ
          </label>

          <CountrySelect
            disabled={disabled}
            value={value.country_code}
            onChange={(country) =>
              update("country_code", country)
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            จังหวัด
          </label>

          <ProvinceSelect
            disabled={disabled}
            value={value.province_code}
            onChange={(provinceCode, province) => {
              onChange?.({
                ...value,

                province_code: provinceCode,
                province: province?.name_th || "",

                district_code: "",
                district: "",

                subdistrict_code: "",
                subdistrict: "",

                postcode: "",
              });
            }}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            อำเภอ
          </label>

          <DistrictSelect
            disabled={disabled}
            provinceCode={value.province_code}
            value={value.district_code}
            onChange={(districtCode, district) => {
              onChange?.({
                ...value,

                district_code: districtCode,
                district: district?.name_th || "",

                subdistrict_code: "",
                subdistrict: "",

                postcode: "",
              });
            }}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            ตำบล
          </label>

          <SubDistrictSelect
            disabled={disabled}
            provinceCode={value.province_code}
            districtCode={value.district_code}
            value={value.subdistrict_code}
            onChange={(subdistrictCode, subdistrict) => {
              onChange?.({
                ...value,

                subdistrict_code: subdistrictCode,
                subdistrict: subdistrict?.name_th || "",

                postcode:
                  subdistrict?.postcode || "",
              });
            }}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            รหัสไปรษณีย์
          </label>

          <input
            readOnly
            value={value.postcode || ""}
            className="
              w-full
              rounded-2xl
              border
              border-slate-300
              bg-slate-100
              px-4
              py-3
            "
          />
        </div>
      </div>
    </div>
  );
}