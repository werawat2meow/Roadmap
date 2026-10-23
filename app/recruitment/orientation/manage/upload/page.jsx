import Link from "next/link";
import ActivityUploadForm from "../../ActivityUploadForm";

export default async function OrientationUploadPage({ searchParams }) {
  const query = await searchParams;
  const initialSessionId = typeof query.session_id === "string" ? query.session_id : null;

  return (
    <main className="min-w-0 bg-slate-50 px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
      <div className="mx-auto max-w-[1600px]">
        <Link
          href="/recruitment/orientation/manage"
          className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          กลับหน้าจัดการรอบ Orientation
        </Link>

        <header className="mb-5 mt-2 rounded-2xl bg-slate-900 px-5 py-6 text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)] sm:px-7 sm:py-7">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[28px]">
            อัปโหลดรูปกิจกรรม
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            เลือกรอบและผู้เข้าร่วม แล้วแนบและบันทึกรูป Orientation, Site Visit หรือส่งมอบแยกทีละหมวด
          </p>
        </header>

        <ActivityUploadForm initialSessionId={initialSessionId} />
      </div>
    </main>
  );
}
