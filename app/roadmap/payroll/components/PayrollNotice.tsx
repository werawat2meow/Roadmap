"use client";
import { X, Banknote } from 'lucide-react'; // ใช้ไอคอนธนบัตร

interface PayrollNoticeProps {
  isOpen: boolean;
  onClose: () => void;
}

const PayrollNotice = ({ isOpen, onClose }: PayrollNoticeProps) => {
  if (!isOpen) return null;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top duration-500">
      {/* ใช้โทนสีส้ม/เหลือง (Amber) สำหรับหน้า Payroll */}
      <div className="relative overflow-hidden rounded-xl bg-amber-50 border border-amber-100 p-4 shadow-sm">
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-amber-100/50 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200 text-white">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 text-sm sm:text-base leading-tight">
                คำแนะนำการใช้งานเมนู 💸
              </h4>
              <p className="text-amber-700 text-xs sm:text-sm mt-1">
                เมนู Send Account จะแสดงรายชื่อพนักงานที่มีการปรับเงินเดือน และ ผ่านการอนุมัติแล้วเท่านั้น ข้อมูลที่แสดงจะเป็นรายละเอียดพนักงานและจำนวนเงินในการปรับ
                สามารถค้นหารายชื่อได้โดยการพิมพ์ในช่อง Seach... และสามารถคัดกรองพนักงานได้โดยการ Filter หากต้องการรายงานข้อมูลให้คลิกคำว่า *ดาวน์โหลด* จะได้เอกสารรายชื่อ
                มาในรูปแบบไฟล์ Excel และหากต้องการอัปเดตเงินเดือนใหม่ให้พนักงานเข้าระบบกลางให้คลิกคำว่า *อัปเดตบัญชี* ระบบจะอัปเดตไปยังระบบกลางเพื่อปรับเงินเดือนพนักงาน
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-amber-200/50 rounded-lg transition-colors text-amber-400 hover:text-amber-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollNotice;