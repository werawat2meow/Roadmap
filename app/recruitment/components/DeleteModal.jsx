"use client";

export default function DeleteModal({
  open,
  title = "ยืนยันการลบข้อมูล",
  message = "ต้องการลบข้อมูลนี้หรือไม่",
  itemName = "",
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-3 text-sm text-slate-600">
          {message}
        </p>

        {itemName && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-800">
            {itemName}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "กำลังลบ..." : "ลบข้อมูล"}
          </button>
        </div>
      </div>
    </div>
  );
}