"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TeamOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  SafetyOutlined,
  DownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

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
  });

  const [employees, setEmployees] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    employeeStatus: "",
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

    return rows;
  }, [employees, filters]);

  const handleExport = () => {
    window.open(
      "/api/admin/employee-reports/export",
      "_blank"
    );
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

          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <DownloadOutlined />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        <div className="grid gap-4 md:grid-cols-3">
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