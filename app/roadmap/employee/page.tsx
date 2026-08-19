"use client";

import React, { useState, useMemo, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import EmployeeTable from "../components/EmployeeTable";
import { Employee } from "../types";

export default function EmployeePage() {
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

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch("/roadmap/api/employees");
        const json = await res.json();
        if (json.success) {
          setEmployees(json.data || []);
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
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900">Employee</h1>
        <p className="mt-2 text-sm text-slate-700">
          รายชื่อพนักงานที่ต้องการประเมิน
        </p>
      </div>

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
            {/* ส่งข้อมูลที่ถูกหั่นแล้ว (currentEmployees) ไปแสดงผล */}
            <EmployeeTable employees={currentEmployees} />

            {/* ส่วนควบคุม Pagination UI */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-600">
                  แสดงข้อมูล {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} จากทั้งหมด {filteredEmployees.length} รายการ
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                     {/* แสดงเลขหน้าแบบย่อ (หรือวนลูปแสดงทุกหน้าถ้าหน้าไม่เยอะมาก) */}
                     {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                     ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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