import { storageKey } from "./storageUrl.mjs";

const DEFINITIVE_MUTATION_CODES = new Set([
  "40001",
  "40P01",
  "23505",
  "23503",
  "22023",
  "42501",
  "PGRST202",
  "42883",
]);

export function pairPhotoFilesWithSlots(files, slots) {
  if (!Array.isArray(files) || !Array.isArray(slots) || files.length !== slots.length) {
    throw new Error("จำนวนไฟล์และตำแหน่งรูปไม่ตรงกัน");
  }
  return files.map((file, index) => ({ file, slot: slots[index] }));
}

export function shouldCleanupAttemptObjects({ commitStarted, errorCode, isOrientationError } = {}) {
  return !commitStarted || isOrientationError === true || DEFINITIVE_MUTATION_CODES.has(errorCode);
}

export async function finalizePhotoReplacement(result, endpoint, bucket, deleteObject) {
  if (!result || !Array.isArray(result.photo_ids) || !Array.isArray(result.cleanup_path_urls)) {
    throw new Error("ผลการบันทึกรูปไม่สมบูรณ์");
  }
  const keys = [];
  for (const pathUrl of result.cleanup_path_urls) {
    const key = storageKey(pathUrl, endpoint, bucket);
    if (!key) throw new Error("ตำแหน่งไฟล์เก่าไม่ตรงกับ DigitalOcean Spaces ที่กำหนด");
    if (!keys.includes(key)) keys.push(key);
  }
  for (const key of keys) await deleteObject(key);
  return { id: result.id, photo_ids: result.photo_ids };
}
