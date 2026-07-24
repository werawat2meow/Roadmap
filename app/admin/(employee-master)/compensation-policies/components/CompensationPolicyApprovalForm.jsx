"use client";

import { CheckBadgeIcon } from "@heroicons/react/24/outline";

import { FormSection } from "./shared";

import ApprovalStepCard from "./approval/ApprovalStepCard";
import WorkflowSummary from "./approval/WorkflowSummary";

export default function CompensationPolicyApprovalForm({
  form = {},
  users = [],
  roles = [],
  positions = [],
  departments = [],
  divisions = [],
  approvalGroups = [],
  onChange,
}) {

  /* ==========================================================
   * Common Helpers
   * ========================================================== */

  const handleChange = (field, value) => {
    if (typeof onChange !== "function") return;

    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const approvalSteps = form.approval_steps || [];

  /* ==========================================================
   * Step CRUD
   * ========================================================== */

  const addStep = () => {
    handleChange("approval_steps", [
      ...approvalSteps,
      {
        id: crypto.randomUUID(),
        step_no: approvalSteps.length + 1,

        approver_type: "user",
        approval_mode: "all",

        approvers: [],

        required: true,
        parallel: false,

        allow_delegate: false,

        send_email: true,
        send_notification: true,

        stop_on_reject: true,

        reminder_days: "",
        auto_approve_after: "",
      },
    ]);
  };

  const updateStep = (stepIndex, field, value) => {
    const next = [...approvalSteps];

    next[stepIndex] = {
      ...next[stepIndex],
      [field]: value,
    };

    handleChange("approval_steps", next);
  };

  const removeStep = (stepIndex) => {
    const next = approvalSteps
      .filter((_, index) => index !== stepIndex)
      .map((step, index) => ({
        ...step,
        step_no: index + 1,
      }));

    handleChange("approval_steps", next);
  };

  const duplicateStep = (stepIndex) => {
    const source = approvalSteps[stepIndex];

    handleChange("approval_steps", [
      ...approvalSteps,
      {
        ...source,
        id: crypto.randomUUID(),
        step_no: approvalSteps.length + 1,
        approvers: [...(source.approvers || [])],
      },
    ]);
  };

  const moveStep = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= approvalSteps.length) return;

    const next = [...approvalSteps];

    const [row] = next.splice(fromIndex, 1);

    next.splice(toIndex, 0, row);

    const normalized = next.map((step, index) => ({
      ...step,
      step_no: index + 1,
    }));

    handleChange("approval_steps", normalized);
  };

    /* ==========================================================
   * Multi Approver
   * ========================================================== */

  const addApprover = (stepIndex) => {
    const next = [...approvalSteps];

    next[stepIndex] = {
      ...next[stepIndex],

      approvers: [
        ...(next[stepIndex].approvers || []),

        {
          id: crypto.randomUUID(),
          approver_id: "",
        },
      ],
    };

    handleChange("approval_steps", next);
  };

  const updateApprover = (
    stepIndex,
    approverIndex,
    approverId
  ) => {
    const next = [...approvalSteps];

    const approvers = [...next[stepIndex].approvers];

    approvers[approverIndex] = {
      ...approvers[approverIndex],
      approver_id: approverId,
    };

    next[stepIndex] = {
      ...next[stepIndex],
      approvers,
    };

    handleChange("approval_steps", next);
  };

  const removeApprover = (
    stepIndex,
    approverIndex
  ) => {
    const next = [...approvalSteps];

    next[stepIndex] = {
      ...next[stepIndex],

      approvers: next[
        stepIndex
      ].approvers.filter(
        (_, index) => index !== approverIndex
      ),
    };

    handleChange("approval_steps", next);
  };

  /* ==========================================================
   * Lookup
   * ========================================================== */

  const getUserName = (id) =>
    users.find((x) => x.id === id)?.full_name || "";

  const getRoleName = (id) =>
    roles.find((x) => x.id === id)?.role_name || "";

  const getPositionName = (id) =>
    positions.find((x) => x.id === id)?.position_name || "";

  const getDepartmentName = (id) =>
    departments.find((x) => x.id === id)?.department_name || "";

  const getDivisionName = (id) =>
    divisions.find((x) => x.id === id)?.division_name || "";
    return (
    <div className="space-y-8">

      <FormSection
        title="Approval Workflow"
        description="กำหนด Workflow การอนุมัติ"
        icon={<CheckBadgeIcon className="h-6 w-6" />}
        iconClassName="bg-blue-600"
      >

        {/* Workflow Type / Owner / Group */}

        {/* ใช้ JSX เดิมที่เราทำไว้ */}

      </FormSection>

      <FormSection
        title="Approval Steps"
        description="Workflow Step"
        icon={<CheckBadgeIcon className="h-6 w-6" />}
        iconClassName="bg-indigo-600"
      >

        <div className="mb-6 flex justify-end">

          <button
            type="button"
            onClick={addStep}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-white"
          >
            + Add Step
          </button>

        </div>

        <div className="space-y-6">

          {approvalSteps.map((step, index) => (

            <ApprovalStepCard
              key={step.id}

              step={step}
              index={index}

              users={users}
              roles={roles}
              positions={positions}
              departments={departments}
              divisions={divisions}
              approvalGroups={approvalGroups}

              moveStep={moveStep}
              duplicateStep={duplicateStep}
              removeStep={removeStep}

              updateStep={updateStep}

              addApprover={addApprover}
              updateApprover={updateApprover}
              removeApprover={removeApprover}

              getUserName={getUserName}
              getRoleName={getRoleName}
              getPositionName={getPositionName}
              getDepartmentName={getDepartmentName}
              getDivisionName={getDivisionName}
            />

          ))}

        </div>

      </FormSection>

      <WorkflowSummary
        form={form}
        approvalSteps={approvalSteps}
      />

    </div>
  );
}