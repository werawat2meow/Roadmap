"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function CompensationPolicySearch({
  loading = false,

  search = "",
  status = "",
  companyId = "",
  salaryStructureId = "",
  effectiveDate = "",

  companies = [],
  salaryStructures = [],

  onSearchChange,
  onStatusChange,
  onCompanyChange,
  onSalaryStructureChange,
  onEffectiveDateChange,
  onClear,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-6">

        {/* Search */}

        <div className="xl:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Search
          </label>

          <div className="relative">

            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              disabled={loading}
              placeholder="Policy Code / Policy Name"
              onChange={(e) =>
                onSearchChange?.(e.target.value)
              }
              className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

          </div>
        </div>

        {/* Status */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Status
          </label>

          <select
            value={status}
            disabled={loading}
            onChange={(e) =>
              onStatusChange?.(e.target.value)
            }
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          >
            <option value="">All Status</option>

            <option value="draft">Draft</option>

            <option value="review">Review</option>

            <option value="approved">Approved</option>

            <option value="active">Active</option>

            <option value="expired">Expired</option>

            <option value="archived">Archived</option>

          </select>

        </div>

        {/* Company */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Company
          </label>

          <select
            value={companyId}
            disabled={loading}
            onChange={(e) =>
              onCompanyChange?.(e.target.value)
            }
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          >

            <option value="">All Companies</option>

            {companies.map((company) => (
              <option
                key={company.id}
                value={company.id}
              >
                {company.company_name_th ||
                  company.company_name_en}
              </option>
            ))}

          </select>

        </div>

        {/* Salary Structure */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Salary Structure
          </label>

          <select
            value={salaryStructureId}
            disabled={loading}
            onChange={(e) =>
              onSalaryStructureChange?.(
                e.target.value
              )
            }
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          >

            <option value="">
              All Structures
            </option>

            {salaryStructures.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.structure_name}
              </option>
            ))}

          </select>

        </div>

        {/* Effective Date */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Effective Date
          </label>

          <input
            type="date"
            value={effectiveDate}
            disabled={loading}
            onChange={(e) =>
              onEffectiveDateChange?.(
                e.target.value
              )
            }
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          />

        </div>

      </div>

      {/* Footer */}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">

        <p className="text-sm text-slate-500">
          ใช้ตัวกรองเพื่อค้นหา Compensation Policy
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XMarkIcon className="h-5 w-5" />
          Clear Filters
        </button>

      </div>

    </div>
  );
}