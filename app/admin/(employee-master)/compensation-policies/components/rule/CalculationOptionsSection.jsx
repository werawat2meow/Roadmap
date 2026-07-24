"use client";

export default function CalculationOptionsSection({
  form = {},
  onChange,
}) {
  const handleChange = (field, value) => {
    if (typeof onChange !== "function") return;

    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <>
      {/* ========================================== */}
      {/* Section Header */}
      {/* ========================================== */}

      <div className="lg:col-span-2">
        <div className="border-t border-slate-200 pt-6">

          <h4 className="text-base font-bold text-slate-800">
            Calculation Options
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            กำหนดข้อจำกัดและตัวเลือกเพิ่มเติมของการคำนวณ
          </p>

        </div>
      </div>

      {/* Minimum */}

      <div>

        <label className="mb-2 block text-sm font-semibold">
          Minimum Amount
        </label>

        <input
          type="number"
          value={form.minimum_amount || ""}
          placeholder="0.00"
          onChange={(e) =>
            handleChange(
              "minimum_amount",
              e.target.value
            )
          }
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        />

      </div>

      {/* Maximum */}

      <div>

        <label className="mb-2 block text-sm font-semibold">
          Maximum Amount
        </label>

        <input
          type="number"
          value={form.maximum_amount || ""}
          placeholder="Unlimited"
          onChange={(e) =>
            handleChange(
              "maximum_amount",
              e.target.value
            )
          }
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        />

      </div>

      {/* Cap */}

      <div>

        <label className="mb-2 block text-sm font-semibold">
          Cap Amount
        </label>

        <input
          type="number"
          value={form.cap_amount || ""}
          placeholder="Optional"
          onChange={(e) =>
            handleChange(
              "cap_amount",
              e.target.value
            )
          }
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        />

      </div>

      {/* Floor */}

      <div>

        <label className="mb-2 block text-sm font-semibold">
          Floor Amount
        </label>

        <input
          type="number"
          value={form.floor_amount || ""}
          placeholder="Optional"
          onChange={(e) =>
            handleChange(
              "floor_amount",
              e.target.value
            )
          }
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        />

      </div>

      {/* Round */}

      <div>

        <label className="mb-2 block text-sm font-semibold">
          Round Method
        </label>

        <select
          value={form.round_method || ""}
          onChange={(e) =>
            handleChange(
              "round_method",
              e.target.value
            )
          }
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        >

          <option value="">
            No Rounding
          </option>

          <option value="up">
            Round Up
          </option>

          <option value="down">
            Round Down
          </option>

          <option value="nearest">
            Round Nearest
          </option>

        </select>

      </div>

      {/* Decimal */}

      <div>

        <label className="mb-2 block text-sm font-semibold">
          Decimal Places
        </label>

        <input
          type="number"
          min="0"
          max="4"
          value={form.decimal_places ?? 2}
          onChange={(e) =>
            handleChange(
              "decimal_places",
              Number(e.target.value)
            )
          }
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        />

      </div>

    </>
  );
}