"use client";

export default function DepartmentFormModal({
  open,
  form,
  setForm,
  branches = [],
  editingDepartment,
  saving,
  canSubmit,
  onClose,
  onSave,
}) {
  if (!open) return null;

  const removeBranch = (branchId) => {
    setForm((previous) => ({
      ...previous,
      branch_ids: previous.branch_ids.filter((id) => id !== branchId),
    }));
  };

  const toggleBranch = (branchId, checked) => {
    setForm((previous) => ({
      ...previous,
      branch_ids: checked
        ? Array.from(new Set([...previous.branch_ids, branchId]))
        : previous.branch_ids.filter((id) => id !== branchId),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-800">
            {editingDepartment ? "แก้ไขแผนก" : "เพิ่มแผนก"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {editingDepartment ? "ปรับปรุงข้อมูลแผนก" : "กรอกข้อมูลแผนกใหม่"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              รหัสแผนก
            </label>
            <input
              type="text"
              value={form.code}
              disabled={!canSubmit}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  code: event.target.value,
                }))
              }
              placeholder="เช่น OPS"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              ชื่อแผนก
            </label>
            <input
              type="text"
              value={form.name}
              disabled={!canSubmit}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              placeholder="เช่น Operations"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              สังกัดที่ดูแล
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                {form.branch_ids.length > 0 ? (
                  form.branch_ids.map((selectedId) => {
                    const selectedBranch = branches.find(
                      (branch) => branch.id === selectedId
                    );

                    return (
                      <span
                        key={selectedId}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                      >
                        {selectedBranch?.branch_name || selectedId}
                        <button
                          type="button"
                          disabled={!canSubmit}
                          onClick={() => removeBranch(selectedId)}
                          className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] hover:bg-white/30 disabled:cursor-not-allowed"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-400">ยังไม่ได้เลือกสังกัดที่ดูแล</p>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {branches.map((branch) => {
                    const isChecked = form.branch_ids.includes(branch.id);

                    return (
                      <label
                        key={branch.id}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition ${
                          canSubmit ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                        } ${
                          isChecked
                            ? "border-slate-900 bg-slate-900/5"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!canSubmit}
                          onChange={(event) =>
                            toggleBranch(branch.id, event.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                        />

                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm ${
                              isChecked
                                ? "font-semibold text-slate-900"
                                : "text-slate-700"
                            }`}
                          >
                            {branch.branch_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {branch.branch_code || "Branch"}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  เลือกได้มากกว่า 1 สังกัดที่ดูแล
                </p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  เลือกแล้ว {form.branch_ids.length} รายการ
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              สถานะ
            </label>
            <select
              value={form.status}
              disabled={!canSubmit}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  status: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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

          {canSubmit && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${
                saving
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {saving ? "Saving..." : editingDepartment ? "Update" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
