"use client";

import { useEffect, useMemo, useState } from "react";
import JobCard from "@/app/jobs/components/JobCard";
import JobSidebar from "@/app/jobs/components/JobSidebar";

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

const BRANCH_STORAGE_KEY = "selected_branch_id";
const URGENT_STORAGE_KEY = "urgent_filter";

function readSavedBranch() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(BRANCH_STORAGE_KEY) ?? "";
}

function readFilters() {
  if (typeof window === "undefined") {
    return {
      branchId: "",
      urgent: false,
    };
  }

  return {
    branchId: localStorage.getItem(BRANCH_STORAGE_KEY) ?? "",
    urgent: localStorage.getItem(URGENT_STORAGE_KEY) === "true",
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [urgentFilter, setUrgentFilter] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);


  useEffect(() => {
    // setSelectedBranchId(readSavedBranch());
    const filters = readFilters();

    setSelectedBranchId(filters.branchId);
    setUrgentFilter(filters.urgent);

    const syncBranch = () => {
      const filters = readFilters();

      setSelectedBranchId(filters.branchId);
      setUrgentFilter(filters.urgent);
    };

    window.addEventListener("branch-change", syncBranch);
    window.addEventListener("storage", syncBranch);

    return () => {
      window.removeEventListener("branch-change", syncBranch);
      window.removeEventListener("storage", syncBranch);
    };
  }, []);

  useEffect(() => {
    fetchJobs(selectedBranchId, urgentFilter);
  }, [selectedBranchId, urgentFilter]);
  

  async function fetchJobs(branchId?: string, urgent?: boolean) {
    try {
      setLoadingJobs(true);
      const params = new URLSearchParams();
      if (branchId) {
        params.set("branch_id", branchId);
      }
      if (urgent) {
        params.set("urgent", "true");
      }
      const url = `/jobs/api${params.toString() ? `?${params}` : ""}`;

      const res = await fetch(url);
      const data = await res.json();

      setJobs(data);
    } finally {
      setLoadingJobs(false);
    }
  }

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

      const matchesBranch = !selectedBranchId || job.branch_id === selectedBranchId;

      const matchesUrgent = !urgentFilter || job.urgent;

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
  ]);

  if (loadingJobs) {
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

        <JobSidebar />

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