"use client";

import DepartmentBranchBadges from "./DepartmentBranchBadges";

export default function DepartmentTableView({
  loading,
  departments = [],
  deletingId,
  canEditRecord,
  canDeleteRecord,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">ลำดับ</th>
              <th className="px-6 py-4 text-left font-semibold">รหัสแผนก</th>
              <th className="px-6 py-4 text-left font-semibold">ชื่อแผนก</th>
              <th className="px-6 py-4 text-left font-semibold">สังกัดที่ดูแล</th>
              <th className="px-6 py-4 text-left font-semibold">สถานะ</th>
              <th className="px-6 py-4 text-right font-semibold">จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              [...Array(5)].map((_, index) => (
                <tr key={index} className="border-t border-slate-200">
                  <td className="px-6 py-4"><div className="h-3.5 w-16 animate-pulse rounded-md bg-slate-200" /></td>
                  <td className="px-6 py-4"><div className="h-3.5 w-32 animate-pulse rounded-md bg-slate-200" /></td>
                  <td className="px-6 py-4"><div className="h-3.5 w-28 animate-pulse rounded-md bg-slate-200" /></td>
                  <td className="px-6 py-4"><div className="h-6 w-40 animate-pulse rounded-md bg-slate-200" /></td>
                  <td className="px-6 py-4"><div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" /></td>
                  <td className="px-6 py-4"><div className="ml-auto h-8 w-32 animate-pulse rounded-xl bg-slate-200" /></td>
                </tr>
              ))
            ) : departments.length > 0 ? (
              departments.map((department, index) => (
                <tr
                  key={department.id}
                  className="border-t border-slate-200 hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-700">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{department.code}</td>
                  <td className="px-6 py-4 text-slate-700">{department.name}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <DepartmentBranchBadges names={department.branch_names || []} />
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        department.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {department.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {canEditRecord(department) || canDeleteRecord(department) ? (
                      <div className="flex justify-end gap-2">
                        {canEditRecord(department) && (
                          <button
                            type="button"
                            onClick={() => onEdit(department)}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                        )}

                        {canDeleteRecord(department) && (
                          <button
                            type="button"
                            onClick={() => onDelete(department)}
                            disabled={deletingId === department.id}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                              deletingId === department.id
                                ? "cursor-not-allowed border-slate-200 text-slate-400"
                                : "border-red-200 text-red-600 hover:bg-red-50"
                            }`}
                          >
                            {deletingId === department.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-right text-slate-400">-</div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  ไม่พบข้อมูลแผนก
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
