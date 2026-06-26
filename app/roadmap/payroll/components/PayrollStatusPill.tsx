type PayrollStatusPillProps = {
    status: string;
};

const statusClasses: Record<string, string> = {
  'ครบถ้วนแล้ว': 'bg-sky-100 text-sky-700',
  'รอข้อมูลบัญชี': 'bg-yellow-100 text-yellow-700',
  'ส่งบัญชีแล้ว': 'bg-emerald-100 text-emerald-700',
  'ยังไม่สมบูรณ์': 'bg-slate-100 text-slate-700',
};

export default function PayrollStatusPill({ status }: PayrollStatusPillProps) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status] ?? 'bg-slate-100 text-slate-700'}`}
        >
            {status}
        </span>
    );
};