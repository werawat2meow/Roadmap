import "server-only";

import {
  getAllProvinces,
  getDistrictsByCriterion,
  getSubdistrictsByCriterion,
} from "geothai";

/* =========================
   Province
========================= */
export function getThaiProvinces() {
  return getAllProvinces().map((item) => ({
    code: String(item.code),
    name_th: item.name_th,
    name_en: item.name_en,
  }));
}

/* =========================
   District
========================= */
export function getThaiDistricts(provinceCode) {
  if (!provinceCode) return [];

  return getDistrictsByCriterion({
    province_code: Number(provinceCode),
  }).map((item) => ({
    code: String(item.code),
    province_code: String(item.province_code),
    name_th: item.name_th,
    name_en: item.name_en,
  }));
}

/* =========================
   Subdistrict
========================= */
export function getThaiSubdistricts(districtCode) {
  if (!districtCode) return [];

  return getSubdistrictsByCriterion({
    district_code: Number(districtCode),
  }).map((item) => ({
    code: String(item.code),
    district_code: String(item.district_code),
    province_code: String(item.province_code),
    name_th: item.name_th,
    name_en: item.name_en,
    postcode: String(item.postal_code || ""),
  }));
}



