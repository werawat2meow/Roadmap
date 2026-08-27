"use client";
import { X, Lightbulb } from 'lucide-react';

interface ExecutiveNoticeProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExecutiveNotice = ({ isOpen, onClose }: ExecutiveNoticeProps) => {
  if (!isOpen) return null;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top duration-500">
      <div className="relative overflow-hidden rounded-xl bg-blue-50 border border-blue-100 p-4 shadow-sm">
        {/* ลวดลาย Background */}
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-blue-100/50 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-200 text-white">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 text-sm sm:text-base leading-tight">
                คำแนะนำการใช้งานเมนู 🚀
              </h4>
              <p className="text-blue-700 text-xs sm:text-sm mt-1">
                แสดงรายชื่อที่ผ่านการประเมินคะแนน สามารถค้นหาพนักงานได้ และ สามารถ Filter คัดกรองพนักงานได้ เมื่อมีรายชื่อแสดงสามารถคลิก *ดูรายละเอียด* จะแสดงรายละเอียดข้อมูลการประเมิน
                และสามารถคลิกดูรายละเอียดการประเมิน ขั้นตอนสุดท้ายคือการ <br /> <span className="text-red-500">*อนุมัติ และ ไม่อนุมัติ หากไม่อนุมัติจะต้องระบุเหตุผลที่ไม่อนุมัติ*</span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-blue-200/50 rounded-lg transition-colors text-blue-400 hover:text-blue-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveNotice;