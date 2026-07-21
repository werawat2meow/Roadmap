"use client";

import { useEffect, useState } from "react";
import JobCard from "@/app/jobs/components/JobCard";

export default function JobList({
  departmentId,
}: {
  departmentId: string;
}) {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    loadJobs();
  }, [departmentId]);

  async function loadJobs() {
    const res = await fetch(
      `/jobs/api/?department_id=${departmentId}`
    );

    const data = await res.json();   

    setJobs(data ?? []);
  }

  return (
    <div className="mx-auto max-w-7xl p-8">

      <h1 className="mb-8 text-3xl font-bold">
        ตำแหน่งงานที่คล้ายกัน
      </h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job: any) => (
          <JobCard
            key={job.id}
            job={job}
          />
        ))}
      </div>

    </div>
  );
}