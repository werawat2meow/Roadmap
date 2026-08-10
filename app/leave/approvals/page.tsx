"use client";

import React, { useState, useRef } from "react";
import {
  Search,
  ChevronDown,
  X,
  Paperclip,
  Download,
  Check,
  RotateCcw,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SignatureCanvas from "react-signature-canvas";

// 1. Interface ข้อมูลคำขอลา
interface LeaveRequest {
  id: number;
  name: string;
  avatar: string;
  dept: string;
  division: string;
  level: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
}

// 2. Mock Data ตามภาพ
const mockRequests: LeaveRequest[] = [
  {
    id: 1,
    name: "Anan Pongchai",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anan",
    dept: "Engineering",
    division: "Software Dev",
    level: "Junior Staff",
    type: "ลาป่วย",
    startDate: "2026-07-28",
    endDate: "2026-07-28",
    totalDays: 1,
    reason: "มีไข้ ต้องพักผ่อน",
  },
  {
    id: 2,
    name: "Naree Suwan",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Naree",
    dept: "Finance",
    division: "Accounting",
    level: "Mid Level",
    type: "ลาพักร้อน",
    startDate: "2026-08-03",
    endDate: "2026-08-05",
    totalDays: 3,
    reason: "ไปเที่ยวต่างจังหวัดกับครอบครัว",
  },
  {
    id: 3,
    name: "Malee Traipoom",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Malee",
    dept: "Marketing",
    division: "Digital",
    level: "Senior Staff",
    type: "ลากิจ",
    startDate: "2026-07-30",
    endDate: "2026-07-31",
    totalDays: 2,
    reason: "ทำธุระที่ธนาคารและเขต",
  },
];

export default function ApprovalsPage() {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null,
  );

  // Ref สำหรับควบคุมกระดานเซ็น
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  // function sign
  const clearSignature = () => {
    sigCanvas.current?.clear();
  };
  // function approvals
  const handleApprove = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("กรุณาลงลายเซ็นก่อนอนุมัติ");
      return;
    }
    const signatureData = sigCanvas.current
      ?.getTrimmedCanvas()
      .toDataURL("image/png");
    console.log("Signature Image Data:", signatureData);
    // ส่ง signatureData ไปที่ API เพื่อบันทึก...
    alert("อนุมัติเรียบร้อยแล้ว");
    setSelectedRequest(null);
  };
  return (
    <section className="relative w-full min-h-screen p-8">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Approvals
        </h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          พนักงานที่รออนุมัติการลา —{" "}
          <span className="text-slate-400">
            คลิกที่รายชื่อเพื่อดูรายละเอียด ลงลายเซ็น และอนุมัติ
          </span>
        </p>
      </header>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-grow min-w-[200px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900"
            size={18}
          />
          <input
            type="text"
            placeholder="ค้นหาพนักงาน..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all text-sm text-slate-900"
          />
        </div>
        <FilterSelect label="แผนกทั้งหมด" />
        <FilterSelect label="ฝ่ายทั้งหมด" />
        <FilterSelect label="หน่วยทั้งหมด" />
        <FilterSelect label="ระดับทั้งหมด" />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-bold text-slate-700">
            รออนุมัติ {mockRequests.length} รายการ
          </h3>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
              <th className="px-8 py-4">พนักงาน</th>
              <th className="px-8 py-4">สังกัด/แผนก</th>
              <th className="px-8 py-4">ระดับ</th>
              <th className="px-8 py-4">ประเภทการลา</th>
              <th className="px-8 py-4">วันที่</th>
              <th className="px-8 py-4 text-right">วัน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {mockRequests.map((req) => (
              <tr
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full bg-slate-200"
                    />
                    <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                      {req.name}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm text-slate-500">
                  {req.dept} / {req.division}
                </td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase whitespace-nowrap">
                    {req.level}
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-slate-600 font-medium">
                  {req.type}
                </td>
                <td className="px-8 py-5 text-sm text-slate-500 font-mono">
                  {req.startDate} → {req.endDate}
                </td>
                <td className="px-8 py-5 text-right font-bold text-slate-700">
                  {req.totalDays} วัน
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Side Drawer (Detail Panel) */}

      {/* ส่วนของ Side Drawer ที่ปรับปรุงให้สมูทแล้ว */}
      <AnimatePresence>
        {selectedRequest && (
          <>
            {/* 1. Backdrop (พื้นหลังมัว) - ค่อยๆ Fade in/out */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />

            {/* 2. Drawer Panel - ค่อยๆ Slide in จากขวา */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
            >
              {/* --- ไส้ในที่เป็นรายละเอียดการแจ้งลาทั้งหมดอยู่ตรงนี้ --- */}
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">
                  รายละเอียดการแจ้งลา
                </h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Employee Info */}
                <div className="flex items-center gap-4">
                  <img
                    src={selectedRequest.avatar}
                    alt=""
                    className="w-16 h-16 rounded-full bg-slate-100"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {selectedRequest.name}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {selectedRequest.dept} · {selectedRequest.division}
                    </p>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                      {selectedRequest.level}
                    </p>
                  </div>
                </div>

                {/* Leave Grid Details */}
                <div className="grid grid-cols-2 gap-y-6">
                  <DetailItem
                    label="ประเภทการลา"
                    value={selectedRequest.type}
                  />
                  <DetailItem
                    label="จำนวนวัน"
                    value={`${selectedRequest.totalDays} วัน`}
                  />
                  <DetailItem
                    label="วันที่เริ่ม"
                    value={selectedRequest.startDate}
                  />
                  <DetailItem
                    label="วันที่สิ้นสุด"
                    value={selectedRequest.endDate}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    เหตุผล
                  </label>
                  <p className="text-slate-700 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {selectedRequest.reason}
                  </p>
                </div>

                {/* Attachment */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    ไฟล์แนบหลักฐานการลา
                  </label>
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group cursor-pointer hover:bg-emerald-100 transition-colors">
                    <div className="flex items-center gap-3 text-emerald-700 font-bold text-sm">
                      <Paperclip size={18} />
                      ดูไฟล์แนบ
                    </div>
                    <Download size={18} className="text-emerald-600" />
                  </div>
                </div>

                {/* Signature Pad Placeholder */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    ลายเซ็นผู้อนุมัติ
                  </label>

                  <div className="relative group">
                    {/* ตัวกระดานเซ็น */}
                    <div className="w-full h-48 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 overflow-hidden">
                      <SignatureCanvas
                        ref={sigCanvas}
                        penColor="#1e293b" // สีน้ำเงินเข้มเกือบดำ
                        canvasProps={{
                          className: "w-full h-full cursor-crosshair",
                        }}
                      />
                    </div>

                    {/* ปุ่มล้างลายเซ็น */}
                    <button
                      onClick={clearSignature}
                      className="absolute bottom-4 left-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase hover:text-red-500 transition-colors cursor-pointer bg-white/80 px-2 py-1 rounded-lg"
                    >
                      <RotateCcw size={12} /> ล้างลายเซ็น
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="flex-1 py-4 border border-red-200 text-red-500 font-bold rounded-2xl hover:bg-red-50 transition-all active:scale-95 cursor-pointer"
                  >
                    ไม่อนุมัติ
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex-[2] py-4 bg-[#2dd4bf] text-white font-bold rounded-2xl hover:bg-[#14b8a6] transition-all shadow-lg shadow-teal-100 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Check size={20} /> อนุมัติ
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

// Sub-components
function FilterSelect({ label }: { label: string }) {
  return (
    <button className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:border-blue-400 transition-all min-w-[140px]">
      {label}
      <ChevronDown size={16} className="text-slate-400" />
    </button>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}
