"use client";

export default function WorkflowSummary({
  form = {},
  approvalSteps = [],
}) {

  const totalApprovers = approvalSteps.reduce(
    (total, step) => total + (step.approvers?.length || 0),
    0
  );

  const workflowTypeLabel = {
    none: "No Approval",
    single: "Single Approval",
    multi: "Multi Level Approval",
  };

  return (
    <div className="space-y-6">

      {/* =======================================================
          Summary Cards
      ======================================================= */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="text-sm text-slate-500">
            Workflow Type
          </div>

          <div className="mt-2 text-xl font-bold text-slate-800">
            {workflowTypeLabel[form.workflow_type] || "-"}
          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="text-sm text-slate-500">
            Total Steps
          </div>

          <div className="mt-2 text-xl font-bold text-slate-800">
            {approvalSteps.length}
          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="text-sm text-slate-500">
            Total Approvers
          </div>

          <div className="mt-2 text-xl font-bold text-slate-800">
            {totalApprovers}
          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="text-sm text-slate-500">
            Auto Effective
          </div>

          <div className="mt-2">

            {form.auto_effective === "yes" ? (

              <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                Enabled
              </span>

            ) : (

              <span className="rounded-full bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">
                Disabled
              </span>

            )}

          </div>

        </div>

      </div>

      {/* =======================================================
          Step Overview
      ======================================================= */}

      {approvalSteps.length > 0 && (

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">

            <h3 className="font-semibold text-slate-800">
              Workflow Overview
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              สรุปรายละเอียดของแต่ละ Approval Step
            </p>

          </div>

          <table className="min-w-full">

            <thead className="bg-slate-100">

              <tr>

                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Step
                </th>

                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Approver Type
                </th>

                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Approval Mode
                </th>

                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Approvers
                </th>

                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Required
                </th>

                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Parallel
                </th>

              </tr>

            </thead>

            <tbody>

              {approvalSteps.map((step) => (

                <tr
                  key={step.id}
                  className="border-t border-slate-200"
                >

                  <td className="px-5 py-4">
                    Step {step.step_no}
                  </td>

                  <td className="px-5 py-4">
                    {step.approver_type}
                  </td>

                  <td className="px-5 py-4">

                    {step.approval_mode === "all"
                      ? "ALL"
                      : "ANY"}

                  </td>

                  <td className="px-5 py-4">

                    {step.approvers?.length || 0}

                  </td>

                  <td className="px-5 py-4">

                    {step.required ? (

                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        YES
                      </span>

                    ) : (

                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        NO
                      </span>

                    )}

                  </td>

                  <td className="px-5 py-4">

                    {step.parallel ? (

                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        Enabled
                      </span>

                    ) : (

                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        Disabled
                      </span>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}