export function filenamePart(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001F\s._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 70)
    .replace(/_+$/g, "");
}
