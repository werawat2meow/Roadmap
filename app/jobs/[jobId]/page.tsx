"use client";

import { Card, Tag, Divider } from "antd";
import { useParams } from "next/navigation";

import { jobs } from "@/app/jobs/components/mock-data";
import JobDetailSidebar from "@/app/jobs/components/JobDetailSidebar";
import { getText } from "@/app/jobs/lib/i18n";
import { useLanguage } from "@/app/jobs/contexts/LanguageContext";

export default function JobDetailPage() {
  const { locale } = useLanguage();
  const params = useParams();
  const jobId = params?.jobId as string | undefined;

  const job = jobs.find((item) => item.id === jobId);

  if (!job) {
    return <div className="p-6">Job not found</div>;
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <Card>
              <div className="flex items-start gap-4">
                <img
                  src={job.companyLogo}
                  alt={getText(job.companyName, locale)}
                  className="h-20 w-20 rounded-xl object-cover"
                />

                <div>
                  <p>{getText(job.companyName, locale)}</p>

                  <h1 className="text-3xl font-bold">
                    {getText(job.positionTitle, locale)}
                  </h1>

                  <div className="mt-3 flex gap-2">
                    <Tag color="blue">{job.employmentType}</Tag>
                    <Tag color="green">{job.experienceLevel}</Tag>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="mt-6">
              <h2 className="text-xl font-semibold">About Position</h2>
              <Divider />
              <p>{getText(job.description, locale)}</p>
            </Card>

            <Card className="mt-6">
              <h2 className="text-xl font-semibold">Responsibilities</h2>
              <Divider />
              <ul className="list-disc pl-5">
                {job.responsibilities.map((item) => (
                  <li key={getText(item, locale)}>{getText(item, locale)}</li>
                ))}
              </ul>
            </Card>

            <Card className="mt-6">
              <h2 className="text-xl font-semibold">Qualifications</h2>
              <Divider />
              <ul className="list-disc pl-5">
                {job.qualifications.map((item) => (
                  <li key={getText(item, locale)}>{getText(item, locale)}</li>
                ))}
              </ul>
            </Card>

            <Card className="mt-6">
              <h2 className="text-xl font-semibold">Benefits</h2>
              <Divider />
              <ul className="list-disc pl-5">
                {job.benefits.map((item) => (
                  <li key={getText(item, locale)}>{getText(item, locale)}</li>
                ))}
              </ul>
            </Card>
          </div>

          {/* <JobDetailSidebar /> */}
        </div>
      </div>
    </div>
  );
}