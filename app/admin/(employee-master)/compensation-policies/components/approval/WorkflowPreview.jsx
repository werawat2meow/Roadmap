"use client";

export default function WorkflowPreview({
  step,
  getUserName,
  getRoleName,
  getPositionName,
  getDepartmentName,
  getDivisionName,
}) {

  const approvers = step.approvers || [];

  const getApproverName = (approverId) => {
    switch (step.approver_type) {
      case "user":
        return getUserName?.(approverId);

      case "role":
        return getRoleName?.(approverId);

      case "position":
        return getPositionName?.(approverId);

      case "department_head":
        return getDepartmentName?.(approverId);

      case "division_head":
        return getDivisionName?.(approverId);

      case "manager":
        return "Direct Manager";

      case "hr":
        return "HR";

      case "approval_group":
        return "Approval Group";

      default:
        return "";
    }
  };

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-emerald-200">

      {/* =======================================================
          Header
      ======================================================= */}

      <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-4">

        <h4 className="font-semibold text-emerald-700">
          Workflow Preview
        </h4>

        <p className="mt-1 text-sm text-slate-600">
          ภาพรวมของการอนุมัติใน Step นี้
        </p>

      </div>

      {/* =======================================================
          Content
      ======================================================= */}

      <div className="space-y-6 bg-white p-5">

        {/* Approval Mode */}

        <div>

          <div className="mb-2 text-sm font-semibold text-slate-700">
            Approval Mode
          </div>

          <div
            className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
              step.approval_mode === "all"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {step.approval_mode === "all"
              ? "ALL Approvers"
              : "ANY Approver"}
          </div>

        </div>

        {/* Description */}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">

          {step.approval_mode === "all"
            ? "ผู้อนุมัติทุกคนต้องอนุมัติครบ Workflow จึงจะไปขั้นตอนถัดไป"
            : "มีผู้อนุมัติคนใดคนหนึ่งอนุมัติ ก็สามารถไปขั้นตอนถัดไปได้"}

        </div>

        {/* Approver List */}

        <div>

          <div className="mb-3 text-sm font-semibold text-slate-700">
            Approver List
          </div>

          {approvers.length === 0 ? (

            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-400">

              ยังไม่มีผู้อนุมัติ

            </div>

          ) : (

            <div className="flex flex-wrap gap-3">

              {approvers.map((approver, index) => (

                <div
                  key={approver.id}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                >

                  <div className="text-xs text-slate-500">
                    Approver {index + 1}
                  </div>

                  <div className="mt-1 font-medium text-slate-800">

                    {getApproverName(
                      approver.approver_id
                    ) || "Not Selected"}

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* Statistics */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl border bg-slate-50 p-4">

            <div className="text-sm text-slate-500">
              Total Approvers
            </div>

            <div className="mt-2 text-2xl font-bold">

              {approvers.length}

            </div>

          </div>

          <div className="rounded-xl border bg-slate-50 p-4">

            <div className="text-sm text-slate-500">
              Required
            </div>

            <div className="mt-2">

              {step.required ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  YES
                </span>
              ) : (
                <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700">
                  NO
                </span>
              )}

            </div>

          </div>

          <div className="rounded-xl border bg-slate-50 p-4">

            <div className="text-sm text-slate-500">
              Parallel
            </div>

            <div className="mt-2">

              {step.parallel ? (
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                  ENABLED
                </span>
              ) : (
                <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700">
                  DISABLED
                </span>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}