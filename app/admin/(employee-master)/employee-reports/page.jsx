"use client";

import { useEffect, useMemo, useState } from "react";
import {TeamOutlined,UserAddOutlined,UserDeleteOutlined,SafetyOutlined,DownloadOutlined,SearchOutlined,} from "@ant-design/icons";


export default function EmployeeReportsPage() {
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    probationEmployees: 0,
    resignedEmployees: 0,
    retiredEmployees: 0,
    suspendedEmployees: 0,
    newThisMonth: 0,
    resignedThisMonth: 0,
    newThisYear: 0,
    resignedThisYear: 0,
    gender: "",
    nationality: "",
    positionLevel: "",
  });

  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    employeeStatus: "",
    branch: "",
    department: "",
    division: "",
    unit: "",
    employmentType: "",
    hireDateFrom: "",
    hireDateTo: "",
    resignationDateFrom: "",
    resignationDateTo: "",
    gender: "",
    nationality: "",
    positionLevel: "",
  });


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "/api/admin/employee-reports",
        {
          cache: "no-store",
        }
      );
      const result = await res.json();
      console.log(result);
      if (!res.ok) {
        throw new Error(
          result?.error || "โหลดข้อมูลไม่สำเร็จ"
        );
      }

      setSummary(result.summary || {});
      setEmployees(result.employees || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    let rows = [...employees];

    if (filters.search) {
      const keyword = filters.search.toLowerCase();

      rows = rows.filter(
        (item) =>
          item.employee_code
            ?.toLowerCase()
            .includes(keyword) ||
          item.full_name_th
            ?.toLowerCase()
            .includes(keyword) ||
          item.branch_name
            ?.toLowerCase()
            .includes(keyword) ||
          item.department_name
            ?.toLowerCase()
            .includes(keyword) ||
          item.division_name
            ?.toLowerCase()
            .includes(keyword) ||

          item.unit_name
            ?.toLowerCase()
            .includes(keyword) ||

          item.position_name
            ?.toLowerCase()
            .includes(keyword) ||

          item.phone
            ?.toLowerCase()
            .includes(keyword) ||

          item.email
            ?.toLowerCase()
            .includes(keyword) ||

          item.line_id
            ?.toLowerCase()
            .includes(keyword) ||

          item.employment_type
            ?.toLowerCase()
            .includes(keyword)
      );
    }

    if (filters.employeeStatus) {
      rows = rows.filter(
        (item) =>
          item.employee_status_code ===
          filters.employeeStatus
      );
    }

    if (filters.branch) {
      rows = rows.filter(
        (item) =>
          item.branch_name === filters.branch
      );
    }

    if (filters.department) {
      rows = rows.filter(
        (item) =>
          item.department_name ===
          filters.department
      );
    }

    if (filters.division) {
      rows = rows.filter(
        (item) =>
          item.division_name ===
          filters.division
      );
    }

    if (filters.unit) {
      rows = rows.filter(
        (item) =>
          item.unit_name === filters.unit
      );
    }

    if (filters.employmentType) {
      rows = rows.filter(
        (item) =>
          item.employment_type ===
          filters.employmentType
      );
    }

    if (filters.gender) {
      rows = rows.filter(
        (item) =>
          item.gender === filters.gender
      );
    }

    if (filters.nationality) {
      rows = rows.filter(
        (item) =>
          item.nationality ===
          filters.nationality
      );
    }

    if (filters.positionLevel) {
      rows = rows.filter(
        (item) =>
          item.position_level ===
          filters.positionLevel
      );
    }

    // Filter วันที่เริ่มงาน
    if (filters.hireDateFrom) {
      rows = rows.filter(
        (item) =>
          item.hire_date &&
          item.hire_date >=
            filters.hireDateFrom
      );
    }

    if (filters.hireDateTo) {
      rows = rows.filter(
        (item) =>
          item.hire_date &&
          item.hire_date <=
            filters.hireDateTo
      );
    }

    // Filter วันที่ลาออก
    if (filters.resignationDateFrom) {
      rows = rows.filter(
        (item) =>
          item.resignation_date &&
          item.resignation_date >=
            filters.resignationDateFrom
      );
    }

    if (filters.resignationDateTo) {
      rows = rows.filter(
        (item) =>
          item.resignation_date &&
          item.resignation_date <=
            filters.resignationDateTo
      );
    }
        
    return rows;
  }, [employees, filters]);

  const handleExport = () => {
    window.location.href ="/api/admin/employee-reports/export";
  };

  const cards = [
    {
      title: "พนักงานทั้งหมด",
      value: summary.totalEmployees,
      icon: <TeamOutlined />,
      color: "bg-blue-500",
    },
    {
      title: "พนักงานปัจจุบัน",
      value: summary.activeEmployees,
      icon: <SafetyOutlined />,
      color: "bg-green-500",
    },
    {
      title: "ทดลองงาน",
      value: summary.probationEmployees,
      icon: <SafetyOutlined />,
      color: "bg-yellow-500",
    },
    {
      title: "ลาออก",
      value: summary.resignedEmployees,
      icon: <UserDeleteOutlined />,
      color: "bg-red-500",
    },
    {
      title: "เกษียณ",
      value: summary.retiredEmployees,
      icon: <TeamOutlined />,
      color: "bg-slate-500",
    },
    {
      title: "พักงาน",
      value: summary.suspendedEmployees,
      icon: <TeamOutlined />,
      color: "bg-orange-500",
    },
    {
      title: "เข้าใหม่เดือนนี้",
      value: summary.newThisMonth,
      icon: <UserAddOutlined />,
      color: "bg-cyan-500",
    },
    {
      title: "ลาออกเดือนนี้",
      value: summary.resignedThisMonth,
      icon: <UserDeleteOutlined />,
      color: "bg-rose-500",
    },
    {
      title: "เข้าใหม่ปีนี้",
      value: summary.newThisYear,
      icon: <UserAddOutlined />,
      color: "bg-indigo-500",
    },
    {
      title: "ลาออกปีนี้",
      value: summary.resignedThisYear,
      icon: <UserDeleteOutlined />,
      color: "bg-pink-500",
    },
    {
      title: "Turnover %",
      value: `${summary.turnoverRate || 0}%`,
      icon: <SafetyOutlined />,
      color: "bg-purple-500",
    },
  ];

  const branchOptions = [
    ...new Set(
      employees
        .map((x) => x.branch_name)
        .filter(Boolean)
    ),
  ];

  const departmentOptions = [
    ...new Set(
      employees
        .map((x) => x.department_name)
        .filter(Boolean)
    ),
  ];

  const divisionOptions = [
    ...new Set(
      employees
        .map((x) => x.division_name)
        .filter(Boolean)
    ),
  ];

  const unitOptions = [
    ...new Set(
      employees
        .map((x) => x.unit_name)
        .filter(Boolean)
    ),
  ];

  const employmentTypeOptions = [
    ...new Set(
      employees
        .map((x) => x.employment_type)
        .filter(Boolean)
    ),
  ];

  const nationalityOptions = [
    ...new Set(
      employees
        .map((x) => x.nationality)
        .filter(Boolean)
    ),
  ];

  const positionLevelOptions = [
    ...new Set(
      employees
        .map((x) => x.position_level)
        .filter(Boolean)
    ),
  ];

  const genderOptions = [
    ...new Set(
      employees
        .map((x) => x.gender)
        .filter(Boolean)
    ),
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              รายงานพนักงาน
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Employee Master Reports
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <DownloadOutlined />
              Export Excel
            </button>

            <button
              onClick={() =>
                setFilters({
                  search: "",
                  employeeStatus: "",
                  branch: "",
                  department: "",
                  division: "",
                  unit: "",
                  employmentType: "",
                  hireDateFrom: "",
                  hireDateTo: "",
                  resignationDateFrom: "",
                  resignationDateTo: "",
                })
              }
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm hover:bg-slate-50"
            >
              ล้างตัวกรอง
            </button>
          </div>

        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">
                  {card.title}
                </div>

                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? "-" : card.value}
                </div>
              </div>

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl text-white ${card.color}`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative">
            <SearchOutlined className="absolute left-4 top-4 text-slate-400" />

            <input
              type="text"
              placeholder="ค้นหารหัสพนักงาน / ชื่อ"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4"
            />
          </div>

          <select
            value={filters.employeeStatus}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                employeeStatus: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              ทุกสถานะ
            </option>

            <option value="ACTIVE">
              พนักงานปัจจุบัน
            </option>

            <option value="PROBATION">
              ทดลองงาน
            </option>

            <option value="RESIGNED">
              ลาออก
            </option>

            <option value="RETIRED">
              เกษียณ
            </option>

            <option value="SUSPENDED">
              พักงาน
            </option>
          </select>

          <select
            value={filters.branch}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                branch: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              ทุกสาขา
            </option>

            {branchOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>


          <select
            value={filters.department}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                department: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              ทุกแผนก
            </option>

            {departmentOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>


          <select
            value={filters.division}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                division: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              ทุกฝ่าย
            </option>

            {divisionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>


          <select
            value={filters.unit}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                unit: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              ทุกหน่วยงาน
            </option>

            {unitOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>


          <select
            value={filters.employmentType}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                employmentType: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">
              ทุกประเภทการจ้าง
            </option>

            {employmentTypeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>


          <select
            value={filters.gender}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                gender: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">ทุกเพศ</option>

            {genderOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>


          <select
            value={filters.nationality}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                nationality: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">ทุกสัญชาติ</option>

            {nationalityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>


          <select
            value={filters.positionLevel}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                positionLevel: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">ทุก Level</option>

            {positionLevelOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>


          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              วันที่เริ่มงาน (จาก)
            </label>

            <input
              type="date"
              value={filters.hireDateFrom}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  hireDateFrom: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              วันที่เริ่มงาน (ถึง)
            </label>

            <input
              type="date"
              value={filters.hireDateTo}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  hireDateTo: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              วันที่ลาออก (จาก)
            </label>

            <input
              type="date"
              value={filters.resignationDateFrom}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  resignationDateFrom: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              วันที่ลาออก (ถึง)
            </label>

            <input
              type="date"
              value={filters.resignationDateTo}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  resignationDateTo: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>
          
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-4 text-left">
                  รหัสพนักงาน
                </th>
                <th className="px-4 py-4 text-left">
                  ชื่อ
                </th>
                <th className="px-4 py-4 text-left">
                  สาขา
                </th>
                <th className="px-4 py-4 text-left">
                  แผนก
                </th>
                <th className="px-4 py-4 text-left">
                  ตำแหน่ง
                </th>
                <th className="px-4 py-4 text-left">
                  สถานะ
                </th>
                <th className="px-4 py-4 text-left">
                  วันเริ่มงาน
                </th>
                <th className="px-4 py-4 text-left">
                  วันที่ลาออก
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((item) => (
                <tr
                  key={item.id}
                  className="border-t"
                >
                  <td className="px-4 py-4">
                    {item.employee_code}
                  </td>

                  <td className="px-4 py-4">
                    {item.full_name_th}
                  </td>

                  <td className="px-4 py-4">
                    {item.branch_name}
                  </td>

                  <td className="px-4 py-4">
                    {item.department_name}
                  </td>

                  <td className="px-4 py-4">
                    {item.position_name}
                  </td>

                  <td className="px-4 py-4">
                    {item.employee_status_name}
                  </td>

                  <td className="px-4 py-4">
                    {item.hire_date}
                  </td>

                  <td className="px-4 py-4">
                    {item.resignation_date || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}