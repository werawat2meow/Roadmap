import JobOpenForm from "./JobOpenForm";

export const metadata = {
  title: "บันทึกการเปิดรับสมัครงาน",
};

// Next.js 16: searchParams เป็น Promise
export default async function JobOpenPage({ searchParams }) {
  const { id } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            {id ? "แก้ไขการเปิดรับสมัครงาน" : "บันทึกการเปิดรับสมัครงาน"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {id
              ? "แก้ไขจำนวน วันที่ ความด่วน หรือสถานะของรายการเปิดรับที่มีอยู่"
              : "เลือกตำแหน่งที่ต้องการเปิดรับ ระบุจำนวนที่ต้องการต่อบริษัท และช่วงเวลาเปิดรับสมัคร"}
          </p>
        </div>
        <JobOpenForm editId={id} />
      </div>
    </main>
  );
}