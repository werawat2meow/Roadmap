"use client";

import { useEffect, useMemo, useState } from "react";
import JobCard from "@/app/jobs/components/JobCard";
import JobFilter from "@/app/jobs/components/JobFilter";
import { getText } from "@/app/jobs/lib/i18n";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";

// export interface Job {
//   id: string;
//   position_name: string;
//   branch_name: string;
//   salary_note: string | null;
//   salary_min: number | null;
//   salary_max: number | null;
//   workLocation:string | null;
//   opening_count: number;
//   urgent: boolean;
// }

export interface Job {
  id: string;
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const { locale } = useLanguage();

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch("/jobs/api");

      const data = await res.json();
      
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = useMemo(() => {
    const search = keyword.toLowerCase();

    return jobs.filter((job) => {
      const positionName = getText(
        job.job_to_language,
        locale
      )
        .toLowerCase();

      const branchName =
        job.branch_name.toLowerCase();

      return (
        positionName.includes(search) ||
        branchName.includes(search)
      );
    });
  }, [jobs, keyword, locale]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Find Your Next Career
          </h1>
          <p className="mt-2 text-gray-500">
            Discover opportunities from
            leading companies.
          </p>
        </div>
        <JobFilter
          keyword={keyword}
          setKeyword={setKeyword}
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.length === 0 ? (
            <div>ไม่พบตำแหน่งงานที่ค้นหา</div>
          ) : (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={{
                  ...job,
                  position_name: getText(
                    job.job_to_language,
                    locale
                  ),
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}