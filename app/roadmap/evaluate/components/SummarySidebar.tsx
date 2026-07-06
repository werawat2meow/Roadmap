import { useState } from "react";
import ScoreChart from "./ScoreChart";
import ReportPreviewModal from "./ReportPreviewModal";

// 1. เพิ่มการกำหนดประเภทข้อกำหนด (Interface) เพื่อรับข้อมูลฟอร์มจริงจากคอมโพเนนต์แม่
interface SummarySidebarProps {
  // รับข้อมูลทุกอย่างที่กรอกจากฟอร์มหลักเข้ามาในนี้
  allFormData: {
    id?: string;
    employeeName?: string;
    nickname?: string;
    position?: string;
    department?: string;
    division?: string;
    level?: string;
    startDate?: string;
    companyScore?: number;
    departmentScore?: number;
    expectationScore?: number;
    totalScore?: number;
    grade?: string;
    lateData?: any;
    disciplineData?: any;
  };
  managers?: ManagerUser[];
}

type ManagerUser = {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  role: string;
  menus: string[];
};

type SalaryInputProps = {
  label: string;
  value: number;
  onRangeChange: (value: number) => void;
  onTextChange: (value: string) => void;
};

const SalaryInput = ({
  label,
  value,
  onRangeChange,
  onTextChange,
}: SalaryInputProps) => (
  <div className="mb-4">
    <label className="text-sm text-gray-600 block mb-2">{label}</label>
    <div className="flex items-center gap-4">
      <input
        type="range"
        min="0"
        max="200000"
        value={value}
        onChange={(e) => onRangeChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
      />
      <input
        type="text"
        value={value.toLocaleString()}
        onChange={(e) => onTextChange(e.target.value)}
        className="border rounded-md p-2 text-sm w-28 text-right"
      />
    </div>
  </div>
);

// 2. ปรับตัวฟังก์ชัน SummarySidebar ให้รับ props: allFormData เข้ามาใช้งาน
export default function SummarySidebar({
  allFormData,
  managers = [],
}: SummarySidebarProps) {
  // State สำหรับควบคุมการเปิด-ปิดหน้าต่าง Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [currentSalary, setCurrentSalary] = useState<number>(0);
  const [newSalary, setNewSalary] = useState<number>(0);

  const toggleManager = (managerId: string) => {
    setSelectedManagerIds((prev) => {
      if (prev.includes(managerId)) {
        return prev.filter((id) => id !== managerId);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, managerId];
    });
  };

  const parseSalaryInput = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    const numberValue = Number(digits || "0");
    if (Number.isNaN(numberValue)) return 0;
    return Math.min(200000, Math.max(0, numberValue));
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
      <h3 className="font-bold text-lg mb-6 text-gray-700">Summary</h3>

      <div className="flex justify-between items-center mb-8">
        <div className="text-sm space-y-2 text-gray-600">
          <p>Company Score</p>
          <p className="font-bold text-xl text-gray-800">
            {allFormData?.companyScore !== undefined
              ? allFormData.companyScore
              : "85"}
          </p>

          <p className="mt-2">Department Score</p>
          <p className="font-bold text-xl text-gray-800">
            {allFormData?.departmentScore !== undefined
              ? allFormData.departmentScore
              : "24"}
          </p>

          <p className="mt-2">Expectation Score</p>
          <p className="font-bold text-xl text-gray-800">
            {allFormData?.expectationScore !== undefined
              ? allFormData.expectationScore
              : "13"}
          </p>

          <hr className="my-4" />
          <p className="font-bold text-gray-800 text-md">Total Score</p>
        </div>

        <div className="flex flex-col items-center">
          {/* ดึงค่าคะแนนจริง ถ้าไม่มีให้ดึงค่า 85 กลับมาแสดงผลเพื่อให้กราฟโดนัททำงานได้ถูกต้อง */}
          <ScoreChart
            score={
              allFormData?.companyScore !== undefined
                ? allFormData.companyScore
                : 85
            }
          />

          <p className="text-3xl font-bold text-gray-800 mt-5">
            <span className="text-green-500">{allFormData?.grade ?? "A"}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4 my-8 text-gray-700">
        <SalaryInput
          label="Current Salary"
          value={currentSalary}
          onRangeChange={setCurrentSalary}
          onTextChange={(value) => setCurrentSalary(parseSalaryInput(value))}
        />
        <SalaryInput
          label="New Salary"
          value={newSalary}
          onRangeChange={setNewSalary}
          onTextChange={(value) => setNewSalary(parseSalaryInput(value))}
        />
      </div>

      <div className="mb-6 text-gray-700">
        <label className="text-sm text-gray-600 block mb-1">
          เลือกรายชื่อผู้ประเมิน
        </label>
        <div className="flex gap-2">
          {managers.map((manager) => (
            <label
              key={manager.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedManagerIds.includes(manager.id)}
                onChange={() => toggleManager(manager.id)}
              />
              {manager.name}
            </label>
          ))}
        </div>
      </div>

      <div className="my-6 text-gray-700">
        <label className="text-sm text-gray-600 block mb-1">
          Manager Comment:
        </label>
        <textarea
          rows={3}
          className="w-full border rounded-md p-2 text-sm mt-1"
        ></textarea>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-8">
        <button className="flex flex-col items-center justify-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-[0_4px_12px_rgba(245,158,11,0.25)] transition-all duration-200 active:scale-95 text-center leading-tight cursor-pointer select-none">
          <span>Save</span>
          <span>Draft</span>
        </button>

        <button className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all duration-200 active:scale-95 cursor-pointer select-none">
          Submit
        </button>

        <button
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-[0_4px_12px_rgba(225,29,72,0.25)] transition-all duration-200 active:scale-95 cursor-pointer select-none"
        >
          Preview
        </button>
      </div>

      {/* 3. ส่งข้อมูลผูกตรง (allFormData) ที่รับมาจากฟอร์มกรอกจริง ๆ เข้าไปยัง Component ป๊อปอัป Preview */}
      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={allFormData}
      />
    </div>
  );
}
