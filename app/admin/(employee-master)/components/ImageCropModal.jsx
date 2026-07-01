"use client";

import { useState } from "react";
import Cropper from "react-easy-crop";
import getCroppedBranchImage from "@/lib/cropBranchImage";

export default function ImageCropModal({
  open,
  imageSrc,
  aspect = 16 / 9,
  outputWidth = 1200,
  outputHeight = 675,
  saving = false,
  onClose,
  onComplete,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const croppedFile = await getCroppedBranchImage(
      imageSrc,
      croppedAreaPixels,
      outputWidth,
      outputHeight
    );

    onComplete(croppedFile);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-800">
            จัดตำแหน่งรูปภาพ
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            เลื่อนรูปและซูมให้พอดีกับพื้นที่แสดงผล
          </p>
        </div>

        <div className="p-6">
          <div className="relative h-[420px] overflow-hidden rounded-3xl bg-slate-900">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedPixels) =>
                setCroppedAreaPixels(croppedPixels)
              }
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              ซูมรูป
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
              saving
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {saving ? "Uploading..." : "Crop & Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}