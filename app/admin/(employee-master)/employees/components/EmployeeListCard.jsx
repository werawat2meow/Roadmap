"use client";

import { ChevronLeft, ChevronRight, Pencil, UserRound } from "lucide-react";
import DeleteConfirm from "@/app/admin/(employee-master)/components/master/DeleteConfirm";

const PAGE_SIZE = 10;

function employeeName(employee) {
  return [employee.first_name_th, employee.middle_name_th, employee.last_name_th]
    .filter(Boolean)
    .join(" ") || [employee.first_name_en, employee.last_name_en].filter(Boolean).join(" ") || "ไม่ระบุชื่อ";
}

export default function EmployeeListCard({
  employees, loading, page, total, canEdit, canDelete,
  deletingId, onPageChange, onEdit, onDelete,
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-base font-bold text-slate-900">รายการพนักงาน</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-4">พนักงาน</th>
              <th className="px-6 py-4">สังกัด / แผนก</th>
              <th className="px-6 py-4 text-center">ระดับ</th>
              <th className="px-6 py-4 text-center">สถานะ</th>
              <th className="px-6 py-4 text-center">วันที่เริ่มงาน</th>
              <th className="px-6 py-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500">กำลังโหลดรายชื่อพนักงาน...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500">ไม่พบข้อมูลพนักงาน</td></tr>
            ) : employees.map((employee) => {
              const name = employeeName(employee);
              const account = Array.isArray(employee.user_accounts) ? employee.user_accounts[0] : employee.user_accounts;
              const protectedAccount = account?.roles?.is_system === true;
              return (
                <tr key={employee.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {employee.employee_photo_url ? (
                        <img src={employee.employee_photo_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"><UserRound size={20} /></span>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">{name}</div>
                        <div className="text-xs text-slate-500">{employee.employee_code || "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <div>{employee.branches?.branch_name || "-"}</div>
                    <div className="text-xs text-slate-500">{employee.departments?.department_name || "-"}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{employee.position_levels?.level_code || "-"}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{employee.employee_statuses?.status_name || employee.status || "-"}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-slate-700">{employee.start_work_date || "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && <button type="button" title="แก้ไข" aria-label={`แก้ไข ${name}`} onClick={() => onEdit(employee)} className="cursor-pointer rounded-lg p-2 text-amber-700 hover:bg-amber-50"><Pencil size={18} /></button>}
                      {canDelete && !protectedAccount && <DeleteConfirm title="ลบพนักงาน" description={`ยืนยันการลบพนักงาน ${employee.employee_code} ใช่หรือไม่`} loading={deletingId === employee.id} onConfirm={() => onDelete(employee)} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button type="button" aria-label="หน้าก่อนหน้า" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)} className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={18} /></button>
          <button type="button" aria-label="หน้าถัดไป" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)} className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      </div>
    </section>
  );
}
