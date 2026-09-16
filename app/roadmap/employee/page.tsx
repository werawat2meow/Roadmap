"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import SearchBar from "../components/SearchBar";
import EmployeeTable from "../components/EmployeeTable";
import { Employee } from "../types";
import { HelpCircle } from "lucide-react";
import EmployeeNotice from "./components/Employeenotice";
import { Send } from "lucide-react";
import { getEvaluationCycleInfo } from "@/lib/roadmap/cycleHelper";

type ProbationAlert = {
  employeeCode: string;
  name: string;
  hireDate: string;
  threshold: number;
  daysSinceHire: number;
  daysToThreshold: number;
};

type NominatedEvaluation = {
  id: string;
  employee_id: string;
  evaluationType?:
    | "Performance"
    | "Promote"
    | "Progression"
    | "Probation"
    | null;
  employee?: {
    first_name_th?: string | null;
    last_name_th?: string | null;
    employee_code?: string | null;
  } | null;
};

export default function EmployeePage() {
  const [showGuide, setShowGuide] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    branch: "",
    department: "",
    division: "",
    unit: "",
    level: "",
    status: "",
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // --- เพิ่ม State สำหรับ Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [pageWindowStart, setPageWindowStart] = useState<number | null>(null);
  const [probationAlerts, setProbationAlerts] = useState<ProbationAlert[]>([]);
  const [showProbationAlert, setShowProbationAlert] = useState(false);
  const cycleInfo = getEvaluationCycleInfo();
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [isSendingEvaluationAlert, setIsSendingEvaluationAlert] =
    useState(false);
  const [nominatedEvaluations, setNominatedEvaluations] = useState<
    NominatedEvaluation[]
  >([]);
  const [showNominatedBanner, setShowNominatedBanner] = useState<boolean>(true);
  const [isNominationPickerOpen, setIsNominationPickerOpen] = useState(false);

  useEffect(() => {
    async function checkNominatedList() {
      try {
        const res = await fetch("/roadmap/api/evaluations?status=Nominated");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNominatedEvaluations(json.data);
        }
      } catch (err) {
        console.error("Failed to load nominated count:", err);
      }
    }
    checkNominatedList();
  }, []);

  const nominatedCount = nominatedEvaluations.length;
  const nominatedEmployeeNames = nominatedEvaluations
    .map((evaluation) => {
      const employee = evaluation.employee;
      const name = [employee?.first_name_th, employee?.last_name_th]
        .filter(Boolean)
        .join(" ")
        .trim();

      return name || employee?.employee_code || evaluation.employee_id;
    })
    .filter(Boolean);
  const nominatedPreviewNames = nominatedEmployeeNames.slice(0, 3).join(", ");

  const handleSendNominationAlert = async () => {
    const confirmSend = window.confirm(
      "ยืนยันการส่งแจ้งเตือนไปยังหัวหน้างาน (Manager) ทุกท่าน เพื่อให้ส่งรายชื่อพนักงานเข้าแผนรอบเดือนหน้าหรือไม่?",
    );
    if (!confirmSend) return;

    setIsSendingAlert(true);
    try {
      const res = await fetch("/roadmap/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "REQUEST_NOMINATION" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการส่งแจ้งเตือน");
      }
      window.alert(data.message || "ส่งแจ้งเตือนไปยังหัวหน้างานเรียบร้อยแล้ว");
    } catch (err: any) {
      window.alert(err.message || "ส่งแจ้งเตือนไม่สำเร็จ");
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleSendEvaluationAlert = async () => {
    const confirmSend = window.confirm(
      "ยืนยันการส่งแจ้งเตือนให้หัวหน้าเข้ามาลงคะแนนประเมินหรือไม่?",
    );

    if (!confirmSend) return;

    setIsSendingEvaluationAlert(true);

    try {
      const res = await fetch("/roadmap/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "REQUEST_MANAGER_EVALUATION" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "ส่งแจ้งเตือนไม่สำเร็จ");
      }

      window.alert(data.message || "ส่งแจ้งเตือนเรียบร้อยแล้ว");
    } catch (err: any) {
      window.alert(err.message || "ส่งแจ้งเตือนไม่สำเร็จ");
    } finally {
      setIsSendingEvaluationAlert(false);
    }
  };

  useEffect(() => {
    const isDismissed = localStorage.getItem("hide_employee_guide");
    if (!isDismissed) {
      const timer = setTimeout(() => setShowGuide(true), 800); // ดีเลย์นิดนึงให้ดูนุ่มนวล
      return () => clearTimeout(timer);
    }
  }, []);

  const closeGuide = () => {
    setShowGuide(false);
    localStorage.setItem("hide_employee_guide", "true");
  };

  const openGuide = () => {
    setShowGuide(true);
  };

  const getDaysSinceHire = (hireDate: string) => {
    const start = new Date(hireDate);
    if (Number.isNaN(start.getTime())) return null;
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const checkProbationAlerts = (employeeList: Employee[]) => {
    const thresholds = [60, 90, 120];
    const alerts = employeeList
      .map((employee) => {
        if (!employee.hireDate) return null;
        const daysSinceHire = getDaysSinceHire(employee.hireDate);
        if (daysSinceHire === null || daysSinceHire < 0) return null;

        const threshold = thresholds.find((value) => {
          const delta = Math.abs(daysSinceHire - value);
          return delta <= 7;
        });

        if (!threshold) return null;

        return {
          employeeCode: employee.employeeCode,
          name: employee.name,
          hireDate: employee.hireDate,
          threshold,
          daysSinceHire,
          daysToThreshold: threshold - daysSinceHire,
        };
      })
      .filter(Boolean) as ProbationAlert[];

    setProbationAlerts(alerts);
    setShowProbationAlert(alerts.length > 0);
  };

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch("/roadmap/api/employees");
        const json = await res.json();
        if (json.success) {
          const loaded: Employee[] = json.data || [];
          setEmployees(loaded);

          // checkProbationAlerts logic moved here
          const thresholds = [60, 90, 120];
          const alerts = loaded
            .map((employee) => {
              if (!employee.hireDate) return null;
              const start = new Date(employee.hireDate);
              if (Number.isNaN(start.getTime())) return null;
              const now = new Date();
              const daysSinceHire = Math.floor(
                (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
              );
              if (daysSinceHire < 0) return null;

              const threshold = thresholds.find(
                (value) => Math.abs(daysSinceHire - value) <= 7,
              );
              if (!threshold) return null;

              return {
                employeeCode: employee.employeeCode,
                name: employee.name,
                hireDate: employee.hireDate,
                threshold,
                daysSinceHire,
                daysToThreshold: threshold - daysSinceHire,
              } as ProbationAlert;
            })
            .filter(Boolean) as ProbationAlert[];

          setProbationAlerts(alerts);
          setShowProbationAlert(alerts.length > 0);
        } else {
          console.error("Employee fetch failed", json.error);
        }
      } catch (error) {
        console.error("Employee fetch error", error);
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, []);

  const branches = useMemo(
    () => [...new Set(employees.map((e) => e.branch).filter(Boolean))],
    [employees],
  );

  const departments = useMemo(
    () => [
      ...new Set(
        employees
          .filter((e) => !filters.branch || e.branch === filters.branch)
          .map((e) => e.department)
          .filter(Boolean),
      ),
    ],
    [employees, filters.branch],
  );

  const divisions = useMemo(
    () => [
      ...new Set(
        employees
          .filter(
            (e) =>
              (!filters.branch || e.branch === filters.branch) &&
              (!filters.department || e.department === filters.department),
          )
          .map((e) => e.division)
          .filter(Boolean),
      ),
    ],
    [employees, filters.branch, filters.department],
  );

  const units = useMemo(
    () => [
      ...new Set(
        employees
          .filter(
            (e) =>
              (!filters.branch || e.branch === filters.branch) &&
              (!filters.department || e.department === filters.department) &&
              (!filters.division || e.division === filters.division),
          )
          .map((e) => e.unit)
          .filter(Boolean),
      ),
    ],
    [employees, filters.branch, filters.department, filters.division],
  );

  const levels = useMemo(
    () => [
      ...new Set(
        employees
          .filter(
            (e) =>
              (!filters.branch || e.branch === filters.branch) &&
              (!filters.department || e.department === filters.department) &&
              (!filters.division || e.division === filters.division) &&
              (!filters.unit || e.unit === filters.unit),
          )
          .map((e) => e.level)
          .filter(Boolean),
      ),
    ],
    [
      employees,
      filters.branch,
      filters.department,
      filters.division,
      filters.unit,
    ],
  );

  const items = useMemo(
    () =>
      employees.map((employee) => ({
        branch: employee.branch || "",
        department: employee.department || "",
        division: employee.division || "",
        unit: employee.unit || "",
        level: employee.level || "",
      })),
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((employee) => {
        const matchesSearch = employee.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesBranch = filters.branch
          ? employee.branch === filters.branch
          : true;
        const matchesDepartment = filters.department
          ? employee.department === filters.department
          : true;
        const matchesDivision = filters.division
          ? employee.division === filters.division
          : true;
        const matchesUnit = filters.unit
          ? employee.unit === filters.unit
          : true;
        const matchesLevel = filters.level
          ? employee.level === filters.level
          : true;
        const matchesStatus = filters.status
          ? employee.status === filters.status
          : true;
        return (
          matchesSearch &&
          matchesBranch &&
          matchesDepartment &&
          matchesDivision &&
          matchesUnit &&
          matchesLevel &&
          matchesStatus
        );
      })
      .sort((a, b) => {
        return a.name.localeCompare(b.name, "th", { sensitivity: "accent" });
      });
  }, [searchTerm, filters, employees]);

  // --- Logic สำหรับการตัดแบ่งข้อมูล (Pagination) ---
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const currentEmployees = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredEmployees.slice(firstIndex, lastIndex);
  }, [filteredEmployees, currentPage]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Employee
            </h1>
            <button
              onClick={openGuide}
              className="p-1.5 text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-all duration-200 cursor-pointer"
              title="วิธีใช้งาน"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
          <p className="mt-1 text-slate-600 font-medium">
            รายชื่อพนักงานที่ต้องการประเมิน
          </p>
        </div>

        {/* 👉 ปุ่มขวาบนสุด: ส่งแจ้งเตือนขอรายชื่อ (26-27) */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSendNominationAlert}
            disabled={isSendingAlert}
            title={
              cycleInfo.isNominationAlert
                ? "ช่วงวันที่ 26-27: ส่งแจ้งเตือนให้หัวหน้าเสนอรายชื่อพนักงาน"
                : "ปุ่มนี้ใช้สำหรับส่งแจ้งเตือนขอรายชื่อ ช่วงที่ควรส่งคือวันที่ 26-27"
            }
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition shadow-md active:scale-95 cursor-pointer ${
              cycleInfo.isNominationAlert
                ? "bg-amber-500 text-white hover:bg-amber-600 animate-pulse"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Send size={15} />
            {isSendingAlert ? "กำลังส่ง..." : "ส่งแจ้งเตือนขอรายชื่อ"}
          </button>

          <button
            onClick={handleSendEvaluationAlert}
            disabled={
              !cycleInfo.isEvaluationDueSoon || isSendingEvaluationAlert
            }
            title={
              cycleInfo.isEvaluationDueSoon
                ? "ช่วงวันที่ 6-7: ส่งแจ้งเตือนให้หัวหน้าเข้ามาลงคะแนน"
                : "ปุ่มนี้จะกดได้ช่วงวันที่ 6-7 เพื่อแจ้งหัวหน้าให้ลงคะแนน"
            }
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition shadow-md active:scale-95 ${
              cycleInfo.isEvaluationDueSoon
                ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400 opacity-60"
            }`}
          >
            <Send size={15} />
            {isSendingEvaluationAlert ? "กำลังส่ง..." : "ส่งแจ้งเตือนลงคะแนน"}
          </button>
        </div>
      </div>

      {showNominatedBanner && nominatedCount > 0 && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500 p-2 text-white shadow-sm">
              <Send size={18} />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <span>มีหัวหน้างานส่งรายชื่อพนักงานเข้ามาแล้ว</span>
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs text-white font-bold">
                  {nominatedCount} คน
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-600 mt-0.5">
                หัวหน้างานได้ส่งรายชื่อพนักงานเข้าแผนรอบประเมินประจำเดือน
                กรุณาจัดทำและออกใบประเมินภายในวันที่ 2
              </p>
              {nominatedPreviewNames && (
                <p className="mt-1 text-xs font-semibold text-emerald-700">
                  {nominatedPreviewNames}
                  {nominatedCount > 3 ? ` +${nominatedCount - 3}` : ""}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNominationPickerOpen(true)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition whitespace-nowrap"
            >
              ไปออกใบประเมิน &rarr;
            </button>
            <button
              type="button"
              onClick={() => setShowNominatedBanner(false)}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {isNominationPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  เลือกพนักงานที่ต้องออกใบประเมิน
                </h2>
                <p className="text-sm text-slate-500">
                  รายชื่อที่หัวหน้างานส่งเข้ามา
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNominationPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {nominatedEvaluations.map((evaluation) => {
                const employee = evaluation.employee;
                const employeeName =
                  [employee?.first_name_th, employee?.last_name_th]
                    .filter(Boolean)
                    .join(" ")
                    .trim() ||
                  employee?.employee_code ||
                  evaluation.employee_id;

                const evaluationType =
                  evaluation.evaluationType || "Performance";

                return (
                  <Link
                    key={evaluation.id}
                    href={`/roadmap/evaluate/${evaluation.employee_id}?type=${encodeURIComponent(
                      evaluationType,
                    )}&evaluationId=${encodeURIComponent(evaluation.id)}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-emerald-50 hover:border-emerald-200 transition"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {employeeName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {employee?.employee_code || evaluation.employee_id}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      {evaluationType}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EmployeeNotice ตรงนี้ */}
      <EmployeeNotice isOpen={showGuide} onClose={closeGuide} />

      <div>
        <SearchBar
          placeholder="Search Employees..."
          onSearch={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          onFilter={(values) => {
            setFilters(values);
            setCurrentPage(1);
          }}
          selectedFilters={filters}
          filterOptions={{
            branches,
            departments,
            divisions,
            units,
            levels,
            statuses: ["Active", "On Leave"],
            items,
          }}
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <p>Loading employees...</p>
        ) : (
          <>
            {showProbationAlert && probationAlerts.length > 0 && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-slate-100 transform transition-all">
                  {/* Header Section */}
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex gap-3 items-center">
                      {/* Icon Anchor */}
                      <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
                        <svg
                          xmlns="http://w3.org"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                          แจ้งเตือน Probation
                        </h2>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          พบพนักงานใกล้ครบวันประเมิน Probation (60 / 90 / 120
                          วัน)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProbationAlert(false)}
                      className="rounded-xl bg-slate-50 hover:bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors duration-200"
                    >
                      ปิด
                    </button>
                  </div>

                  {/* List Section */}
                  <div className="mt-5 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {probationAlerts.map((alert) => {
                      const isOverdue = alert.daysToThreshold < 0;
                      return (
                        <div
                          key={`${alert.employeeCode}-${alert.threshold}`}
                          className={`group flex items-start justify-between gap-4 rounded-2xl border p-4 transition-all duration-200 hover:shadow-sm ${
                            isOverdue
                              ? "border-rose-100 bg-rose-50/50 hover:bg-rose-50"
                              : "border-amber-100 bg-amber-50/40 hover:bg-amber-50"
                          }`}
                        >
                          {/* Left: Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 text-base group-hover:text-slate-900">
                                {alert.name}
                              </span>
                              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {alert.employeeCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              <svg
                                xmlns="http://w3.org"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-3.5 h-3.5 text-slate-400"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                                />
                              </svg>
                              <span>
                                เริ่มงาน{" "}
                                {new Date(alert.hireDate).toLocaleDateString(
                                  "th-TH",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span>เป้าหมาย {alert.threshold} วัน</span>
                            </div>
                          </div>

                          {/* Right: Status Badge */}
                          <div className="text-right shrink-0">
                            {isOverdue ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 animate-pulse">
                                  เลยกำหนด
                                </span>
                                <span className="text-xs font-bold text-rose-600">
                                  {Math.abs(alert.daysToThreshold)} วัน
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                  ใกล้ครบกำหนด
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  อีก {alert.daysToThreshold} วัน
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {/* ส่งข้อมูลที่ถูกหั่นแล้ว (currentEmployees) ไปแสดงผล */}
            <EmployeeTable employees={currentEmployees} />

            {/* ส่วนควบคุม Pagination UI */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-600">
                  แสดงข้อมูล {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredEmployees.length,
                  )}{" "}
                  จากทั้งหมด {filteredEmployees.length} รายการ
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(p - 1, 1));
                      setPageWindowStart(null);
                    }}
                    disabled={currentPage === 1}
                    className="cursor-pointer px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {(() => {
                      const visible = 5;
                      let windowStart =
                        pageWindowStart ??
                        Math.max(
                          1,
                          Math.min(
                            currentPage - Math.floor(visible / 2),
                            Math.max(1, totalPages - visible + 1),
                          ),
                        );
                      windowStart = Math.min(
                        windowStart,
                        Math.max(1, totalPages - visible + 1),
                      );
                      const windowEnd = Math.min(
                        windowStart + visible - 1,
                        totalPages,
                      );

                      const pages: number[] = [];
                      for (let p = windowStart; p <= windowEnd; p++)
                        pages.push(p);

                      return pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => {
                            setCurrentPage(page);
                            if (
                              (page === windowEnd && page < totalPages) ||
                              (page === windowStart && page > 1)
                            ) {
                              // center the clicked page (make it the middle)
                              setPageWindowStart(Math.max(1, page - 1));
                            } else {
                              setPageWindowStart(null);
                            }
                          }}
                          className={`px-3 py-1 text-sm rounded-md cursor-pointer ${
                            currentPage === page
                              ? "bg-blue-600 text-white font-bold"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(p + 1, totalPages));
                      setPageWindowStart(null);
                    }}
                    disabled={currentPage === totalPages}
                    className="cursor-pointer px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
