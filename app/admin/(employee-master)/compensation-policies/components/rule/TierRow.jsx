"use client";

export default function TierRow({
  tier,
  index,
  updateTier,
  removeTier,
  duplicateTier,
  moveTier,
}) {
  return (
    <div className="grid grid-cols-12 items-end gap-4 p-5">

      {/* From */}

      <div className="col-span-2">

        <label className="text-xs font-semibold">
          From
        </label>

        <input
          type="number"
          value={tier.from}
          onChange={(e) =>
            updateTier(
              index,
              "from",
              e.target.value
            )
          }
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
        />

      </div>

      {/* To */}

      <div className="col-span-2">

        <label className="text-xs font-semibold">
          To
        </label>

        <input
          type="number"
          value={tier.to}
          placeholder="Leave blank = Infinity"
          onChange={(e) =>
            updateTier(
              index,
              "to",
              e.target.value
            )
          }
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
        />

        <p className="mt-1 text-xs text-slate-400">
          Blank = No Upper Limit
        </p>

      </div>

      {/* Value */}

      <div className="col-span-3">

        <label className="text-xs font-semibold">
          Value
        </label>

        <input
          type="number"
          value={tier.value}
          onChange={(e) =>
            updateTier(
              index,
              "value",
              e.target.value
            )
          }
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
        />

      </div>

      {/* Type */}

      <div className="col-span-2">

        <label className="text-xs font-semibold">
          Type
        </label>

        <select
          value={tier.value_type}
          onChange={(e) =>
            updateTier(
              index,
              "value_type",
              e.target.value
            )
          }
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
        >
          <option value="fixed">
            Fixed
          </option>

          <option value="percent">
            Percent
          </option>
        </select>

      </div>

      {/* Actions */}

      <div className="col-span-3 flex flex-wrap gap-2">

        <button
          type="button"
          onClick={() =>
            moveTier(index, index - 1)
          }
          className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-100"
        >
          ↑
        </button>

        <button
          type="button"
          onClick={() =>
            moveTier(index, index + 1)
          }
          className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-100"
        >
          ↓
        </button>

        <button
          type="button"
          onClick={() =>
            duplicateTier(index)
          }
          className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-100"
        >
          Duplicate
        </button>

        <button
          type="button"
          onClick={() =>
            removeTier(index)
          }
          className="rounded-lg bg-red-500 px-3 py-2 text-white hover:bg-red-600"
        >
          Delete
        </button>

      </div>

    </div>
  );
}