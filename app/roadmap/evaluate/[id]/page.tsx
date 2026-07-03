"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import EvaluationTabs from "@/app/roadmap/evaluate/components/EvaluationTabs";
import EmployeeInfoCard from "@/app/roadmap/evaluate/components/EmployeeInfoCard";
import SummarySidebar from "@/app/roadmap/evaluate/components/SummarySidebar";
import EvaluationForm from "@/app/roadmap/evaluate/components/EvaluationForm";
import { Employee } from "@/app/roadmap/types";

type SettingsCategory = {
  id: string;
  title: string;
  type: "Company Common Graound" | "Department Common Ground" | string;
  level: string;
  department_id?: string | null;
  division_id?: string | null;
  unit_id?: string | null;
  items: { id: string; topic: string; weight: number }[];
};

export default function EvaluateEmployeePage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [settingsCategories, setSettingsCategories] = useState<
    SettingsCategory[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "Probation" | "Performance" | "Promote" | "Progression"
  >("Probation");
  const [showPopup, setShowPopup] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    const expiryTime = localStorage.getItem("hideEvaluationPopupUntil");
    if (!expiryTime || new Date().getTime() > parseInt(expiryTime)) {
      const timer = setTimeout(() => setShowPopup(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClosePopup = () => {
    if (dontShowToday) {
      const tomorrow = new Date().getTime() + 24 * 60 * 60 * 1000;
      localStorage.setItem("hideEvaluationPopupUntil", tomorrow.toString());
    }
    setShowPopup(false);
  };

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [employeeRes, settingsRes] = await Promise.all([
          fetch(`/roadmap/api/employees/${id}`),
          fetch("/roadmap/api/settings"),
        ]);

        const employeeJson = await employeeRes.json();
        const settingsJson = await settingsRes.json();

        if (!employeeJson.success) {
          throw new Error(employeeJson.error || "ไม่พบข้อมูลพนักงาน");
        }

        if (!settingsJson.success) {
          throw new Error(settingsJson.error || "ไม่พบข้อมูลการตั้งค่า");
        }

        setEmployee(employeeJson.data);
        setSettingsCategories(settingsJson.data || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "เกิดข้อผิดพลาดขณะโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const companyGround = useMemo(() => {
    if (!employee) return [];
    return settingsCategories.filter(
      (cat) =>
        cat.type === "Company Common Ground" && cat.level === employee.level,
    );
  }, [employee, settingsCategories]);

  const departmentGround = useMemo(() => {
    if (!employee) return [];

    return settingsCategories.filter((cat) => {
      if (cat.type !== "Department Common Ground") return false;
      if (cat.level !== employee.level) return false;

      if (cat.unit_id && employee.unitId) {
        return cat.unit_id === employee.unitId;
      }
      if (cat.division_id && employee.divisionId) {
        return cat.division_id === employee.divisionId;
      }
      if (cat.department_id && employee.departmentId) {
        return cat.department_id === employee.departmentId;
      }

      return false;
    });
  }, [employee, settingsCategories]);

  const renderFormContent = () => (
    <EvaluationForm
      formType={activeTab}
      employeeLevel={employee.level}
      companyGround={companyGround}
      departmentGround={departmentGround}
    />
  );

  if (loading) {
    return <p className="p-6 text-slate-600">กำลังโหลดข้อมูลพนักงาน...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-500">{error}</p>;
  }

  if (!employee) {
    return <p className="p-6 text-slate-600">ไม่พบข้อมูลพนักงาน</p>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Evaluate HR</h1>
          <p className="text-gray-500 mt-1">
            ติดตามและจัดการผลการประเมินพนักงาน
          </p>
        </div>
      </div>
      {showPopup && (
        <div className="relative mx-4 my-3 md:absolute md:top-45 md:left-64 md:mx-0 md:my-0 z-50 animate-bounce-slow max-w-sm w-[calc(100%-32px)] md:w-auto">
          <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-gray-900 p-4 rounded-2xl border-b-8 border-amber-600 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.4),0_8px_16px_-6px_rgba(0,0,0,0.2)] relative">
            {/* 📐 ซ่อนสามเหลี่ยมชี้ด้านบนตอนอยู่บนจอมือถือ เพราะป๊อปอัพจะลงไปต่อท้ายใต้เมนูพอดี ค่อยโชว์บนจอคอม */}
            <div className="hidden md:block absolute -top-3 left-12 w-6 h-6 bg-amber-400 rotate-45 border-l border-t border-amber-300 shadow-[-4px_-4px_6px_rgba(0,0,0,0.05)]" />

            <div className="flex items-start space-x-3">
              <AlertCircle
                size={20}
                className="mt-0.5 text-amber-950 shrink-0"
              />
              <div className="flex-1">
                <h4 className="font-extrabold text-sm text-amber-950">
                  คำแนะนำการประเมิน
                </h4>
                <p className="text-xs font-semibold text-amber-900 mt-1 leading-relaxed">
                  อย่าลืมเลือกหัวข้อการประเมินกลุ่ม{" "}
                  <span className="underline decoration-2 font-black">4 P</span>{" "}
                  ด้านบนนี้ให้ถูกต้องก่อนทำการบันทึกข้อมูลคะแนนพนักงานนะคะ
                </p>
              </div>
              <button
                onClick={handleClosePopup}
                className="text-amber-950 hover:bg-amber-300/40 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-600/20 flex items-center justify-between">
              <label className="flex items-center space-x-2 text-[11px] font-bold text-amber-950 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowToday}
                  onChange={(e) => setDontShowToday(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-amber-600/30 border-none text-amber-950 focus:ring-0 cursor-pointer"
                />
                <span>ไม่ต้องแสดงอีกในวันนี้</span>
              </label>
              <button
                onClick={handleClosePopup}
                className="bg-amber-950 text-white text-[11px] font-extrabold py-1 px-3 rounded-lg border-b-2 border-black hover:bg-amber-900 active:border-b-0 active:translate-y-0.5 transition-all cursor-pointer"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6">
        <EvaluationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <EmployeeInfoCard employee={employee} evaluationType={activeTab} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">{renderFormContent()}</div>
        <div>
          <SummarySidebar allFormData={{}} />
        </div>
      </div>
    </div>
  );
}
