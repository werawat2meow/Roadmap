'use client';

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

export default function PayrollTable({ rows }: { rows: PayrollRow[] }) {
  return (
    <table className="min-w-full text-left">
      <thead className="border-b border-gray-200 bg-slate-50">
        <tr>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">พนักงาน</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">แผนก / Level</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">ผลการประเมิน</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">เงินเดือนเดิม</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">เงินเดือนใหม่</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">ยอดที่ปรับเพิ่ม</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">ธนาคาร</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">เลขที่บัญชี</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          // คำนวณส่วนต่าง
          const difference = (row.newSalary || 0) - (row.oldSalary || 0);
          
          return (
            <tr key={row.id} className="border-b border-gray-100 hover:bg-slate-50">
              <td className="px-4 py-4">
                <div className="font-semibold text-slate-900">{row.name}</div>
                <div className="mt-1 text-xs text-slate-500">{row.employeeId}</div>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm text-slate-700">{row.department}</div>
                <div className="text-xs text-slate-500">{row.level}</div>
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">
                {row.evaluation}
              </td>
              <td className="px-4 py-4 text-sm text-slate-500">
                {row.oldSalary?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-4 text-sm font-bold text-blue-600">
                {row.newSalary?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-emerald-600">
                + {difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">{row.bank}</td>
              <td className="px-4 py-4 text-sm text-slate-600 font-mono">{row.accountNumber}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}