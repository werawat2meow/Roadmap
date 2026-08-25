"use client";

import React, { useState } from "react";
import { FileDown, Settings2 } from "lucide-react";
import { AdjustmentReportTemplate } from "./AdjustmentReportTemplate";

interface BranchSummary {
  branch: string;
  count: number;
  totalAmount: number;
}

interface RecentEvaluationsProps {
  data?: BranchSummary[];
  month?: string;
  year?: string;
}

const MONTH_NAMES_THAI = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export default function RecentEvaluations({
  data,
  month,
  year,
}: RecentEvaluationsProps) {
  const totalPeople = data?.reduce((sum, item) => sum + item.count, 0) || 0;
  const grandTotal =
    data?.reduce((sum, item) => sum + item.totalAmount, 0) || 0;

  const displayYear = year
    ? parseInt(year) > 2500
      ? year
      : (parseInt(year) + 543).toString()
    : "";
  const displayMonth =
    month && month !== "all" ? MONTH_NAMES_THAI[parseInt(month) - 1] : "";
  const titleText =
    month === "all"
      ? `รายการปรับ Road Map ประจำปี ${displayYear}`
      : `รายการปรับ Road Map ประจำเดือน ${displayMonth} ${displayYear}`;

  const [preparerName, setPreparerName] = useState("คุณธีรวุฒิ เทพจินดา");
  const [preparerRank, setPreparerRank] = useState("Group Director");
  const [approverName, setApproverName] = useState("คุณชนินท์ทัต ปวัณทบุตร");
  const [approverRank, setApproverRank] = useState("President");
  const [isEditOpen, setIsEditOpen] = useState(false); // เปิด-ปิดแผงแก้ไข

  const handleExport = () => {
    // 1. สั่งปิดแผงตั้งค่าลายเซ็นทันที (ถ้ามันเปิดอยู่)
    setIsEditOpen(false);

    // 2. ใช้ setTimeout เพื่อรอให้ React วาดหน้าจอใหม่ (เอาแผงออกไปจริงๆ) ก่อนสั่ง Print
    setTimeout(() => {
      const originalTitle = document.title;

      // ตั้งชื่อไฟล์
      const fileName = `Report Road Map ${displayMonth} ${displayYear}`;
      document.title = fileName;

      // สั่งพิมพ์
      window.print();

      // คืนค่าชื่อแท็บ
      document.title = originalTitle;
    }, 150); // รอ 0.15 วินาที ชัวร์สุดครับ
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col relative">
      {/* แก้ไข CSS ตรงนี้เพื่อให้มองเห็นข้อมูลตอน Print */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media screen {
          #print-area { display: none !important; }
        }
        
        @media print {
          /* ซ่อนส่วนอื่นๆ ทั้งหมด */
          body * { visibility: hidden !important; }
          
          /* แสดงเฉพาะ #print-area และรักษารูปแบบดั้งเดิมของมันไว้ */
          #print-area, #print-area * { 
            visibility: visible !important; 
          }
          
          #print-area { 
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            display: block !important;
            -webkit-print-color-adjust: exact; /* บังคับให้สีพื้นหลังตารางติดไปด้วย */
          }

          /* ลบ Header/Footer ที่ Browser มักจะเติมให้ (วันที่, URL) */
          @page { size: auto; margin: 0; }
        }
      `,
        }}
      />

      <div className="mb-6 text-center">
        <h3 className="font-bold text-slate-800 text-lg leading-tight">
          {titleText}
        </h3>
      </div>

      <div className="overflow-hidden border border-slate-300 rounded-sm">
        <table className="w-full text-[13px] md:text-sm text-center border-collapse">
          <thead>
            <tr className="bg-[#f2f2f2] text-slate-800 font-bold border-b border-slate-300">
              <th className="py-2.5 px-4 border-r border-slate-300">สังกัด</th>
              <th className="py-2.5 px-4 border-r border-slate-300">จำนวน</th>
              <th className="py-2.5 px-4">ยอดปรับ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index} className="text-slate-700">
                  <td className="py-2.5 px-4 border-r border-slate-300">
                    {item.branch}
                  </td>
                  <td className="py-2.5 px-4 border-r border-slate-300">
                    {item.count} คน
                  </td>
                  <td className="py-2.5 px-4 font-medium">
                    {item.totalAmount.toLocaleString()} บาท
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="py-12 text-slate-400 italic bg-slate-50"
                >
                  ไม่มีข้อมูลการปรับในเดือนนี้
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-[#e6e6e6] font-bold text-slate-900 border-t border-slate-300">
              <td className="py-2.5 px-4 border-r border-slate-300 text-center">
                รวมรายการปรับ
              </td>
              <td className="py-2.5 px-4 border-r border-slate-300">
                {totalPeople} คน
              </td>
              <td className="py-2.5 px-4">{grandTotal.toLocaleString()} บาท</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 no-print border-t border-slate-200 pt-4">
        <button
          onClick={() => setIsEditOpen(!isEditOpen)}
          className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-blue-600 mb-3 cursor-pointer"
        >
          <Settings2 size={14} />
          {isEditOpen ? "ปิดการตั้งค่าลายเซ็น" : "แก้ไขชื่อผู้ลงนาม"}
        </button>

        {isEditOpen && (
          <div className="grid grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
            {/* ฝั่งผู้จัดทำ */}
            <div className="space-y-3">
              <p className="text-xs font-black text-black border-l-4 border-blue-600 pl-2">
                ผู้จัดทำ
              </p>
              <div className="space-y-2">
                <input
                  className="w-full text-sm p-2 border border-slate-400 rounded bg-white text-black font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none placeholder:text-slate-400"
                  value={preparerName}
                  onChange={(e) => setPreparerName(e.target.value)}
                  placeholder="ชื่อผู้จัดทำ"
                />
                <input
                  className="w-full text-sm p-2 border border-slate-400 rounded bg-white text-black font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none placeholder:text-slate-400"
                  value={preparerRank}
                  onChange={(e) => setPreparerRank(e.target.value)}
                  placeholder="ตำแหน่ง"
                />
              </div>
            </div>

            {/* ฝั่งผู้อนุมัติ */}
            <div className="space-y-3">
              <p className="text-xs font-black text-black border-l-4 border-emerald-600 pl-2">
                ผู้อนุมัติ
              </p>
              <div className="space-y-2">
                <input
                  className="w-full text-sm p-2 border border-slate-400 rounded bg-white text-black font-medium focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none placeholder:text-slate-400"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="ชื่อผู้อนุมัติ"
                />
                <input
                  className="w-full text-sm p-2 border border-slate-400 rounded bg-white text-black font-medium focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none placeholder:text-slate-400"
                  value={approverRank}
                  onChange={(e) => setApproverRank(e.target.value)}
                  placeholder="ตำแหน่ง"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 flex justify-end">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md active:scale-95"
        >
          <FileDown size={14} /> EXPORT PDF
        </button>
      </div>

      <AdjustmentReportTemplate
        data={data || []}
        titleText={titleText}
        preparerName={preparerName}
        preparerRank={preparerRank}
        approverName={approverName}
        approverRank={approverRank}
      />
    </div>
  );
}
