import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { deleteFileFromSpaces, uploadFileToSpaces } from "@/lib/spaces";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { boundedBody, sameOrigin, mutationGuard, previousResult, prepareMutation, commitMutation, mutationError } from "../../../lib/orientation/mutationServer";
import { OrientationError, uuid } from "../../../lib/orientation/mutations.mjs";

import { MAX_PHOTO_BYTES, photoReplaceSelectionError } from "../../../lib/orientation/photoUpload.mjs";
import { finalizePhotoReplacement, pairPhotoFilesWithSlots, shouldCleanupAttemptObjects } from "../../../lib/orientation/photoReplacement.mjs";
import { storageUrl } from "../../../lib/orientation/storageUrl.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let payload, guard, commitStarted = false;
  const storageKeys = [];
  const fullUrl = (key) => storageUrl(key, process.env.DO_SPACES_ENDPOINT, process.env.DO_SPACES_BUCKET);
  try {
    sameOrigin(request);
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data;")) throw new OrientationError("ต้องส่ง multipart/form-data", 415);
    const bytes = await boundedBody(request, 4 * 1024 * 1024);
    let form;
    try { form = await new Response(bytes, { headers: { "Content-Type": contentType } }).formData(); }
    catch { throw new OrientationError("รูปแบบอัปโหลดไม่ถูกต้อง"); }
    const files = form.getAll("files");
    try { payload = JSON.parse(form.get("payload")); } catch { throw new OrientationError("ข้อมูลรูปไม่ถูกต้อง"); }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new OrientationError("ข้อมูลรูปไม่ถูกต้อง");
    const selectionError = photoReplaceSelectionError(payload.photo_type, payload.photo_slots);
    if (selectionError) throw new OrientationError(selectionError);
    let fileSlots;
    try { fileSlots = pairPhotoFilesWithSlots(files, payload.photo_slots); }
    catch (error) { throw new OrientationError(error.message); }
    if (files.some((file) => typeof file === "string" || !file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type))) throw new OrientationError("รองรับ JPG/PNG/WebP เท่านั้น", 415);
    if (files.some((file) => file.size > MAX_PHOTO_BYTES)) throw new OrientationError("ขนาดรูปต้องไม่เกิน 5 MB ต่อรูป", 413);
    payload.action = "photo.replace"; uuid(payload.session_id); uuid(payload.request_id);
    const inputs = await Promise.all(fileSlots.map(async ({ file }) => Buffer.from(await file.arrayBuffer())));
    payload.file_sha256 = inputs.map((input) => createHash("sha256").update(input).digest("hex"));
    if (new Set(payload.file_sha256).size !== files.length) throw new OrientationError("กรุณาเลือกรูปไม่ซ้ำกันในชุด");
    guard = await mutationGuard(payload); if (!guard.ok) return guard.response;
    const existing = await previousResult(guard, payload);
    if (existing) {
      const data = await finalizePhotoReplacement(existing, process.env.DO_SPACES_ENDPOINT, process.env.DO_SPACES_BUCKET, deleteFileFromSpaces);
      return Response.json({ success: true, data, replayed: true });
    }
    const uploads = [];
    for (const [index, input] of inputs.entries()) {
      const source = sharp(input, { limitInputPixels: 40000000 });
      let metadata, output;
      try {
        metadata = await source.metadata();
        if (!["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages || 1) > 1) throw new OrientationError("รองรับภาพนิ่ง JPG/PNG/WebP เท่านั้น", 415);
        output = await source.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer({ resolveWithObject: true });
      } catch (error) {
        if (error instanceof OrientationError) throw error;
        throw new OrientationError("ไฟล์ภาพเสียหายหรือมีขนาดพิกเซลเกินกำหนด");
      }
      const folder = `orientation/${payload.session_id}/${payload.photo_type}`;
      const baseName = `${payload.request_id}-${randomUUID()}`;
      const key = `${folder}/${baseName}.webp`;
      const file = new File([output.data], `${baseName}.webp`, { type: "image/webp" });
      uploads.push({ key, folder, baseName, file, metadata: { path_url: fullUrl(key), original_filename: fileSlots[index].file.name.slice(0, 240), slot: fileSlots[index].slot } });
    }
    const prepared = await prepareMutation(guard, payload, { photoMetadata: uploads.map((item) => item.metadata) });
    for (const [index, item] of uploads.entries()) {
      // Each attempt owns its keys, including when two identical requests race.
      storageKeys.push(item.key);
      const uploaded = await uploadFileToSpaces(item.file, item.folder, item.baseName, {
        acl: null,
        abortSignal: AbortSignal.timeout(20000),
        metadata: { request_id: payload.request_id, sha256: payload.file_sha256[index] },
      });
      // The prevalidated write plan and cleanup must reference the exact object
      // returned by the shared uploader; never commit a guessed file location.
      if (uploaded.key !== item.key || uploaded.url !== item.metadata.path_url) throw new OrientationError("ตำแหน่งไฟล์ที่อัปโหลดไม่ตรงกับข้อมูลที่เตรียมบันทึก");
    }
    commitStarted = true;
    const internalResult = await commitMutation(request, guard, payload, prepared);
    const data = await finalizePhotoReplacement(internalResult, process.env.DO_SPACES_ENDPOINT, process.env.DO_SPACES_BUCKET, deleteFileFromSpaces);
    await cleanupUnused();
    return Response.json({ success: true, data });
  } catch (error) {
    if (storageKeys.length && guard?.ok) {
      try {
        const existing = await previousResult(guard, payload);
        if (existing) {
          const data = await finalizePhotoReplacement(existing, process.env.DO_SPACES_ENDPOINT, process.env.DO_SPACES_BUCKET, deleteFileFromSpaces);
          await cleanupUnused();
          return Response.json({ success: true, data, replayed: true });
        }
        if (shouldCleanupAttemptObjects({ commitStarted, errorCode: error?.code, isOrientationError: error instanceof OrientationError })) await cleanupUnused();
        // Unknown RPC outcomes retain objects: the transaction may still commit.
      } catch { console.error("ORIENTATION_UPLOAD_RETRY_REQUIRED", { request_id: payload?.request_id }); }
    }
    return mutationError(error);
  }
  async function cleanupUnused() {
    // A confirmed commit/replay or rejection makes unreferenced attempt keys safe
    // to remove. Never run this during an ambiguous in-flight transaction.
    try {
      const { data, error } = await supabaseAdmin.from("recruit_orientation_photos").select("path_url").in("path_url", storageKeys.map(fullUrl));
      if (error) throw error;
      const used = new Set(data.map((row) => row.path_url));
      for (const key of storageKeys) if (!used.has(fullUrl(key))) await deleteFileFromSpaces(key);
    } catch { console.error("ORIENTATION_UNUSED_UPLOAD_CLEANUP_REQUIRED", { request_id: payload?.request_id }); }
  }
}
