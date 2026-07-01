"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import JobCard from "@/app/jobs/components/JobCard";
import { getText } from "@/app/jobs/lib/i18n";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";

interface Job {
  id: string;
  branch_id: string;
  job_to_language: {
    [key: string]: string;
  };
  branch_name: string;
  workLocation: string;
  salary_min: number | null;
  salary_max: number | null;
  opening_count: number;
  urgent: boolean;
}

interface BranchItem {
  id: string;
  branch_name: string;
  job_count: number;
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
  const urgentCount = jobs.filter(job => job.urgent === true).length;

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
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  }

  async function fetchBranches() {
    try {
      const [
        { data: branchData, error: branchError },
        { data: jobRows, error: jobError },
        { data: descriptions, error: descError },
      ] = await Promise.all([
        supabase
          .from("branches")
          .select("id, branch_name")
          .order("branch_name"),

        supabase
          .from("recruit_job_open")
          .select(`
            branch_id,
            position_id
          `),

        supabase
          .from("recruit_job_description")
          .select(`
            branch_id,
            positions_id
          `),
      ]);

      if (branchError) throw branchError;
      if (jobError) throw jobError;
      if (descError) throw descError;

      /**
       * สร้าง key จาก
       * branch_id + position_id
       *
       * เพื่อเช็คว่ามี description จริง
       */
      const validDescriptions = new Set(
        (descriptions ?? []).map((d) =>
          `${d.branch_id}_${d.positions_id}`
        )
      );

      const counts = (jobRows ?? []).reduce<
        Record<string, number>
      >((acc, job) => {

        const key =
          `${job.branch_id}_${job.position_id}`;

        /**
         * นับเฉพาะ job_open
         * ที่มี description คู่กัน
         */
        if (
          job.branch_id &&
          validDescriptions.has(key)
        ) {
          acc[job.branch_id] =
            (acc[job.branch_id] ?? 0) + 1;
        }

        return acc;

      }, {});

      const branchList: BranchItem[] =
        (branchData ?? []).map((branch) => ({
          id: branch.id,
          branch_name: branch.branch_name,
          job_count: counts[branch.id] ?? 0,
        }));

      setBranches(branchList);

    } catch (err) {

      console.error(
        "Fetch branches error:",
        err
      );

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
    const search = keyword.trim();
    
    return jobs.filter((job) => {
      const positionName = getText(
        job.job_to_language,
        locale
      ).toLowerCase();
      
      const branchName = job.branch_name.toLowerCase();

      const matchesKeyword =
        !search ||
        positionName.includes(search) ||
        branchName.includes(search);

      const matchesBranch =
        selectedBranchId === "" ||
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
    locale,
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
        <aside className="hidden w-80 shrink-0 rounded-2xl border border-gray-200 bg-[#0d47a1] p-4 shadow-sm md:block">
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
              <span className="text-xs text-gray-500">{jobs.length}</span>
            </button>


            <button
              type="button"
              onClick={() => setUrgentFilter(prev => !prev)}
              disabled={urgentCount === 0}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition 
                ${urgentCount === 0 
                  ? "cursor-not-allowed bg-gray-100 text-gray-400" 
                  : urgentFilter 
                    ? "bg-blue-50 text-blue-700" 
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
            >
              <span>🔥 งานด่วน</span>
              <span className="ml-3 shrink-0 text-xs">({urgentCount})</span>
            </button>

            {branches.map((branch) => {
              const isActive = selectedBranchId === branch.id;
              const isDisabled = branch.job_count === 0;

              return (
                <button
                  key={branch.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setBranchFilter(branch.id)}
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
                  job={{
                    ...job,
                    position_name: getText(job.job_to_language, locale),
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}