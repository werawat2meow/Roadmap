"use client";

import {
  VIEW_MODES,
} from "../utils/scopeUtils";

export default function ManagementToolbar({

  search,

  onSearch,

  viewMode,

  onChangeView,

}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

        <div className="flex-1">

          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ค้นหา..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />

        </div>

        <div className="grid grid-cols-3 gap-2">

          <button
            onClick={() =>
              onChangeView(
                VIEW_MODES.ORG_CHART
              )
            }
            className={
              viewMode === VIEW_MODES.ORG_CHART
                ? "rounded-xl bg-slate-900 px-4 py-2 text-white"
                : "rounded-xl border px-4 py-2"
            }
          >
            Org Chart
          </button>

          <button
            onClick={() =>
              onChangeView(
                VIEW_MODES.TREE
              )
            }
            className={
              viewMode === VIEW_MODES.TREE
                ? "rounded-xl bg-slate-900 px-4 py-2 text-white"
                : "rounded-xl border px-4 py-2"
            }
          >
            Tree
          </button>

          <button
            onClick={() =>
              onChangeView(
                VIEW_MODES.TABLE
              )
            }
            className={
              viewMode === VIEW_MODES.TABLE
                ? "rounded-xl bg-slate-900 px-4 py-2 text-white"
                : "rounded-xl border px-4 py-2"
            }
          >
            Table
          </button>

        </div>

      </div>

    </div>
  );
}