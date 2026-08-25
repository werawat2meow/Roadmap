"use client";

import React from "react";

interface BranchSummary {
  branch: string;
  count: number;
  totalAmount: number;
}

// เพิ่ม Props สำหรับรับชื่อและตำแหน่ง
interface Props {
  data: BranchSummary[];
  titleText: string;
  preparerName: string;   // ชื่อผู้จัดทำ
  preparerRank: string;   // ตำแหน่งผู้จัดทำ
  approverName: string;   // ชื่อผู้อนุมัติ
  approverRank: string;   // ตำแหน่งผู้อนุมัติ
}

export const AdjustmentReportTemplate = ({ 
  data, 
  titleText, 
  preparerName, 
  preparerRank, 
  approverName, 
  approverRank 
}: Props) => {
  const totalPeople = data?.reduce((sum, item) => sum + item.count, 0) || 0;
  const grandTotal = data?.reduce((sum, item) => sum + item.totalAmount, 0) || 0;

  return (
    <div id="print-area" className="w-full bg-white text-black p-[20mm]">
      <h2 className="text-xl font-bold text-center mb-8">{titleText}</h2>

      <table className="w-[80%] mx-auto border-collapse border border-gray-400">
        <thead>
          <tr className="bg-[#d9d9d9]">
            <th className="border border-gray-400 py-2 px-4 text-sm">สังกัด</th>
            <th className="border border-gray-400 py-2 px-4 text-sm">จำนวน</th>
            <th className="border border-gray-400 py-2 px-4 text-sm">ยอดปรับ</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((item, index) => (
            <tr key={index} className="text-center">
              <td className="border border-gray-400 py-2 px-4 text-sm">{item.branch}</td>
              <td className="border border-gray-400 py-2 px-4 text-sm">{item.count} คน</td>
              <td className="border border-gray-400 py-2 px-4 text-sm">{item.totalAmount.toLocaleString()} บาท</td>
            </tr>
          ))}
          <tr className="bg-[#d9d9d9] font-bold text-center">
            <td className="border border-gray-400 py-2 px-4 text-sm">รวมรายการปรับ</td>
            <td className="border border-gray-400 py-2 px-4 text-sm">{totalPeople} คน</td>
            <td className="border border-gray-400 py-2 px-4 text-sm">{grandTotal.toLocaleString()} บาท</td>
          </tr>
        </tbody>
      </table>

      {/* ส่วนลายเซ็น - ใช้ข้อมูลที่ส่งมาจากหน้าหลัก */}
      <div className="mt-20 flex justify-around items-end">
        <div className="text-center w-[250px]">
          <p className="font-bold mb-12 text-sm">จัดทำโดย</p>
          <p className="text-xs mb-1">(....................................................)</p>
          <p className="font-bold text-sm text-blue-800">{preparerName || "................................"}</p>
          <p className="text-[10px] text-gray-600">{preparerRank || "ตำแหน่ง"}</p>
        </div>

        <div className="text-center w-[250px]">
          <p className="font-bold mb-12 text-sm">อนุมัติโดย</p>
          <p className="text-xs mb-1">(....................................................)</p>
          <p className="font-bold text-sm text-blue-800">{approverName || "................................"}</p>
          <p className="text-[10px] text-gray-600">{approverRank || "ตำแหน่ง"}</p>
        </div>
      </div>
    </div>
  );
};