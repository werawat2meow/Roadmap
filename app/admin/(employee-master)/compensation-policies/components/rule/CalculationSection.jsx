"use client";

export default function CalculationSection({
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
      {/* ========================================= */}
      {/* Fixed Amount */}
      {/* ========================================= */}

      {form.calculation_method === "fixed" && (
        <>
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Fixed Amount
            </label>

            <input
              type="number"
              value={form.fixed_amount || ""}
              placeholder="0.00"
              onChange={(e) =>
                handleChange(
                  "fixed_amount",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Currency
            </label>

            <select
              value={form.currency || "THB"}
              onChange={(e) =>
                handleChange(
                  "currency",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="THB">THB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </>
      )}

      {/* ========================================= */}
      {/* Percentage */}
      {/* ========================================= */}

      {form.calculation_method === "percent" && (
        <>
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Percentage
            </label>

            <input
              type="number"
              min="0"
              max="100"
              value={form.percent || ""}
              placeholder="10"
              onChange={(e) =>
                handleChange(
                  "percent",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Base Salary Field
            </label>

            <select
              value={form.percent_base || ""}
              onChange={(e) =>
                handleChange(
                  "percent_base",
                  e.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="">
                Select Base
              </option>

              <option value="basic_salary">
                Basic Salary
              </option>

              <option value="gross_salary">
                Gross Salary
              </option>

              <option value="net_salary">
                Net Salary
              </option>
            </select>
          </div>
        </>
      )}

      {/* ========================================= */}
      {/* Formula */}
      {/* ========================================= */}

      {form.calculation_method === "formula" && (
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-semibold">
            Formula
          </label>

          <textarea
            rows={5}
            value={form.formula || ""}
            onChange={(e) =>
              handleChange(
                "formula",
                e.target.value
              )
            }
            placeholder="(basic_salary + allowance) * 0.1"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />

          <p className="mt-2 text-xs text-slate-500">
            Example : basic_salary * 0.05
          </p>
        </div>
      )}

      {/* ========================================= */}
      {/* Tier */}
      {/* ========================================= */}

      {form.calculation_method === "tier" && (
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
            <div className="text-lg font-semibold text-slate-700">
              Tier Configuration
            </div>

            <div className="mt-2 text-sm text-slate-500">
              ตาราง Tier จะแสดงด้านล่าง
            </div>
          </div>
        </div>
      )}
    </>
  );
}