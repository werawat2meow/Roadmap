"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function CompensationPolicyPagination({
  loading = false,

  page = 1,
  pageSize = 10,
  total = 0,

  pageSizeOptions = [10, 20, 50, 100],

  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  const start =
    total === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const end = Math.min(
    page * pageSize,
    total
  );

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">

      {/* Left */}

      <div className="text-sm text-slate-600">

        Showing

        <span className="mx-1 font-semibold">
          {start}
        </span>

        -

        <span className="mx-1 font-semibold">
          {end}
        </span>

        of

        <span className="ml-1 font-semibold">
          {total}
        </span>

        records

      </div>

      {/* Right */}

      <div className="flex flex-wrap items-center gap-3">

        <select
          disabled={loading}
          value={pageSize}
          onChange={(e) =>
            onPageSizeChange?.(
              Number(e.target.value)
            )
          }
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        >
          {pageSizeOptions.map((size) => (
            <option
              key={size}
              value={size}
            >
              {size} / page
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() =>
            onPageChange?.(page - 1)
          }
          className="rounded-2xl border border-slate-300 p-2 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <div className="rounded-2xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700">

          {page} / {totalPages}

        </div>

        <button
          type="button"
          disabled={
            loading ||
            page >= totalPages
          }
          onClick={() =>
            onPageChange?.(page + 1)
          }
          className="rounded-2xl border border-slate-300 p-2 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>

      </div>

    </div>
  );
}