import PayrollStatusPill from './PayrollStatusPill';
import { PayrollRow } from '../data';

type PayrollTableProps = {
  rows: PayrollRow[];
};

export default function PayrollTable({ rows }: PayrollTableProps) {
    return (
        <table className="min-w-full text-left">
            <thead className="border-b border-gray-200 bg-slate-50">
                <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">พนักงาน</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">แผนก / Level</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">ผลการประเมิน</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">เงินเดือน</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">ธนาคาร</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">เลขที่บัญชี</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">สถานะ</th>
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
                            <div className="mt-1 text-xs text-slate-500">{row.department}</div>
                            <div className="mt-1 text-xs text-slate-500">{row.level}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">{row.evaluation}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{row.salary}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{row.bank}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{row.accountNumber}</td>
                        <td className="px-4 py-4"><PayrollStatusPill status={row.status} /></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};