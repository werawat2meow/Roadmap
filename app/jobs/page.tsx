  "use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import JobCard from "@/app/jobs/components/JobCard";
import { getText } from "@/app/jobs/lib/i18n";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";

interface Job {
  id: string;
  position_id: string;
  branch_id: string;
  branch_name: string;
  department_id: string;
  department_name: string;
  position_name: string;
  position_level: string;
  position_group: string;
  job_description_id: string;
  opening_count: number;
  salary_min: number | null;
  salary_max: number | null;
  salary_note: string | null;
  start_date: string;
  end_date: string;
  urgent: boolean;
  status: boolean;
}

interface BranchItem {
  branch_id: string;
  branch_name: string;
  job_count: number;
  urgent_count: number;
}

const BRANCH_STORAGE_KEY = "selected_branch_id";

function readSavedBranch() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(BRANCH_STORAGE_KEY) ?? "";
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [urgentFilter, setUrgentFilter] = useState(false);
  
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

  const { locale } = useLanguage();

  useEffect(() => {
    setSelectedBranchId(readSavedBranch());

    const syncBranch = () => {
      setSelectedBranchId(readSavedBranch());
    };

    window.addEventListener("branch-change", syncBranch);
    window.addEventListener("storage", syncBranch);

    return () => {
      window.removeEventListener("branch-change", syncBranch);
      window.removeEventListener("storage", syncBranch);
    };
  }, []);

  useEffect(() => {
    fetchJobs(selectedBranchId);
    fetchBranches();
  }, [selectedBranchId]);
  

  async function fetchJobs(branchId?: string) {
    try {
      setLoadingJobs(true);
      let url = "/jobs/api";
      if (branchId) {
        url += `?branch_id=${branchId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      console.log(data);
      
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  }

  async function fetchBranches() {
  try {
    setLoadingBranches(true);

    const res = await fetch("/jobs/api/branches");

    if (!res.ok) {
      throw new Error("Failed to fetch branches");
    }

    const data = await res.json();

    setBranches(data);
  } catch (err) {
    console.error("Fetch branches error:", err);
  } finally {
    setLoadingBranches(false);
  }
}

  const setBranchFilter = (branchId: string) => {
    setSelectedBranchId(branchId);

    if (typeof window !== "undefined") {
      localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
      window.dispatchEvent(new Event("branch-change"));
    }
  };

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
        !selectedBranchId ||
        job.branch_id === selectedBranchId;

      const matchesUrgent =
        !urgentFilter || job.urgent;

      return (
        matchesKeyword &&
        matchesBranch &&
        matchesUrgent
      );
    });
  }, [
    jobs,
    keyword,
    selectedBranchId,
    urgentFilter,
  ]);

  if (loadingJobs || loadingBranches) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white px-6 py-4 text-sm text-gray-600 shadow-sm">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-80 shrink-0 rounded-2xl border border-gray-200 bg-[#123a63] p-4 shadow-sm md:block">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">สาขางาน</h3>
            <p className="text-sm text-gray-50">เลือกสาขาเพื่อกรองตำแหน่งงาน</p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setUrgentFilter(false);
                setBranchFilter("");
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                selectedBranchId === "" && !urgentFilter
                  ? "bg-blue-50 text-blue-700"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>ทั้งหมด</span>
              <span className="text-xs text-gray-500">{totalJobCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setUrgentFilter(prev => !prev)}
              disabled={totalUrgentCount  === 0}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition 
                ${totalUrgentCount  === 0 
                  ? "cursor-not-allowed bg-gray-100 text-gray-400" 
                  : urgentFilter 
                    ? "bg-blue-50 text-blue-700" 
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
            >
              <span>🔥 งานด่วน</span>
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
                  onClick={() => setBranchFilter(branch.branch_id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                    isDisabled
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : isActive
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate">{branch.branch_name}</span>
                  <span className="ml-3 shrink-0 text-xs">
                    ({branch.job_count})
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Find Your Next Career</h1>
            <p className="mt-1 text-sm text-gray-600">
              Discover opportunities from leading companies.
            </p>

            <div className="mt-5">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="ค้นหาตำแหน่งงาน หรือชื่อสาขา"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </section>

          {filteredJobs.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
              ไม่พบตำแหน่งงานที่ค้นหา
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job as any}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}