"use client";

export default function RuleBasicSection({
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
      {/* ============================= */}
      {/* Rule Code */}
      {/* ============================= */}

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Rule Code
        </label>

        <input
          value={form.rule_code || ""}
          onChange={(e) =>
            handleChange("rule_code", e.target.value)
          }
          placeholder="SAL-001"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        />
      </div>

      {/* ============================= */}
      {/* Rule Name */}
      {/* ============================= */}

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Rule Name
        </label>

        <input
          value={form.rule_name || ""}
          onChange={(e) =>
            handleChange("rule_name", e.target.value)
          }
          placeholder="Monthly Salary"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        />
      </div>

      {/* ============================= */}
      {/* Rule Type */}
      {/* ============================= */}

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Rule Type
        </label>

        <select
          value={form.rule_type || ""}
          onChange={(e) =>
            handleChange("rule_type", e.target.value)
          }
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        >
          <option value="">Select Rule</option>

          <option value="salary">
            Salary
          </option>

          <option value="allowance">
            Allowance
          </option>

          <option value="bonus">
            Bonus
          </option>

          <option value="commission">
            Commission
          </option>

          <option value="deduction">
            Deduction
          </option>

          <option value="ot">
            Overtime
          </option>
        </select>
      </div>

      {/* ============================= */}
      {/* Calculation Method */}
      {/* ============================= */}

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Calculation Method
        </label>

        <select
          value={form.calculation_method || ""}
          onChange={(e) =>
            handleChange(
              "calculation_method",
              e.target.value
            )
          }
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        >
          <option value="">
            Select Method
          </option>

          <option value="fixed">
            Fixed Amount
          </option>

          <option value="percent">
            Percentage
          </option>

          <option value="formula">
            Formula
          </option>

          <option value="tier">
            Tier
          </option>
        </select>
      </div>

      {/* ============================= */}
      {/* Section Header */}
      {/* ============================= */}

      <div className="lg:col-span-2">
        <div className="border-t border-slate-200 pt-6">
          <h4 className="text-base font-bold text-slate-800">
            Calculation Configuration
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            กำหนดค่าการคำนวณของ Rule นี้
          </p>
        </div>
      </div>
    </>
  );
}