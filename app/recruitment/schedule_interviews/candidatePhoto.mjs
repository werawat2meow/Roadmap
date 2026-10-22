export const MAX_CANDIDATE_PHOTO_BYTES = 5 * 1024 * 1024;

export function candidatePhotoError(file) {
  if (!file || !["image/jpeg", "image/png"].includes(file.type)) {
    return "สามารถอัปโหลดได้เฉพาะ JPG หรือ PNG เท่านั้น";
  }
  if (file.size > MAX_CANDIDATE_PHOTO_BYTES) {
    return "รูปภาพต้องมีขนาดไม่เกิน 5MB";
  }
  return "";
}

export function candidatePhotoFilesError(files) {
  if (!Array.isArray(files) || files.length !== 1) {
    return "กรุณาอัปโหลดรูปผู้สมัครครั้งละ 1 รูป";
  }
  return candidatePhotoError(files[0]);
}
