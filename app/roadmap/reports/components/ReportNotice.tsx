"use client";
import { X, FileText } from 'lucide-react'; // ใช้ไอคอนเอกสาร

interface ReportNoticeProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportNotice = ({ isOpen, onClose }: ReportNoticeProps) => {
  if (!isOpen) return null;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top duration-500">
      {/* ใช้โทนสีม่วง (Purple/Indigo) สำหรับหน้า Report */}
      <div className="relative overflow-hidden rounded-xl bg-purple-50 border border-purple-100 p-4 shadow-sm">
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-purple-100/50 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-200 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900 text-sm sm:text-base leading-tight">
                คำแนะนำการใช้งานเมนู 📊
              </h4>
              <p className="text-purple-700 text-xs sm:text-sm mt-1">
                เลือก Probation, Performance, Promote, Progression เพื่อแสดงรายชื่อที่ผ่านการอนุมัติจากเมนู Management <br />และสามารถค้นหารายชื่อ
                และ สามารถ Filter เพื่อคัดกรองรายชื่อ เมื่อแสดงรายชื่อแล้วสามารถคลิก Preview เพื่อดูรายละเอียดการประเมิน และสามารถปริ้นเป็นรูปแบบ PDF ได้
                หรือหากต้องการ Export รายชื่อทั้งหมด ให้คลิกปุ่ม Export Excel เพื่อออกรายงานเป็นรูปแบบ Excel
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-purple-200/50 rounded-lg transition-colors text-purple-400 hover:text-purple-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportNotice;