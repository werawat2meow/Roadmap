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

// [เพิ่ม] ฟังก์ชันจัดการเลขบัญชี
const formatAccountNumber = (accNo: string) => {
  if (!accNo) return '-';
  const cleaned = accNo.replace(/\D/g, '');
  return cleaned.length === 10 
    ? `${cleaned.slice(0, 3)}-${cleaned.slice(3, 4)}-${cleaned.slice(4, 9)}-${cleaned.slice(9, 10)}`
    : accNo;
};

// [เพิ่ม] ฟังก์ชันจัดการ Style ธนาคาร
const getBankStyle = (bankName: string) => {
  const name = bankName.toLowerCase();
  if (name.includes('ไทยพาณิชย์') || name.includes('scb')) return { label: 'SCB', bg: 'bg-[#4e2e7f]', text: 'text-white' };
  if (name.includes('กสิกร') || name.includes('kbank')) return { label: 'KB', bg: 'bg-[#138f2d]', text: 'text-white' };
  if (name.includes('กรุงเทพ') || name.includes('bbl')) return { label: 'BBL', bg: 'bg-[#1e4598]', text: 'text-white' };
  if (name.includes('กรุงศรี') || name.includes('bay')) return { label: 'BAY', bg: 'bg-[#fec43b]', text: 'text-[#544d41]' };
  return { label: 'BK', bg: 'bg-slate-400', text: 'text-white' };
};

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
          const difference = (row.newSalary || 0) - (row.oldSalary || 0);
          const bankStyle = getBankStyle(row.bank); // [เพิ่ม]
          
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
              
              {/* [แก้ไข] ส่วนธนาคาร */}
              <td className="px-4 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 flex shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${bankStyle.bg} ${bankStyle.text}`}>
                    {bankStyle.label}
                  </div>
                  {/* <span className="text-slate-600 font-medium">{row.bank}</span> */}
                </div>
              </td>

              {/* [แก้ไข] ส่วนเลขบัญชี */}
              <td className="px-4 py-4 text-sm text-slate-600 font-mono">
                {formatAccountNumber(row.accountNumber)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}