export const MAX_BATCH_PHOTOS = 9;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export function photoFileError(file) {
  if (!file || !file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "รองรับ JPG/PNG/WebP เท่านั้น";
  if (file.size > MAX_PHOTO_BYTES) return `${file.name || "รูปภาพ"}: ขนาดต้องไม่เกิน 5 MB ต่อรูป`;
  return "";
}
export function photoCountError(type, count) {
  if (!["orientation", "site_visit", "handover"].includes(type)) return "เลือกหมวดรูปก่อน";
  if (type !== "handover" && count !== 3) return "Orientation และ Site Visit ต้องเลือกครั้งละ 3 รูป";
  if (type === "handover" && (count < 1 || count > MAX_BATCH_PHOTOS)) return `รูปส่งมอบเลือกได้ครั้งละ 1–${MAX_BATCH_PHOTOS} รูป และเพิ่มชุดใหม่ได้`;
  return "";
}

export function photoReplaceSelectionError(type, slots) {
  if (!["orientation", "site_visit", "handover"].includes(type)) return "เลือกหมวดรูปก่อน";
  if (!Array.isArray(slots) || !slots.length) return "กรุณาเลือกรูปอย่างน้อย 1 รูป";
  const limit = type === "handover" ? MAX_BATCH_PHOTOS : 3;
  if (slots.length > limit || slots.some((slot) => !Number.isInteger(slot) || slot < 0 || slot >= limit) || new Set(slots).size !== slots.length) {
    return "ตำแหน่งรูปไม่ถูกต้อง";
  }
  if (type === "handover" && slots.some((slot, index) => slot !== index)) return "รูปส่งมอบต้องเรียงต่อกันตั้งแต่รูปที่ 1";
  return "";
}
