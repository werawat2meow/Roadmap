import JobOpenForm from "./JobOpenForm";

export const metadata = {
  title: "บันทึกการเปิดรับสมัครงาน",
};

// Next.js 16: searchParams เป็น Promise
export default async function JobOpenPage({ searchParams }) {
  const { id } = await searchParams;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
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