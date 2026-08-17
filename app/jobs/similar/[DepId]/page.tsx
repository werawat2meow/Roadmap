import { notFound } from "next/navigation";
import JobList from "./JobList";

interface Props {
  params: Promise<{
    DepId: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { DepId } = await params;

  if (!DepId) {
    notFound();
  }

  return (
    <JobList departmentId={DepId} />
  );
}