"use client";

import ApprovalOptionList from "./ApprovalOptionList";
import ApproverSelector from "./ApproverSelector";
import WorkflowPreview from "./WorkflowPreview";

export default function ApprovalStepCard({
  step,
  index,

  users,
  roles,
  positions,
  departments,
  divisions,
  approvalGroups,

  moveStep,
  duplicateStep,
  removeStep,

  updateStep,

  addApprover,
  updateApprover,
  removeApprover,

  getUserName,
  getRoleName,
  getPositionName,
  getDepartmentName,
  getDivisionName,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">

      {/* =======================================================
          Header
      ======================================================= */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h3 className="text-lg font-bold">

            Step {step.step_no}

          </h3>

          <p className="text-sm text-slate-500">

            Approval Configuration

          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() => moveStep(index, index - 1)}
            className="rounded-lg border px-3 py-2"
          >
            ↑
          </button>

          <button
            type="button"
            onClick={() => moveStep(index, index + 1)}
            className="rounded-lg border px-3 py-2"
          >
            ↓
          </button>

          <button
            type="button"
            onClick={() => duplicateStep(index)}
            className="rounded-lg border px-3 py-2"
          >
            Duplicate
          </button>

          <button
            type="button"
            onClick={() => removeStep(index)}
            className="rounded-lg bg-red-500 px-3 py-2 text-white"
          >
            Delete
          </button>

        </div>

      </div>

      {/* =======================================================
          Configuration
      ======================================================= */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div>

          <label className="mb-2 block text-sm font-semibold">

            Approver Type

          </label>

          <select
            value={step.approver_type}
            onChange={(e) =>
              updateStep(
                index,
                "approver_type",
                e.target.value
              )
            }
            className="w-full rounded-xl border px-4 py-3"
          >

            <option value="user">
              Specific User
            </option>

            <option value="role">
              Role
            </option>

            <option value="position">
              Position
            </option>

            <option value="manager">
              Direct Manager
            </option>

            <option value="department_head">
              Department Head
            </option>

            <option value="division_head">
              Division Head
            </option>

            <option value="hr">
              HR
            </option>

            <option value="approval_group">
              Approval Group
            </option>

          </select>

        </div>

        <div>

          <label className="mb-2 block text-sm font-semibold">

            Approval Mode

          </label>

          <select
            value={step.approval_mode || "all"}
            onChange={(e) =>
              updateStep(
                index,
                "approval_mode",
                e.target.value
              )
            }
            className="w-full rounded-xl border px-4 py-3"
          >

            <option value="all">

              ALL

            </option>

            <option value="any">

              ANY

            </option>

          </select>

        </div>

        <div>

          <label className="mb-2 block text-sm font-semibold">

            Reminder

          </label>

          <input
            type="number"
            value={step.reminder_days}
            onChange={(e) =>
              updateStep(
                index,
                "reminder_days",
                e.target.value
              )
            }
            className="w-full rounded-xl border px-4 py-3"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-semibold">

            Auto Approve

          </label>

          <input
            type="number"
            value={step.auto_approve_after}
            onChange={(e) =>
              updateStep(
                index,
                "auto_approve_after",
                e.target.value
              )
            }
            className="w-full rounded-xl border px-4 py-3"
          />

        </div>

      </div>

      {/* =======================================================
          Options
      ======================================================= */}

      <ApprovalOptionList
        step={step}
        index={index}
        updateStep={updateStep}
      />

      {/* =======================================================
          Approvers
      ======================================================= */}

      <ApproverSelector
        step={step}
        index={index}

        users={users}
        roles={roles}
        positions={positions}
        departments={departments}
        divisions={divisions}
        approvalGroups={approvalGroups}

        addApprover={addApprover}
        updateApprover={updateApprover}
        removeApprover={removeApprover}
      />

      {/* =======================================================
          Preview
      ======================================================= */}

      <WorkflowPreview
        step={step}
        getUserName={getUserName}
        getRoleName={getRoleName}
        getPositionName={getPositionName}
        getDepartmentName={getDepartmentName}
        getDivisionName={getDivisionName}
      />

    </div>
  );
}