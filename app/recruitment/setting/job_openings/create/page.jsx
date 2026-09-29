import JobOpenForm, { JobOpeningHeader } from "./JobOpenForm";

export const metadata = {
  title: "บันทึกการเปิดรับสมัครงาน",
};

// Next.js 16: searchParams เป็น Promise
export default async function JobOpenPage({ searchParams }) {
  const { id } = await searchParams;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <JobOpeningHeader isEditMode={Boolean(id)} />
        <JobOpenForm editId={id} />
      </div>
    </main>
  );
}
