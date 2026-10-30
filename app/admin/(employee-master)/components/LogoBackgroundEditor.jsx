"use client";

import { useEffect, useState } from "react";

// Conservative, browser-only editor. Never substitutes for full semantic segmentation.
async function prepareLogo(file, mode, tolerance, trim) {
  if (mode === "original" && !trim) return file;
  const bitmap = await createImageBitmap(file);
  try {
    const w = bitmap.width, h = bitmap.height;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("ไม่สามารถอ่านข้อมูลรูปภาพได้");
    ctx.drawImage(bitmap, 0, 0);
    const image = ctx.getImageData(0, 0, w, h);
    const data = image.data;
    const originalVisible = (() => { let n = 0; for (let i = 3; i < data.length; i += 4) if (data[i] > 16) n++; return n; })();
    if (mode !== "original") {
      const samples = [];
      const add = (x, y) => {
        const i = (y * w + x) * 4;
        if (data[i + 3] > 200) samples.push([data[i], data[i + 1], data[i + 2]]);
      };
      for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 200))) { add(x, 0); add(x, h - 1); }
      for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 200))) { add(0, y); add(w - 1, y); }
      if (samples.length) {
        // Median of edge pixels works well for near-uniform backgrounds; avoid guesses on complex edges.
        const sorted = [0, 1, 2].map(c => samples.map(s => s[c]).sort((a, b) => a - b));
        const bg = sorted.map(v => v[Math.floor(v.length / 2)]);
        const distance = (p) => Math.max(Math.abs(data[p] - bg[0]), Math.abs(data[p + 1] - bg[1]), Math.abs(data[p + 2] - bg[2]));
        const edgeMatches = samples.filter(s => Math.max(...s.map((v, c) => Math.abs(v - bg[c]))) <= tolerance).length;
        if (edgeMatches / samples.length < 0.7) throw new Error("ขอบภาพมีหลายสี ระบบไม่สามารถระบุพื้นหลังได้อย่างปลอดภัย กรุณาใช้โหมดต้นฉบับหรือไฟล์โปร่งใส");
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0, tail = 0;
        const eligible = idx => data[idx * 4 + 3] > 0 && distance(idx * 4) <= tolerance;
        const enqueue = idx => {
          if (visited[idx] || !eligible(idx)) return;
          visited[idx] = 1; queue[tail++] = idx;
        };
        for (let x = 0; x < w; x++) { enqueue(x); enqueue((h - 1) * w + x); }
        for (let y = 0; y < h; y++) { enqueue(y * w); enqueue(y * w + w - 1); }
        while (head < tail) {
          const pos = queue[head++], x = pos % w;
          if (x) enqueue(pos - 1);
          if (x < w - 1) enqueue(pos + 1);
          if (pos >= w) enqueue(pos - w);
          if (pos < w * (h - 1)) enqueue(pos + w);
        }
        // Only remove the edge-connected region unless user opts into internal holes.
        for (let i = 0; i < tail; i++) data[queue[i] * 4 + 3] = 0;
        if (mode === "holes") {
          const checked = new Uint8Array(w * h);
          for (let start = 0; start < w * h; start++) {
            if (visited[start] || checked[start] || !eligible(start)) continue;
            head = 0; tail = 0;
            queue[tail++] = start; checked[start] = 1;
            let touchesEdge = false;
            let minX = w, minY = h, maxX = 0, maxY = 0;
            while (head < tail) {
              const pos = queue[head++], x = pos % w, y = Math.floor(pos / w);
              minX = Math.min(minX, x); maxX = Math.max(maxX, x);
              minY = Math.min(minY, y); maxY = Math.max(maxY, y);
              if (!x || x === w - 1 || !y || y === h - 1) touchesEdge = true;
              for (const next of [x ? pos - 1 : -1, x < w - 1 ? pos + 1 : -1, y ? pos - w : -1, y < h - 1 ? pos + w : -1]) {
                if (next < 0 || checked[next] || !eligible(next)) continue;
                checked[next] = 1; queue[tail++] = next;
              }
            }
            // Never remove large enclosed areas (e.g. interiors of circular badge logos).
            const size = tail / (w * h);
            const breadth = Math.max((maxX - minX + 1) / w, (maxY - minY + 1) / h);
            if (!touchesEdge && size <= 0.015 && breadth <= 0.22) {
              for (let i = 0; i < tail; i++) data[queue[i] * 4 + 3] = 0;
            }
          }
        }
      }
      // Do not output a heavily damaged/empty logo due to mistaken background classification.
      let remaining = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 16) remaining++;
      if (originalVisible > 0 && remaining < originalVisible * 0.12) {
        throw new Error("ระบบตรวจพบว่าการลบพื้นหลังจะทำให้โลโก้หายไปเกือบทั้งหมด กรุณาใช้โหมดต้นฉบับ");
      }
      ctx.putImageData(image, 0, 0);
    }
    let left = 0, top = 0, right = w - 1, bottom = h - 1;
    if (trim) {
      left = w; top = h; right = -1; bottom = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] <= 8) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      if (right < left) throw new Error("ไม่พบโลโก้ในรูปภาพ กรุณาลดค่าความไวหรือใช้ต้นฉบับ");
      const pad = Math.max(2, Math.round(Math.max(right - left + 1, bottom - top + 1) * 0.04));
      left = Math.max(0, left - pad); top = Math.max(0, top - pad);
      right = Math.min(w - 1, right + pad); bottom = Math.min(h - 1, bottom + pad);
    }
    const out = document.createElement("canvas");
    out.width = right - left + 1; out.height = bottom - top + 1;
    out.getContext("2d").drawImage(canvas, left, top, out.width, out.height, 0, 0, out.width, out.height);
    const blob = await new Promise((resolve, reject) => out.toBlob(b => b ? resolve(b) : reject(new Error("สร้างไฟล์รูปภาพไม่สำเร็จ")), "image/png"));
    return new File([blob], "branch-logo-processed.png", { type: "image/png" });
  } finally { bitmap.close(); }
}

export default function LogoBackgroundEditor({ file, saving = false, onClose, onConfirm }) {
  const [mode, setMode] = useState("original");
  const [tolerance, setTolerance] = useState(24);
  const [trim, setTrim] = useState(false);
  const [preview, setPreview] = useState("");
  const [output, setOutput] = useState(null);
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let url = "";
    setProcessing(true); setError(""); setOutput(null); setPreview("");
    prepareLogo(file, mode, tolerance, trim).then(result => {
      if (cancelled) return;
      url = URL.createObjectURL(result);
      setOutput(result); setPreview(url);
    }).catch(err => { if (!cancelled) setError(err.message || "ไม่สามารถประมวลผลรูปได้"); })
      .finally(() => { if (!cancelled) setProcessing(false); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [file, mode, tolerance, trim]);
  if (!file) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="จัดการพื้นหลังโลโก้">
        <div className="border-b px-5 py-4"><h2 className="text-lg font-bold">ตรวจสอบพื้นหลังโลโก้</h2><p className="text-xs text-slate-500">ดูผลจริงก่อนอัปโหลด เปลี่ยนกลับไปใช้ไฟล์ต้นฉบับได้เสมอ</p></div>
        <div className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
          <div className="flex h-56 items-center justify-center overflow-hidden rounded-xl border" style={{ backgroundColor: "#d1d5db", backgroundImage: "linear-gradient(45deg,#fff 25%,transparent 25%),linear-gradient(-45deg,#fff 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#fff 75%),linear-gradient(-45deg,transparent 75%,#fff 75%)", backgroundSize: "24px 24px", backgroundPosition: "0 0,0 12px,12px -12px,-12px 0" }}>
            {processing ? <span>กำลังสร้างตัวอย่าง...</span> : preview ? <img src={preview} alt="ตัวอย่างโลโก้ก่อนอัปโหลด" className="h-full w-full object-contain" /> : <span className="text-slate-600">ไม่สามารถแสดงตัวอย่างได้</span>}
          </div>
          <fieldset className="space-y-2 text-sm"><legend className="font-semibold">วิธีจัดการพื้นหลัง</legend>
            {[["original", "คงภาพต้นฉบับ (ปลอดภัยที่สุด)"], ["outside", "ลบพื้นหลังที่ต่อถึงขอบรูป"], ["holes", "ลบพื้นหลังด้านนอกและช่องปิดขนาดเล็ก"]].map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-2"><input type="radio" name="branch-logo-bg" value={value} checked={mode === value} onChange={() => setMode(value)} />{label}</label>)}
          </fieldset>
          {mode !== "original" && <label className="block text-sm">ความไวต่อสีพื้นหลัง: {tolerance}<input aria-label="ความไวต่อสีพื้นหลัง" className="mt-2 w-full" type="range" min="8" max="64" step="4" value={tolerance} onChange={e => setTolerance(Number(e.target.value))}/></label>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={trim} onChange={e => setTrim(e.target.checked)}/>ตัดขอบโปร่งใสส่วนเกิน</label>
          {error && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}<div className="mt-1">ลองลดความไวหรือเปลี่ยนเป็นโหมดต้นฉบับ</div></div>}
          <p className="text-xs text-slate-500">การลบพื้นหลังเป็นการคาดเดาจากสีขอบภาพ โลโก้ที่มีลวดลายซับซ้อนหรือสีซ้ำกับพื้นหลังอาจต้องใช้ไฟล์ PNG โปร่งใสจากต้นฉบับ</p>
        </div>
        <div className="flex justify-end gap-2 border-t p-4"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border px-4 py-2">ย้อนกลับ</button><button type="button" onClick={() => output && onConfirm(output)} disabled={!output || processing || saving} className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-40">{saving ? "Uploading..." : "ยืนยันและอัปโหลด"}</button></div>
      </div>
    </div>
  );
}
