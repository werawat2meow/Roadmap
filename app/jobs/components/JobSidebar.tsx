// jobs/components/JobSidebar.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { uiText } from "@/app/jobs/components/translations";
import { readFilters, updateFilter } from "@/app/jobs/lib/filters";
import { getUIText } from "@/app/jobs/lib/ui";
import { useBranches } from "@/app/jobs/contexts/BranchContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function JobSidebar() {
  const { branches } = useBranches();
  const { locale } = useLanguage();
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [urgentFilter, setUrgentFilter] = useState(false);

  useEffect(() => {
    const syncFilters = () => {
      const { branchId, urgent } = readFilters();
      setSelectedBranchId(branchId);
      setUrgentFilter(urgent);
    };

    syncFilters();

    window.addEventListener("branch-change", syncFilters);
    window.addEventListener("storage", syncFilters);

    return () => {
      window.removeEventListener("branch-change", syncFilters);
      window.removeEventListener("storage", syncFilters);
    };
  }, []);

  const totalJobCount = useMemo(
    () =>
      branches.reduce(
        (sum, branch) => sum + (branch.job_count ?? 0),
        0
      ),
    [branches]
  );

  const totalUrgentCount = useMemo(
    () =>
      branches.reduce(
        (sum, branch) => sum + (branch.urgent_count ?? 0),
        0
      ),
    [branches]
  );

  return (
    <aside className="hidden w-80 shrink-0 self-start md:sticky md:top-20 md:block">
      <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-[#123a63] p-4 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            {getUIText(uiText.branchesTitle, locale)}
          </h3>
          <p className="text-sm text-gray-50">
            {getUIText(uiText.branchesDescription, locale)}
          </p>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => updateFilter("", false)}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
            selectedBranchId === "" && !urgentFilter
              ? "bg-blue-50 text-blue-700"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>{getUIText(uiText.allJobs, locale)}</span>
            <span className="text-xs text-gray-500">{totalJobCount}</span>
          </button>

          <button
            type="button"
            onClick={() => updateFilter("", !urgentFilter)}
            disabled={totalUrgentCount  === 0}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition 
            ${totalUrgentCount  === 0 
              ? "cursor-not-allowed bg-gray-100 text-gray-400" 
              : urgentFilter 
              ? "bg-blue-50 text-blue-700" 
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>🔥 {getUIText(uiText.urgentJobs, locale)}</span>
            <span className="ml-3 shrink-0 text-xs">({totalUrgentCount })</span>
          </button>

          {branches.map((branch) => {
            const isActive = selectedBranchId === branch.branch_id;
            const isDisabled = branch.job_count === 0;

            return (
            <button
              key={branch.branch_id}
              type="button"
              disabled={isDisabled}
              onClick={() => updateFilter(branch.branch_id, false)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
              isDisabled
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : isActive
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="truncate">{branch.branch_name}</span>
              <span className="ml-3 shrink-0 text-xs"> ({branch.job_count}) </span>
            </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
