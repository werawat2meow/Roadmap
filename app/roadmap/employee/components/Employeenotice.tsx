"use client";
import { X, Users } from 'lucide-react'; // เปลี่ยน icon เป็นรูปกลุ่มคน

interface EmployeeNoticeProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeNotice = ({ isOpen, onClose }: EmployeeNoticeProps) => {
  if (!isOpen) return null;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top duration-500">
      {/* เปลี่ยนโทนสีเป็นสีเขียวหรือสีอื่นให้ต่างจากหน้า Executive ก็ได้ครับ ในที่นี้ผมใช้สีเขียวอ่อน (emerald) */}
      <div className="relative overflow-hidden rounded-xl bg-emerald-50 border border-emerald-100 p-4 shadow-sm">
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900 text-sm sm:text-base leading-tight">
                คำแนะนำการใช้งานเมนู 👤
              </h4>
              <p className="text-emerald-700 text-xs sm:text-sm mt-1">
                สามารถพิมพ์ *ค้นหา* ในช่อง Search Employee เพื่อค้นหาพนักงานตามรายชื่อ และสามารถ Filter พนักงานได้ที่ปุ่ม * Filter * เพื่อคัดกรองตาม Filter เมื่อได้พนักงานที่ต้องการแล้วให้คลิกที่ปุ่ม * ประเมินพนักงาน * เพื่อไปยังหน้าทำแบบฟอร์มประเมินพนักงาน
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-emerald-200/50 rounded-lg transition-colors text-emerald-400 hover:text-emerald-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeNotice;