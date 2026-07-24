"use client";

export default function PositionPagination({
  page,
  total,
  totalPages,
  loading,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">

      <p className="text-sm text-slate-500">
        ทั้งหมด {total} รายการ
      </p>

      <div className="flex items-center gap-2">

        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={onPrevious}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ก่อนหน้า
        </button>

        <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
          {page} / {totalPages}
        </div>

        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={onNext}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ถัดไป
        </button>

      </div>

    </div>
  );
}