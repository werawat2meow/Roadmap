"use client";

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-sm font-semibold text-slate-800">
        {value || "-"}
      </div>
    </div>
  );
}

export default function RuleSummary({
  form = {},
  tiers = [],
}) {
  return (
    <div className="lg:col-span-2">

      <div className="rounded-3xl border border-slate-200 bg-white">

        <div className="border-b border-slate-200 px-6 py-4">

          <h4 className="font-bold">
            Rule Summary
          </h4>

        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">

          <SummaryItem
            label="Rule Type"
            value={form.rule_type}
          />

          <SummaryItem
            label="Calculation"
            value={form.calculation_method}
          />

          <SummaryItem
            label="Tier Count"
            value={tiers.length}
          />

          <SummaryItem
            label="Round"
            value={form.round_method || "None"}
          />

          <SummaryItem
            label="Minimum"
            value={form.minimum_amount || "-"}
          />

          <SummaryItem
            label="Maximum"
            value={form.maximum_amount || "-"}
          />

          <SummaryItem
            label="Taxable"
            value={
              form.taxable
                ? "Yes"
                : "No"
            }
          />

          <SummaryItem
            label="Payroll"
            value={
              form.include_payroll
                ? "Included"
                : "Excluded"
            }
          />

        </div>

      </div>

    </div>
  );
}