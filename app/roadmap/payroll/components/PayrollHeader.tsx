import { Download, Send } from 'lucide-react';

export default function PayrollHeader() {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-4xl font-black text-slate-900">Payroll</h1>
                <p className="text-sm text-gray-500">จัดการข้อมูลบัญชีธนาคารสำหรับส่งฝ่ายบัญชี</p>
            </div>
            
            <div className="flex flex-col gap-3 sm:flex-row">
                <button
                    type="button"
                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:from-indigo-600 hover:to-blue-700 active:scale-[0.98]"
                >
                    <Download className="h-4 w-4" />
                    ดาวน์โหลด
                </button>

                <button
                    type="button"
                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.98]"
                >
                    <Send className="h-4 w-4" />
                    ส่งให้บัญชี
                </button>
            </div>
        </div>
    );
};