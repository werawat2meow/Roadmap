"use client";

import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ScaleIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export default function CompensationPolicyHeader({
  loading = false,

  summary = {
    total: 0,
    active: 0,
    draft: 0,
    review: 0,
    archived: 0,
  },

  selectedPolicy = null,

  canCreate = false,
  canImport = false,
  canExport = false,
  canDuplicate = false,
  canVersion = false,
  canCompare = false,
  canHistory = false,

  onRefresh,
  onImport,
  onExport,
  onDuplicate,
  onCreateVersion,
  onCompare,
  onHistory,
  onCreate,
}) {
  const ActionButton = ({
    icon,
    children,
    onClick,
    disabled = false,
    primary = false,
  }) => (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all
      ${
        primary
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }
      disabled:cursor-not-allowed
      disabled:opacity-50`}
    >
      {icon}
      {children}
    </button>
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

        {/* LEFT */}

        <div className="flex-1">

          <h1 className="text-3xl font-bold text-slate-800">
            Compensation Policies
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            จัดการนโยบายค่าตอบแทน โครงสร้างเงินเดือน โบนัส
            ค่า OT ค่าตำแหน่ง ค่าเบี้ยเลี้ยง และกฎการคำนวณค่าตอบแทนขององค์กร
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Total Policies
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                {summary.total}
              </h2>
            </div>

            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-xs text-green-600">
                Active
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-700">
                {summary.active}
              </h2>
            </div>

            <div className="rounded-2xl bg-yellow-50 p-4">
              <p className="text-xs text-yellow-700">
                Draft
              </p>

              <h2 className="mt-2 text-3xl font-bold text-yellow-700">
                {summary.draft}
              </h2>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs text-blue-700">
                Review
              </p>

              <h2 className="mt-2 text-3xl font-bold text-blue-700">
                {summary.review}
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-xs text-slate-500">
                Archived
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-700">
                {summary.archived}
              </h2>
            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="flex flex-wrap justify-end gap-3">

          <ActionButton
            icon={<ArrowPathIcon className="h-5 w-5" />}
            onClick={onRefresh}
          >
            Refresh
          </ActionButton>

          {canImport && (
            <ActionButton
              icon={<ArrowUpTrayIcon className="h-5 w-5" />}
              onClick={onImport}
            >
              Import
            </ActionButton>
          )}

          {canExport && (
            <ActionButton
              icon={<ArrowDownTrayIcon className="h-5 w-5" />}
              onClick={onExport}
            >
              Export
            </ActionButton>
          )}

          {canDuplicate && (
            <ActionButton
              disabled={!selectedPolicy}
              icon={<DocumentDuplicateIcon className="h-5 w-5" />}
              onClick={() => onDuplicate?.(selectedPolicy)}
            >
              Duplicate
            </ActionButton>
          )}

          {canVersion && (
            <ActionButton
              disabled={!selectedPolicy}
              icon={<ClockIcon className="h-5 w-5" />}
              onClick={() => onCreateVersion?.(selectedPolicy)}
            >
              Version
            </ActionButton>
          )}

          {canCompare && (
            <ActionButton
              disabled={!selectedPolicy}
              icon={<ScaleIcon className="h-5 w-5" />}
              onClick={() => onCompare?.(selectedPolicy)}
            >
              Compare
            </ActionButton>
          )}

          {canHistory && (
            <ActionButton
              disabled={!selectedPolicy}
              icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
              onClick={() => onHistory?.(selectedPolicy)}
            >
              History
            </ActionButton>
          )}

          {canCreate && (
            <ActionButton
              primary
              icon={<PlusIcon className="h-5 w-5" />}
              onClick={onCreate}
            >
              New Policy
            </ActionButton>
          )}

        </div>

      </div>

    </div>
  );
}