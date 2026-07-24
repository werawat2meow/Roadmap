"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

import CompensationPolicyBasicForm from "./CompensationPolicyBasicForm";
import CompensationPolicyScopeForm from "./CompensationPolicyScopeForm";
import CompensationPolicyRuleForm from "./CompensationPolicyRuleForm";
import CompensationPolicyApprovalForm from "./CompensationPolicyApprovalForm";
// import CompensationPolicyVersionForm from "./CompensationPolicyVersionForm";

const tabs = [
  {
    key: "basic",
    label: "Basic",
  },
  {
    key: "scope",
    label: "Scope",
  },
  {
    key: "rules",
    label: "Rules",
  },
  {
    key: "approval",
    label: "Approval",
  },
  {
    key: "version",
    label: "Version",
  },
];

export default function CompensationPolicyModal({
  open = false,

  loading = false,

  mode = "create",

  activeTab = "basic",

  form = {},

  companies = [],

  salaryStructures = [],

  onClose,

  onSave,

  onTabChange,

  onChange,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-6">

      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">

          <div>

            <h2 className="text-2xl font-bold text-slate-800">
              {mode === "create"
                ? "Create Compensation Policy"
                : "Edit Compensation Policy"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure policy information, scope,
              calculation rules and approval workflow.
            </p>

          </div>

          <button
            onClick={onClose}
            className="rounded-2xl p-2 hover:bg-slate-100"
          >
            <XMarkIcon className="h-7 w-7" />
          </button>

        </div>

        {/* Tabs */}

        <div className="border-b border-slate-200 bg-slate-50">

          <div className="flex gap-2 overflow-x-auto px-6 py-3">

            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange?.(tab.key)}
                className={`rounded-2xl px-5 py-2 text-sm font-semibold transition
                ${
                  activeTab === tab.key
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}

          </div>

        </div>

        {/* Body */}

        <div className="flex-1 overflow-y-auto p-8">

          {activeTab === "basic" && (
            <CompensationPolicyBasicForm
              form={form}
              companies={companies}
              salaryStructures={salaryStructures}
              onChange={onChange}
            />
          )}

          {activeTab === "scope" && (
            <CompensationPolicyScopeForm
              form={form}
              onChange={onChange}
            />
          )}

          {activeTab === "rules" && (
            <CompensationPolicyRuleForm
              form={form}
              onChange={onChange}
            />
          )}

          {activeTab === "approval" && (
            <CompensationPolicyApprovalForm
              form={form}
              onChange={onChange}
            />
          )}

          {activeTab === "version" && (
            <CompensationPolicyVersionForm
              form={form}
              onChange={onChange}
            />
          )}

        </div>

        {/* Footer */}

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-8 py-5">

          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={onSave}
            className="rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : mode === "create"
              ? "Create Policy"
              : "Save Changes"}
          </button>

        </div>

      </div>

    </div>
  );
}