"use client";

import {
  PencilSquareIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ScaleIcon,
  ArchiveBoxIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const statusColor = {
  draft:
    "bg-yellow-100 text-yellow-700 ring-yellow-200",

  review:
    "bg-blue-100 text-blue-700 ring-blue-200",

  approved:
    "bg-emerald-100 text-emerald-700 ring-emerald-200",

  active:
    "bg-green-100 text-green-700 ring-green-200",

  expired:
    "bg-red-100 text-red-700 ring-red-200",

  archived:
    "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function CompensationPolicyTable({
  loading = false,
  policies = [],

  onEdit,
  onDuplicate,
  onVersion,
  onCompare,
  onArchive,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

        <table className="w-full">

          <thead>

            <tr className="border-b border-slate-200">

              {Array.from({ length: 8 }).map((_, i) => (
                <th
                  key={i}
                  className="px-5 py-4"
                >
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                </th>
              ))}

            </tr>

          </thead>

          <tbody>

            {Array.from({ length: 8 }).map((_, row) => (
              <tr
                key={row}
                className="border-b border-slate-100"
              >
                {Array.from({ length: 8 }).map((_, col) => (
                  <td
                    key={col}
                    className="px-5 py-5"
                  >
                    <div className="h-4 animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))}

          </tbody>

        </table>

      </div>
    );
  }

  if (!policies.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-400 shadow-sm">
        ยังไม่มี Compensation Policy
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="sticky top-0 bg-slate-50">

            <tr className="border-b border-slate-200">

              <th className="px-5 py-4 text-left text-sm font-semibold">
                Policy
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold">
                Structure
              </th>

              <th className="px-5 py-4 text-center text-sm font-semibold">
                Version
              </th>

              <th className="px-5 py-4 text-center text-sm font-semibold">
                Status
              </th>

              <th className="px-5 py-4 text-center text-sm font-semibold">
                Effective
              </th>

              <th className="px-5 py-4 text-center text-sm font-semibold">
                End
              </th>

              <th className="px-5 py-4 text-right text-sm font-semibold">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {policies.map((policy) => (
              <tr
                key={policy.id}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >

                <td className="px-5 py-5">

                  <div className="font-semibold text-slate-800">
                    {policy.policy_name}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {policy.policy_code}
                  </div>

                </td>

                <td className="px-5 py-5 text-sm">
                  {policy.salary_structure_name ||
                    "-"}
                </td>

                <td className="px-5 py-5 text-center">

                  <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold">
                    v{policy.version_no || 1}
                  </span>

                </td>

                <td className="px-5 py-5 text-center">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      statusColor[
                        policy.status
                      ] ||
                      statusColor.draft
                    }`}
                  >
                    {policy.status}
                  </span>

                </td>

                <td className="px-5 py-5 text-center text-sm">
                  {policy.effective_date || "-"}
                </td>

                <td className="px-5 py-5 text-center text-sm">
                  {policy.end_date || "-"}
                </td>

                <td className="px-5 py-5">

                  <div className="flex justify-end gap-2">

                    <button
                      onClick={() =>
                        onEdit?.(policy)
                      }
                      className="rounded-xl border border-slate-300 p-2 hover:bg-slate-100"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() =>
                        onDuplicate?.(policy)
                      }
                      className="rounded-xl border border-slate-300 p-2 hover:bg-slate-100"
                    >
                      <DocumentDuplicateIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() =>
                        onVersion?.(policy)
                      }
                      className="rounded-xl border border-slate-300 p-2 hover:bg-slate-100"
                    >
                      <ClockIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() =>
                        onCompare?.(policy)
                      }
                      className="rounded-xl border border-slate-300 p-2 hover:bg-slate-100"
                    >
                      <ScaleIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() =>
                        onArchive?.(policy)
                      }
                      className="rounded-xl border border-slate-300 p-2 hover:bg-slate-100"
                    >
                      <ArchiveBoxIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() =>
                        onDelete?.(policy)
                      }
                      className="rounded-xl border border-red-200 p-2 text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>

                  </div>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}