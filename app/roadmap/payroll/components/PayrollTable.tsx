'use client';

// กำหนดโครงสร้างข้อมูลใหม่ให้ตรงกับ API (ข้อมูลจริง)
interface PayrollRow {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  level: string;
  evaluation: string;
  oldSalary: number;
  newSalary: number;
  bank: string;
  accountNumber: string;
}

interface PayrollTableProps {
  rows: PayrollRow[];
}

export default function PayrollTable({ rows }: PayrollTableProps) {
  return (
    <table className="min-w-full text-left">
      <thead className="border-b border-gray-200 bg-slate-50">
        <tr>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">พนักงาน</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">แผนก / Level</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">ผลการประเมิน</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">เงินเดือน (เดิม - ใหม่)</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">ธนาคาร</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">เลขที่บัญชี</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-gray-100 hover:bg-slate-50">
            <td className="px-4 py-4">
              <div className="font-semibold text-slate-900">{row.name}</div>
              <div className="mt-1 text-xs text-slate-500">{row.employeeId}</div>
            </td>
            <td className="px-4 py-4">
              <div className="text-sm text-slate-700">{row.department}</div>
              <div className="text-xs text-slate-500">{row.level}</div>
            </td>
            <td className="px-4 py-4 text-sm text-slate-600">{row.evaluation}</td>
            <td className="px-4 py-4">
              <div className="text-xs text-slate-400 line-through">
                {row.oldSalary?.toLocaleString()}
              </div>
              <div className="text-sm font-bold text-emerald-600">
                {row.newSalary?.toLocaleString()}
              </div>
            </td>
            <td className="px-4 py-4 text-sm text-slate-600">{row.bank}</td>
            <td className="px-4 py-4 text-sm text-slate-600 font-mono">{row.accountNumber}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}