"use client";

export default function Pagination({
  page,
  totalPages,
  loading = false,
  onPageChange,
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(1)}
        disabled={page === 1 || loading}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
      >
        First
      </button>

      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1 || loading}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
      >
        Prev
      </button>

      <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
        {page} / {totalPages}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || loading}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
      >
        Next
      </button>

      <button
        type="button"
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages || loading}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
      >
        Last
      </button>
    </div>
  );
}