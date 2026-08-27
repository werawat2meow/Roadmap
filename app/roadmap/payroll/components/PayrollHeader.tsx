"use client";
import { useState } from "react"; // [เพิ่ม] เพื่อจัดการสถานะโหลด
import { Download, Send, Loader2, HelpCircle } from "lucide-react";

// 1. เพิ่ม onUpdate ใน Interface
interface PayrollHeaderProps {
  onDownload: () => void;
  onUpdate: () => Promise<void>;
  onOpenGuide?: () => void; // [เพิ่ม] ฟังก์ชันอัปเดต (เป็น Promise เพราะต้องรอ API)
}

export default function PayrollHeader({
  onDownload,
  onUpdate,
  onOpenGuide,
}: PayrollHeaderProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // ฟังก์ชันจัดการตอนกดปุ่มอัปเดต
  const handleUpdateClick = async () => {
    if (
      !window.confirm(
        "ยืนยันการอัปเดตฐานเงินเดือนพนักงานเข้าระบบหลัก? (ขั้นตอนนี้จะบันทึกประวัติการปรับเงินเดือนด้วย)",
      )
    )
      return;

    setIsUpdating(true);
    try {
      await onUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-black text-slate-900">Send Account</h1>
          {/* [เพิ่มปุ่ม Help ตรงนี้] */}
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="p-1.5 text-yellow-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-all duration-200 cursor-pointer"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          จัดการข้อมูลบัญชีธนาคารสำหรับส่งฝ่ายบัญชี
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onDownload}
          className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:from-indigo-600 hover:to-blue-700 active:scale-[0.98]"
        >
          <Download className="h-4 w-4" />
          ดาวน์โหลด
        </button>

        {/* 2. ปรับปุ่มอัปเดตบัญชี */}
        <button
          type="button"
          onClick={handleUpdateClick}
          disabled={isUpdating}
          className={`cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.98] ${isUpdating ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isUpdating ? "กำลังอัปเดต..." : "อัปเดตบัญชี"}
        </button>
      </div>
    </div>
  );
}
