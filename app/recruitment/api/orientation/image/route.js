import { GetObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { spacesClient } from "@/lib/spaces";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { orientationAccess } from "../../../lib/orientation/access";
import { orientationData } from "../../../lib/orientation/readData.mjs";
import { evidenceForRows } from "../../../lib/orientation/evidence.mjs";
import { storageKey } from "../../../lib/orientation/storageUrl.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The browser supplies an application ID, never a URL or arbitrary storage key.
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const applicationId = params.get("application_id");
  const kind = params.get("kind") || "profile";
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(applicationId || "") || !["profile", "logo", "activity"].includes(kind)) {
    return new Response(null, { status: 400 });
  }
  const guard = await orientationAccess("export");
  if (!guard.ok) return guard.response;
  try {
    const { rows } = await orientationData(supabaseAdmin, guard, { applicationId });
    const row = rows[0];
    let key;
    if (kind === "activity") {
      const photoId = params.get("photo_id");
      const evidence = await evidenceForRows(supabaseAdmin, rows);
      if (!evidence[0]?.photos.some((photo) => photo.id === photoId)) return new Response(null, { status: 404 });
      const { data, error } = await supabaseAdmin.from("recruit_orientation_photos").select("path_url").eq("id", photoId).single();
      if (error) throw error;
      key = storageKey(data.path_url, process.env.DO_SPACES_ENDPOINT, process.env.DO_SPACES_BUCKET);
    } else {
    const value = kind === "logo" ? row?.branch_logo_url : row?.photo_url;
    if (!value) return new Response(null, { status: 404 });
    const url = new URL(value);
    const endpoint = new URL(process.env.DO_SPACES_ENDPOINT);
    const bucket = process.env.DO_SPACES_BUCKET;
    if (url.protocol !== "https:" || url.username || url.password || url.port) return new Response(null, { status: 404 });
    if (url.hostname === `${bucket}.${endpoint.hostname}`) key = decodeURIComponent(url.pathname.slice(1));
    else if (url.hostname === endpoint.hostname && url.pathname.startsWith(`/${bucket}/`)) key = decodeURIComponent(url.pathname.slice(bucket.length + 2));
    }
    if (!key) return new Response(null, { status: 404 });
    const object = await spacesClient.send(new GetObjectCommand({ Bucket: process.env.DO_SPACES_BUCKET, Key: key }), { abortSignal: AbortSignal.timeout(15000) });
    const limit = 8 * 1024 * 1024;
    if ((object.ContentLength || 0) > limit) { object.Body?.destroy?.(); return new Response(null, { status: 413 }); }
    const chunks = [];
    let size = 0;
    for await (const chunk of object.Body) {
      size += chunk.length;
      if (size > limit) { object.Body.destroy?.(); return new Response(null, { status: 413 }); }
      chunks.push(chunk);
    }
    const pipeline = sharp(Buffer.concat(chunks), { limitInputPixels: 40000000 });
    const meta = await pipeline.metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format)) return new Response(null, { status: 415 });
    let image = await pipeline.rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).png().toBuffer();
    let mime = "image/png";
    if (image.length > 3 * 1024 * 1024) {
      image = await sharp(image).resize({ width: 1000, height: 1000, fit: "inside" }).webp({ quality: 90 }).toBuffer();
      mime = "image/webp";
    }
    return new Response(image, { headers: { "Content-Type": mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response(null, { status: 502 });
  }
}
