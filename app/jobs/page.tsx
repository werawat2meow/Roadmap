"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JobCard from "@/app/jobs/components/JobCard";
import JobSidebar from "@/app/jobs/components/JobSidebar";
import { uiText } from "@/app/jobs/components/translations";
import { useBranches } from "@/app/jobs/contexts/BranchContext";
import { readFilters, updateFilter } from "@/app/jobs/lib/filters";
import { getUIText } from "@/app/jobs/lib/ui";
import type { Job } from "@/app/jobs/types/job";
import { useLanguage } from "@/contexts/LanguageContext";

type SortOption = "urgent" | "latest" | "salary" | "openings";
const PAGE_SIZE = 10;

export default function JobsPage() {
  const { branches } = useBranches();
  const { locale } = useLanguage();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(
    () => readFilters().branchId
  );
  const [urgentFilter, setUrgentFilter] = useState(
    () => readFilters().urgent
  );
  const [sortBy, setSortBy] = useState<SortOption>("urgent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const requestIdRef = useRef(0);

  const fetchJobs = useCallback(
    async (branchId?: string, urgent?: boolean) => {
      const requestId = ++requestIdRef.current;

      try {
        setLoadingJobs(true);
        setLoadError(false);
        setJobs([]);
        const params = new URLSearchParams();

        if (branchId && branchId !== "undefined") {
          params.set("branch_id", branchId);
        }
        if (urgent) {
          params.set("urgent", "true");
        }

        const url = `/jobs/api${params.toString() ? `?${params}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();

        if (requestId !== requestIdRef.current) return;

        if (!res.ok || !Array.isArray(data)) {
          console.error("Jobs API error:", res.status, data);
          setLoadError(true);
          return;
        }

        setJobs(data);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        console.error("Fetch jobs error:", error);
        setLoadError(true);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoadingJobs(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const syncFilters = () => {
      const filters = readFilters();
      setSelectedBranchId(filters.branchId);
      setUrgentFilter(filters.urgent);
      setVisibleCount(PAGE_SIZE);
    };

    window.addEventListener("branch-change", syncFilters);
    window.addEventListener("storage", syncFilters);

    return () => {
      window.removeEventListener("branch-change", syncFilters);
      window.removeEventListener("storage", syncFilters);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        fetchJobs(selectedBranchId, urgentFilter);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchJobs, selectedBranchId, urgentFilter]);

  const filteredJobs = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesKeyword =
        !search ||
        job.branch_name?.toLowerCase().includes(search) ||
        job.position_name?.toLowerCase().includes(search) ||
        job.position_level?.toLowerCase().includes(search) ||
        job.salary_note?.toLowerCase().includes(search) ||
        String(job.salary_min ?? "").includes(search) ||
        String(job.salary_max ?? "").includes(search);

      const matchesBranch =
        !selectedBranchId || job.branch_id === selectedBranchId;
      const matchesUrgent = !urgentFilter || job.urgent;

      return matchesKeyword && matchesBranch && matchesUrgent;
    });
  }, [jobs, keyword, selectedBranchId, urgentFilter]);

  const sortedJobs = useMemo(() => {
    const result = [...filteredJobs];

    result.sort((a, b) => {
      if (sortBy === "urgent") {
        return Number(Boolean(b.urgent)) - Number(Boolean(a.urgent));
      }

      if (sortBy === "latest") {
        const aDate = a.start_date ? Date.parse(a.start_date) : 0;
        const bDate = b.start_date ? Date.parse(b.start_date) : 0;
        const safeADate = Number.isNaN(aDate) ? 0 : aDate;
        const safeBDate = Number.isNaN(bDate) ? 0 : bDate;
        return safeBDate - safeADate;
      }

      if (sortBy === "salary") {
        const aSalary = a.salary_max ?? a.salary_min ?? 0;
        const bSalary = b.salary_max ?? b.salary_min ?? 0;
        return bSalary - aSalary;
      }

      return (b.opening_count ?? 0) - (a.opening_count ?? 0);
    });

    return result;
  }, [filteredJobs, sortBy]);

  const visibleJobs = useMemo(
    () => sortedJobs.slice(0, visibleCount),
    [sortedJobs, visibleCount]
  );
  const hasMoreJobs = visibleJobs.length < sortedJobs.length;
  const showingJobsText = getUIText(uiText.showingJobsCount, locale)
    .replace("{shown}", String(visibleJobs.length))
    .replace("{total}", String(sortedJobs.length));

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.branch_id === selectedBranchId),
    [branches, selectedBranchId]
  );
  const trimmedKeyword = keyword.trim();
  const hasActiveFilters = Boolean(
    trimmedKeyword || selectedBranchId || urgentFilter
  );

  function clearBranchFilter() {
    setVisibleCount(PAGE_SIZE);
    updateFilter("", urgentFilter);
  }

  function clearUrgentFilter() {
    setVisibleCount(PAGE_SIZE);
    updateFilter(selectedBranchId, false);
  }

  function clearSearchFilter() {
    setKeyword("");
    setVisibleCount(PAGE_SIZE);
  }

  function clearAllFilters() {
    setKeyword("");
    setVisibleCount(PAGE_SIZE);
    updateFilter("", false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full gap-6 px-4 py-6 lg:px-6">
        <JobSidebar />

        <main className="min-w-0 flex-1">
          <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              {getUIText(uiText.jobsPageTitle, locale)}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {getUIText(uiText.jobsPageDescription, locale)}
            </p>

            <div className="mt-5">
              <label htmlFor="job-search" className="sr-only">
                {getUIText(uiText.jobSearchLabel, locale)}
              </label>
              <div className="relative">
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                  />
                </svg>
                <input
                  id="job-search"
                  type="search"
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder={getUIText(uiText.jobSearchPlaceholder, locale)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-11 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                {keyword ? (
                  <button
                    type="button"
                    onClick={clearSearchFilter}
                    className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    aria-label={getUIText(uiText.clearSearch, locale)}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        d="M6 6l12 12M18 6 6 18"
                      />
                    </svg>
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {getUIText(uiText.jobSearchHelp, locale)}
              </p>
            </div>
          </section>

          <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900" aria-live="polite">
                  {loadingJobs
                    ? getUIText(uiText.loadingJobs, locale)
                    : loadError
                      ? getUIText(uiText.loadFailedStatus, locale)
                      : `${getUIText(uiText.jobsFoundPrefix, locale)} ${
                          filteredJobs.length
                        } ${getUIText(uiText.jobsPositionUnit, locale)}${
                          selectedBranchId
                            ? ` ${getUIText(uiText.jobsInBranchPrefix, locale)} ${
                                selectedBranch?.branch_name ?? selectedBranchId
                              }`
                            : ""
                        }`}
                </p>

                {hasActiveFilters ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {selectedBranchId ? (
                      <button
                        type="button"
                        onClick={clearBranchFilter}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        aria-label={getUIText(
                          uiText.removeBranchFilter,
                          locale
                        )}
                      >
                        {getUIText(uiText.branchFilterChip, locale)}:{" "}
                        {selectedBranch?.branch_name ?? selectedBranchId}
                        <span aria-hidden="true">×</span>
                      </button>
                    ) : null}

                    {urgentFilter ? (
                      <button
                        type="button"
                        onClick={clearUrgentFilter}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                        aria-label={getUIText(
                          uiText.removeUrgentFilter,
                          locale
                        )}
                      >
                        {getUIText(uiText.urgentJobs, locale)}{" "}
                        <span aria-hidden="true">×</span>
                      </button>
                    ) : null}

                    {trimmedKeyword ? (
                      <button
                        type="button"
                        onClick={clearSearchFilter}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        aria-label={`${getUIText(
                          uiText.removeSearchFilter,
                          locale
                        )} ${trimmedKeyword}`}
                      >
                        <span className="max-w-48 truncate">
                          {getUIText(uiText.keywordFilterChip, locale)}:{" "}
                          {trimmedKeyword}
                        </span>
                        <span aria-hidden="true">×</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="px-2 py-1.5 text-xs font-medium text-gray-600 underline-offset-4 transition hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      {getUIText(uiText.clearAllFilters, locale)}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <label htmlFor="job-sort" className="text-sm text-gray-600">
                  {getUIText(uiText.sortLabel, locale)}
                </label>
                <select
                  id="job-sort"
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value as SortOption);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="urgent">
                    {getUIText(uiText.sortUrgent, locale)}
                  </option>
                  <option value="latest">
                    {getUIText(uiText.sortLatest, locale)}
                  </option>
                  <option value="salary">
                    {getUIText(uiText.sortSalary, locale)}
                  </option>
                  <option value="openings">
                    {getUIText(uiText.sortOpenings, locale)}
                  </option>
                </select>
              </div>
            </div>
          </section>

          {loadingJobs ? (
            <JobListSkeleton
              loadingLabel={getUIText(uiText.loadingJobs, locale)}
            />
          ) : loadError ? (
            <div
              className="rounded-2xl bg-white p-8 text-center shadow-sm"
              role="alert"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.3 3.8 2.4 18a2 2 0 0 0 1.75 3h15.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                {getUIText(uiText.jobsLoadError, locale)}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {getUIText(uiText.jobsLoadErrorHelp, locale)}
              </p>
              <button
                type="button"
                onClick={() => fetchJobs(selectedBranchId, urgentFilter)}
                className="mt-5 rounded-xl bg-[#123a63] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0e2f51] focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {getUIText(uiText.retry, locale)}
              </button>
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                {getUIText(uiText.emptyJobsTitle, locale)}
              </h2>
              {trimmedKeyword ? (
                <p className="mt-1 text-sm text-gray-600">
                  {getUIText(uiText.emptyKeywordPrefix, locale)} “{trimmedKeyword}”
                </p>
              ) : null}
              <p className="mt-1 text-sm text-gray-500">
                {getUIText(uiText.emptyJobsHelp, locale)}
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {getUIText(uiText.clearFilters, locale)}
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 gap-4">
                {visibleJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-gray-600" aria-live="polite">
                  {showingJobsText}
                </p>
                {hasMoreJobs ? (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((current) =>
                        Math.min(current + PAGE_SIZE, sortedJobs.length)
                      )
                    }
                    className="rounded-xl bg-[#123a63] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e2f51] focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                  >
                    {getUIText(uiText.loadMore, locale)}
                  </button>
                ) : (
                  <p className="text-sm font-medium text-gray-500">
                    {getUIText(uiText.allJobsShown, locale)}
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function JobListSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div
      className="grid grid-cols-1 gap-4"
      aria-busy="true"
      aria-label={loadingLabel}
    >
      <span className="sr-only">{loadingLabel}</span>
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200"
          aria-hidden="true"
        >
          <div className="h-1 bg-gray-200" />
          <div className="space-y-5 p-6">
            <div className="space-y-3">
              <div className="h-6 w-2/3 rounded bg-gray-200" />
              <div className="h-4 w-1/3 rounded bg-gray-100" />
            </div>
            <div className="grid gap-3 rounded-xl bg-gray-50 p-4 md:grid-cols-3">
              <div className="h-5 rounded bg-gray-200" />
              <div className="h-5 rounded bg-gray-200" />
              <div className="h-5 rounded bg-gray-200" />
            </div>
            <div className="h-20 rounded-xl bg-gray-100" />
          </div>
          <div className="flex justify-end border-t border-gray-100 bg-gray-50 p-4">
            <div className="h-10 w-28 rounded-lg bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
