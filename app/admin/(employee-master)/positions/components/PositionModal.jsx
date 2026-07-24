"use client";

import PositionFamilySelect from "@/app/admin/(employee-master)/components/hr/PositionFamilySelect";
import PositionLevelSelector from "@/app/admin/(employee-master)/components/hr/PositionLevelSelector";

const initialForm = {
  code: "",
  name: "",
  group: "",
  position_family_id: "",
  position_levels: [],
  status: "active",
};

export default function PositionModal({
  open,
  saving,
  editingPosition,
  form,
  setForm,
  onClose,
  onSave,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-2xl font-bold text-slate-800">
            {editingPosition
              ? "แก้ไขตำแหน่ง"
              : "เพิ่มตำแหน่ง"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Position Master (Enterprise Version)
          </p>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">

          {/* ==============================
              Basic Information
          ============================== */}

          <div className="rounded-2xl border border-slate-200 p-5">

            <h3 className="mb-5 text-lg font-semibold text-slate-700">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Position Code */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Position Code
                </label>

                <input
                  value={form.code}
                  onChange={(e)=>
                    setForm(prev=>({
                      ...prev,
                      code:e.target.value
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

              </div>

              {/* Position Name */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Position Name
                </label>

                <input
                  value={form.name}
                  onChange={(e)=>
                    setForm(prev=>({
                      ...prev,
                      name:e.target.value
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

              </div>

            </div>

          </div>

          {/* ==============================
              Organization
          ============================== */}

          <div className="rounded-2xl border border-slate-200 p-5">

            <h3 className="mb-5 text-lg font-semibold text-slate-700">
              Organization
            </h3>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Group */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Position Group
                </label>

                <input
                  value={form.group}
                  onChange={(e)=>
                    setForm(prev=>({
                      ...prev,
                      group:e.target.value
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

              </div>

              {/* Family */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Position Family
                </label>

                <PositionFamilySelect
                  value={form.position_family_id}
                  onChange={(value)=>
                    setForm(prev=>({
                      ...prev,
                      position_family_id:value
                    }))
                  }
                />

              </div>

            </div>

          </div>

          {/* ==============================
              Allowed Levels
          ============================== */}

          <div className="rounded-2xl border border-slate-200 p-5">

            <h3 className="mb-5 text-lg font-semibold text-slate-700">
              Allowed Position Levels
            </h3>

            <PositionLevelSelector
              value={form.position_levels}
              onChange={(levels)=>
                setForm(prev=>({
                  ...prev,
                  position_levels:levels
                }))
              }
            />

          </div>

          {/* ==============================
              Status
          ============================== */}

          <div className="rounded-2xl border border-slate-200 p-5">

            <label className="mb-2 block text-sm font-medium">
              Status
            </label>

            <select
              value={form.status}
              onChange={(e)=>
                setForm(prev=>({
                  ...prev,
                  status:e.target.value
                }))
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
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

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">

          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-300 px-6 py-3"
          >
            Cancel
          </button>

          <button
            disabled={saving}
            onClick={onSave}
            className="rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white"
          >
            {saving
              ? "Saving..."
              : editingPosition
              ? "Update"
              : "Save"}
          </button>

        </div>

      </div>

    </div>
  );
}