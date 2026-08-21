"use client";

export default function DepartmentHeader({ canCreate, onCreate }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">แผนก</h1>
          <p className="mt-1 text-sm text-slate-500">
            จัดการข้อมูลแผนกในแต่ละสังกัด สามารถเพิ่ม แก้ไข หรือลบแผนกได้ตามสิทธิ์ที่ได้รับ
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="rounded-2xl bg-[#0D2842] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + เพิ่มแผนก
          </button>
        )}
      </div>
    </div>
  );
}
