export function addCacheVersion(url, version) {
  if (!url || version === null || version === undefined || version === "") {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(String(version))}`;
}
