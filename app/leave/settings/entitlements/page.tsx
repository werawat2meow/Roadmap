"use client";

import React, { useState } from "react";
import { Trash2, Plus } from "lucide-react";

interface LeaveRightsTemplate {
  id: number;
  prefix: string;
  annualLeaveDays: number;
  businessLeaveDays: number;
  sickLeaveDays: number;
  ordainLeaveDays: number;
  maternityLeaveDays: number;
  unpaidLeaveDays: number;
  birthdayLeaveDays: number;
  holidayLeaveDays: number;
}

const initialData: LeaveRightsTemplate[] = [
  {
    id: 1,
    prefix: "P2",
    annualLeaveDays: 7,
    businessLeaveDays: 3,
    sickLeaveDays: 30,
    ordainLeaveDays: 7,
    maternityLeaveDays: 120,
    unpaidLeaveDays: 365,
    birthdayLeaveDays: 1,
    holidayLeaveDays: 15,
  },
];

export default function LeaveSettingsEntitlementsPage() {
  const [data, setData] = useState<LeaveRightsTemplate[]>(initialData);

  const handleValueChange = (
    id: number,
    field: keyof LeaveRightsTemplate,
    value: string,
  ) => {
    setData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === "prefix" ? value : parseInt(value) || 0,
          };
        }
        return item;
      }),
    );
  };

  // ฟังก์ชันเพิ่มระดับพนักงานแบบ คัดลอกค่าจากตัวล่าสุด
  const addNewLevel = () => {
    // 1. หาข้อมูลตัวสุดท้ายในลิสต์เพื่อใช้เป็นต้นแบบ (Baseline)
    const lastItem = data[data.length - 1];

    // 2. คำนวณ Prefix ใหม่ (P2 -> P3)
    let nextNumber = 2;
    if (lastItem && lastItem.prefix.startsWith("P")) {
      const currentNumber = parseInt(lastItem.prefix.replace("P", ""));
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }

    // 3. หา ID ใหม่
    const newId = data.length > 0 ? Math.max(...data.map((d) => d.id)) + 1 : 1;

    // 4. สร้าง Object ใหม่โดยคัดลอกค่าทั้งหมดมาจาก lastItem
    // ใช้ ...lastItem เพื่อก๊อปปี้จำนวนวันลาทั้งหมดมา แล้วค่อยแก้ id กับ prefix
    const newItem: LeaveRightsTemplate = {
      ...lastItem,
      id: newId,
      prefix: `P${nextNumber}`,
    };

    setData([...data, newItem]);
  };

  const removeLevel = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบระดับนี้?")) {
      setData(data.filter((item) => item.id !== id));
    }
  };

  return (
    <section className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
            Leave Entitlement Settings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            กำหนดจำนวนวันลาต่อระดับพนักงาน —{" "}
            <span className="text-blue-600 font-medium italic">
              ระบบจะคัดลอกค่าจากลำดับล่าสุดให้อัตโนมัติ
            </span>
          </p>
        </div>
        <button
          onClick={addNewLevel}
          className="cursor-pointer flex items-center gap-2 
             bg-gradient-to-r from-emerald-500 to-emerald-600 
             text-white px-6 py-3 rounded-2xl 
             hover:from-emerald-600 hover:to-emerald-700 
             hover:shadow-lg hover:shadow-emerald-200 
             active:scale-95 transition-all duration-200 
             font-semibold shadow-md border border-emerald-400/20"
        >
          <Plus size={18} className="stroke-[3px]" />
          เพิ่มรายการ
        </button>
      </div>

      {/* Cards List */}
      <div className="space-y-8">
        {data.map((item) => (
          <div
            key={item.id}
            className="relative rounded-3xl bg-white p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md"
          >
            {/* ปุ่มลบสีแดง มุมขวาบน */}
            <button
              onClick={() => removeLevel(item.id)}
              className="cursor-pointer absolute -top-3 -right-3 flex items-center justify-center w-10 h-10 bg-white border border-red-100 text-red-500 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all z-10"
            >
              <Trash2 size={18} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-8">
              <InputBox
                label="Level P"
                value={item.prefix}
                onChange={(v) => handleValueChange(item.id, "prefix", v)}
                isText
              />
              <InputBox
                label="ลาพักร้อน"
                value={item.annualLeaveDays}
                onChange={(v) =>
                  handleValueChange(item.id, "annualLeaveDays", v)
                }
              />
              <InputBox
                label="ลากิจ"
                value={item.businessLeaveDays}
                onChange={(v) =>
                  handleValueChange(item.id, "businessLeaveDays", v)
                }
              />
              <InputBox
                label="ลาป่วย"
                value={item.sickLeaveDays}
                onChange={(v) => handleValueChange(item.id, "sickLeaveDays", v)}
              />
              <InputBox
                label="ลาบวช"
                value={item.ordainLeaveDays}
                onChange={(v) =>
                  handleValueChange(item.id, "ordainLeaveDays", v)
                }
              />
              <InputBox
                label="ลาคลอด"
                value={item.maternityLeaveDays}
                onChange={(v) =>
                  handleValueChange(item.id, "maternityLeaveDays", v)
                }
              />
              <InputBox
                label="ลาไม่รับค่าจ้าง"
                value={item.unpaidLeaveDays}
                onChange={(v) =>
                  handleValueChange(item.id, "unpaidLeaveDays", v)
                }
              />
              <InputBox
                label="ลาวันเกิด"
                value={item.birthdayLeaveDays}
                onChange={(v) =>
                  handleValueChange(item.id, "birthdayLeaveDays", v)
                }
              />
              <InputBox
                label="วันหยุดประจำปี"
                value={item.holidayLeaveDays}
                onChange={(v) =>
                  handleValueChange(item.id, "holidayLeaveDays", v)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InputBox({
  label,
  value,
  onChange,
  isText = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  isText?: boolean;
}) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <input
        type={isText ? "text" : "number"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 px-4 py-3.5 text-slate-700 font-bold focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm text-sm"
      />
    </div>
  );
}
