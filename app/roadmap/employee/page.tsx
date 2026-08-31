"use client";

import { useState, useMemo, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import EmployeeTable from "../components/EmployeeTable";
import { Employee } from "../types";
import { HelpCircle } from "lucide-react";
import EmployeeNotice from "./components/Employeenotice";

type ProbationAlert = {
  employeeCode: string;
  name: string;
  hireDate: string;
  threshold: number;
  daysSinceHire: number;
  daysToThreshold: number;
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
  const [probationAlerts, setProbationAlerts] = useState<ProbationAlert[]>([]);
  const [showProbationAlert, setShowProbationAlert] = useState(false);

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
          const loaded = json.data || [];
          setEmployees(loaded);
          checkProbationAlerts(loaded);
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
    return employees.filter((employee) => {
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
      const matchesUnit = filters.unit ? employee.unit === filters.unit : true;
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
        return a.name.localeCompare(b.name, 'th', { sensitivity: 'accent' });
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
      <div className="mb-2">
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
        <p className="mt-2 text-slate-600 font-medium">
          รายชื่อพนักงานที่ต้องการประเมิน
        </p>
      </div>

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
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {/* แสดงเลขหน้าแบบย่อ (หรือวนลูปแสดงทุกหน้าถ้าหน้าไม่เยอะมาก) */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm rounded-md cursor-pointer ${
                            currentPage === page
                              ? "bg-blue-600 text-white font-bold"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
