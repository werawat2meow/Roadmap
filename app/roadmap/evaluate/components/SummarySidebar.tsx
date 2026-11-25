import { useRef, useState } from "react";
import { Select } from "antd";
import ScoreChart from "./ScoreChart";
import ExpectationPreviewModal from "./ExpectationPreviewModal";
import OutsideFormPreviewModal from "./OutsideFormPreviewModal";

// 1. เพิ่มการกำหนดประเภทข้อกำหนด (Interface) เพื่อรับข้อมูลฟอร์มจริงจากคอมโพเนนต์แม่
interface SummarySidebarProps {
  allFormData: {
    id?: string;
    companyRows?: any[];
    departmentRows?: any[];
    expectationRows?: any[];
    employeeCode?: string;
    employeeName?: string;
    nickname?: string;
    position?: string;
    company?: string;
    department?: string;
    division?: string;
    unit?: string;
    level?: string;
    startDate?: string;
    companyScore?: number;
    departmentScore?: number;
    expectationScore?: number;
    totalScore?: number;
    grade?: string;
    managerComment?: string;
    currentSalary?: number;
    newSalary?: number;
    evaluationPeriod?: string;
    newDesignation?: string;
    newLevel?: string;
    specialCompensation?: number;
    examScore?: number;
    examMaxScore?: number;
    maxScore?: number;
    disciplineData?: any;
  };
  employeeId?: string;
  uploadedBy?: string;
  managers?: ManagerUser[];
  selectedManagerIds?: string[];
  isEditing?: boolean;
  isSaving?: boolean;
  onManagerToggle?: (managerId: string) => void;
  onManagerCommentChange?: (value: string) => void;
  onCurrentSalaryChange?: (value: number) => void;
  onNewSalaryChange?: (value: number) => void;
  onEvaluationPeriodChange?: (value: string) => void;
  onNewDesignationChange?: (value: string) => void;
  onNewLevelChange?: (value: string) => void;
  onSpecialCompensationChange?: (value: number) => void;
  onExamScoreChange?: (value: number) => void;
  onExamMaxScoreChange?: (value: number) => void;
  onMaxScoreChange?: (value: number) => void;
  evaluationType?: string;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  onPreview?: () => void;
  showSaveDraft?: boolean;
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
  onRangeChange?: (value: number) => void;
  onTextChange?: (value: string) => void;
  readOnly?: boolean;
};

const SalaryInput = ({
  label,
  value,
  onRangeChange,
  onTextChange,
  readOnly = false,
}: SalaryInputProps) => (
  <div className="mb-4">
    <label className="text-sm text-gray-600 block mb-2">{label}</label>
    <div className="flex items-center gap-4">
      <input
        type="range"
        min="0"
        max="200000"
        value={value}
        disabled={readOnly}
        onChange={(e) => !readOnly && onRangeChange?.(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
      />
      <input
        type="text"
        value={value.toLocaleString()}
        readOnly={readOnly}
        onChange={(e) => !readOnly && onTextChange?.(e.target.value)}
        className={`border rounded-md p-2 text-sm w-28 text-right ${
          readOnly ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      />
    </div>
  </div>
);

const getGrade = (percent: number) => {
  if (percent >= 85) return "A";
  if (percent >= 75) return "B";
  if (percent >= 65) return "C";
  if (percent >= 50) return "D";
  return "F";
};

// 2. ปรับตัวฟังก์ชัน SummarySidebar ให้รับ props: allFormData เข้ามาใช้งาน
export default function SummarySidebar({
  allFormData,
  employeeId,
  uploadedBy,
  evaluationType,
  managers = [],
  selectedManagerIds = [],
  onManagerToggle,
  onManagerCommentChange,
  onCurrentSalaryChange,
  onNewSalaryChange,
  onExamScoreChange,
  onExamMaxScoreChange,
  onMaxScoreChange,
  onSaveDraft,
  onSubmit,
  onPreview,
  isEditing,
  isSaving = false,
  showSaveDraft = true,
}: SummarySidebarProps) {
  // State สำหรับควบคุมการเปิด-ปิดหน้าต่าง Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isOutsideOpen, setIsOutsideOpen] = useState(false);
  const [isUploadingOutside, setIsUploadingOutside] = useState(false);
  const outsideFileInputRef = useRef<HTMLInputElement>(null);

  const handleImportOutsideForm = async (file?: File) => {
    if (!file || !employeeId) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      window.alert("กรุณาเลือกไฟล์ PDF เท่านั้น");
      return;
    }

    const payload = new FormData();
    payload.append("employeeId", employeeId);
    if (uploadedBy) payload.append("uploadedBy", uploadedBy);
    payload.append("file", file);

    setIsUploadingOutside(true);
    try {
      const response = await fetch("/roadmap/api/employee-documents", {
        method: "POST",
        body: payload,
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "นำเข้าไฟล์ไม่สำเร็จ");
      }
      window.alert("นำเข้า Outside Form เรียบร้อยแล้ว");
    } catch (error: any) {
      window.alert(error?.message || "นำเข้าไฟล์ไม่สำเร็จ");
    } finally {
      setIsUploadingOutside(false);
      if (outsideFileInputRef.current) outsideFileInputRef.current.value = "";
    }
  };

  const parseSalaryInput = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    const numberValue = Number(digits || "0");
    if (Number.isNaN(numberValue)) return 0;
    return Math.min(200000, Math.max(0, numberValue));
  };

  const totalScore = allFormData.totalScore ?? 0;
  const summaryMaxScore = allFormData.maxScore ?? 100;
  const examMaxScore = allFormData.examMaxScore ?? 100;
  const percentage =
    summaryMaxScore > 0 ? Math.round((totalScore / summaryMaxScore) * 100) : 0;

  const computedGrade = getGrade(percentage);

  const disciplinePenalty =
    allFormData.disciplineData?.disciplineItems?.reduce(
      (sum, item) => sum + (item?.count ?? 0) * (item?.penaltyScore ?? 0),
      0,
    ) ?? 0;

  const disciplineBaseScore = 100;
  const disciplineRemainingScore = disciplineBaseScore + disciplinePenalty;
  const disciplineRemainingPercentage =
    disciplineBaseScore > 0
      ? Math.round((disciplineRemainingScore / disciplineBaseScore) * 100)
      : 0;

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
          <ScoreChart score={percentage} grade={computedGrade} />

          <p className="text-3xl font-bold text-gray-800 mt-5">
            <span className="text-green-500">{computedGrade}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4 my-8 text-gray-700">
        <SalaryInput
          label="Current Salary"
          value={allFormData.currentSalary ?? 0}
          readOnly
        />
        <SalaryInput
          label="New Salary"
          value={allFormData.newSalary ?? 0}
          onRangeChange={(value) => onNewSalaryChange?.(value)}
          onTextChange={(value) => onNewSalaryChange?.(parseSalaryInput(value))}
        />
      </div>

      <div className="mb-6 text-gray-700">
        <label className="text-sm text-gray-600 block mb-1">
          เลือกรายชื่อผู้ประเมิน
        </label>

        <Select
          mode="multiple"
          showSearch
          allowClear
          placeholder="ค้นหาและเลือกผู้ประเมิน"
          optionFilterProp="label"
          maxTagCount={2}
          className="w-full"
          value={selectedManagerIds}
          options={managers.map((manager) => ({
            value: manager.employee_id,
            label: `${manager.name}${
              manager.email ? ` (${manager.email})` : ""
            }`,
          }))}
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          onChange={(nextValues) => {
            const nextIds = new Set(nextValues as string[]);

            managers.forEach((manager) => {
              const wasSelected = selectedManagerIds.includes(
                manager.employee_id,
              );

              const isSelected = nextIds.has(manager.employee_id);

              if (wasSelected !== isSelected) {
                onManagerToggle?.(manager.employee_id);
              }
            });
          }}
        />
      </div>

      <div className="my-6 text-gray-700">
        <label className="text-sm text-gray-600 block mb-1">
          Manager Comment:
        </label>
        <textarea
          rows={3}
          className="w-full border rounded-md p-2 text-sm mt-1"
          value={allFormData.managerComment ?? ""}
          onChange={(e) => onManagerCommentChange?.(e.target.value)}
        ></textarea>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm text-gray-600 block mb-2">
            คะแนนสอบที่ได้
          </label>
          <input
            type="number"
            min={0}
            max={examMaxScore}
            value={allFormData.examScore ?? 0}
            onChange={(e) => onExamScoreChange?.(Number(e.target.value))}
            className="w-full border rounded-md p-2 text-sm text-black"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-2">คะแนนเต็ม</label>
          <input
            type="number"
            min={0}
            value={examMaxScore}
            onChange={(e) => onExamMaxScoreChange?.(Number(e.target.value))}
            className="w-full border rounded-md p-2 text-sm text-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-8">
        {showSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className={`flex flex-col items-center justify-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-95 text-center leading-tight select-none ${
              isSaving
                ? "cursor-not-allowed opacity-60"
                : "hover:from-amber-600 hover:to-orange-600 hover:shadow-[0_4px_12px_rgba(245,158,11,0.25)]"
            }`}
          >
            <span>
              {isSaving
                ? isEditing
                  ? "Updating..."
                  : "Saving..."
                : isEditing
                  ? "Update Draft"
                  : "Save Draft"}
            </span>
          </button>
        )}

        {/* <button
          type="button"
          onClick={onSubmit}
          disabled={isSaving}
          className={`flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-95 select-none ${
            isSaving
              ? "cursor-not-allowed opacity-60"
              : "hover:from-blue-700 hover:to-indigo-700 hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
          }`}
        >
          {isSaving ? "Submitting..." : "Submit"}
        </button> */}
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
            className={`flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-95 select-none ${
              isSaving
                ? "cursor-not-allowed opacity-60"
                : "hover:from-blue-700 hover:to-indigo-700 hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
            }`}
          >
            {isSaving ? "Submitting..." : "Submit"}
          </button>
        )}

        <button
          onClick={() => {
            if (onPreview) {
              onPreview();
            } else {
              setIsPreviewOpen(true);
            }
          }}
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-[0_4px_12px_rgba(225,29,72,0.25)] transition-all duration-200 active:scale-95 cursor-pointer select-none"
        >
          Preview Form
        </button>
        <button
          type="button"
          onClick={() => setIsOutsideOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-95 cursor-pointer select-none"
        >
          Outside Form
        </button>
        <button
          type="button"
          onClick={() => outsideFileInputRef.current?.click()}
          disabled={isUploadingOutside || !employeeId}
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-95 cursor-pointer select-none"
        >
          {isUploadingOutside ? "Importing..." : "Import Outside Form"}
        </button>
        <input
          ref={outsideFileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => handleImportOutsideForm(event.target.files?.[0])}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white">
            คะแนนประเมินผลงาน
          </div>
          <div className="p-5 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>คะแนนประเมินผลงาน</span>
              <span className="font-semibold text-slate-900">{totalScore}</span>
            </div>
            <div className="flex justify-between">
              <span>คะแนนเต็ม</span>
              <span className="font-semibold text-slate-900">
                {summaryMaxScore}
              </span>
            </div>
            <div className="flex justify-between">
              <span>คิดเป็นเปอร์เซ็นต์</span>
              <span className="font-semibold text-slate-900">
                {percentage}%
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white">
            คะแนนระเบียบวินัย
          </div>
          <div className="p-5 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>คะแนนถูกหัก</span>
              <span className="font-semibold text-rose-600">
                {disciplinePenalty}
              </span>
            </div>
            <div className="flex justify-between">
              <span>คะแนนคงเหลือ</span>
              <span className="font-semibold text-slate-900">
                {disciplineRemainingScore}
              </span>
            </div>
            <div className="flex justify-between">
              <span>คิดเป็นเปอร์เซ็นต์</span>
              <span className="font-semibold text-slate-900">
                {disciplineRemainingPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ส่งข้อมูลผูกตรง (allFormData) ที่รับมาจากฟอร์มกรอกจริง ๆ เข้าไปยัง Component ป๊อปอัป Preview */}
      {!onPreview && (
        <ExpectationPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          data={{ ...allFormData, evaluationType }}
        />
      )}
      <OutsideFormPreviewModal
        isOpen={isOutsideOpen}
        onClose={() => setIsOutsideOpen(false)}
        data={{ ...allFormData, evaluationType }}
      />
    </div>
  );
}
