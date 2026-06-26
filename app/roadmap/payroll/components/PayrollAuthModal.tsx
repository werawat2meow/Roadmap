'use client';

type PayrollAuthModalProps = {
  open: boolean;
  code: string;
  onCodeChange: (value: string) => void;
  onConfirm: () => void;
  error?: string;
};

export default function PayrollAuthModal({
  open,
  code,
  onCodeChange,
  onConfirm,
  error,
}: PayrollAuthModalProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-slate-950/10" />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
        className="relative w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl pointer-events-auto"
      >
        <h2 className="text-3xl font-black text-slate-900">ยืนยันรหัสเพื่อดูข้อมูล</h2>
        <p className="mt-3 text-sm text-slate-600">
          ระบบจะซ่อนข้อมูลทั้งหมดจนกว่าจะใส่รหัสที่ถูกต้อง
        </p>

        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-slate-700">ยืนยันรหัส</label>
          <input
            type="password"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="กรุณาใส่รหัสเพื่อดูข้อมูล"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          {error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : (
            <p className="text-sm text-slate-500">
              รหัสนี้ต้องใส่เพื่อปลดล็อกและแสดงข้อมูลพนักงานในหน้า Payroll
            </p>
          )}
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          ยืนยันรหัส
        </button>
      </form>
    </div>
  );
}