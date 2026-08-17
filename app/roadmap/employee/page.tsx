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
          onSearch={setSearchTerm}
          onFilter={setFilters}
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

      <div>
        {loading ? (
          <p>Loading employees...</p>
        ) : (
          <EmployeeTable employees={filteredEmployees} />
        )}
      </div>
    </div>
  );
}
