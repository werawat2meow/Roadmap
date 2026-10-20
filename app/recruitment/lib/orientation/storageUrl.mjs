// Persist a stable full URL, never a temporary signed URL. Reads still use S3
// credentials and existing permissions; storing this URL does not change ACLs.
export function storageUrl(key, endpoint, bucket) {
  const base = new URL(endpoint);
  if (base.protocol !== "https:" || base.username || base.password || base.port || !bucket || !key) throw new Error("Invalid Spaces location");
  return `https://${bucket}.${base.hostname}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function storageKey(value, endpoint, bucket) {
  try {
    const url = new URL(value);
    const base = new URL(endpoint);
    if (!bucket || url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash) return null;
    let path;
    if (url.hostname === `${bucket}.${base.hostname}`) path = url.pathname.slice(1);
    else if (url.hostname === base.hostname && url.pathname.startsWith(`/${bucket}/`)) path = url.pathname.slice(bucket.length + 2);
    if (!path) return null;
    const key = decodeURIComponent(path);
    return key.split("/").some((part) => part === "." || part === "..") ? null : key;
  } catch { return null; }
}
