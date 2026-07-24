"use client";

export default function AssignmentSettings({
  form,
  onChange,
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Sort Order
          </label>
          <input
            type="number"
            min="0"
            value={form.sort_order}
            onChange={(e) =>
              onChange(
                "sort_order",
                e.target.value
              )
            }
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              onChange(
                "status",
                e.target.value
              )
            }
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
          >
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <input
          type="checkbox"
          checked={Boolean(
            form.is_primary
          )}
          onChange={(e) =>
            onChange(
              "is_primary",
              e.target.checked
            )
          }
          className="h-5 w-5"
        />
        <div>

          <p className="text-sm font-bold text-slate-700">
            Assignment หลัก
          </p>

          <p className="mt-1 text-xs text-slate-400">
            ใช้ Assignment นี้เป็นสายบังคับบัญชาหลักของพนักงาน
          </p>

        </div>

      </label>

    </>
  );
}