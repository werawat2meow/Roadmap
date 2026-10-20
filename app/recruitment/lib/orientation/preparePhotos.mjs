import { photoFileError } from "./photoUpload.mjs";

// Transport budget only: original files are validated individually, not summed.
// Encode before sending so multi-photo requests fit the serverless body limit.
const TRANSPORT_BYTES = 3 * 1024 * 1024;
const cache = new WeakMap();
async function prepare(file, budget) {
  if (file.size <= budget) return file;
  let entries = cache.get(file);
  if (!entries) { entries = new Map(); cache.set(file, entries); }
  if (entries.has(budget)) return entries.get(budget);
  const bitmap = await new Promise((resolve, reject) => {
    let expired = false;
    const timer = setTimeout(() => { expired = true; reject(new Error("อ่านรูปนานเกินกำหนด กรุณาลองใหม่")); }, 15000);
    Promise.resolve().then(() => createImageBitmap(file)).then((image) => {
      clearTimeout(timer);
      if (expired) image.close(); else resolve(image);
    }, (error) => { clearTimeout(timer); reject(error); });
  });
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000) throw new Error("รูปมีขนาดพิกเซลเกินกำหนด");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("เบราว์เซอร์ไม่รองรับการเตรียมรูป");
    let scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 10; attempt++) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("เตรียมรูปนานเกินกำหนด กรุณาลองใหม่")), 15000);
        canvas.toBlob((result) => { clearTimeout(timer); result ? resolve(result) : reject(new Error("เตรียมรูปไม่สำเร็จ")); }, "image/webp", 0.88);
      });
      if (blob.size <= budget) {
        const result = new File([blob], file.name, { type: blob.type, lastModified: file.lastModified });
        entries.set(budget, result); // Identical bytes for an idempotent retry.
        return result;
      }
      scale *= 0.75;
    }
    throw new Error("ไม่สามารถเตรียมรูปนี้เพื่ออัปโหลดได้ กรุณาเลือกรูปใหม่");
  } finally { bitmap.close(); }
}

export async function preparePhotos(files) {
  for (const file of files) {
    const error = photoFileError(file);
    if (error) throw new Error(error);
  }
  const budget = Math.floor(TRANSPORT_BYTES / Math.max(files.length, 1));
  const prepared = [];
  for (const file of files) prepared.push(await prepare(file, budget));
  return prepared;
}
