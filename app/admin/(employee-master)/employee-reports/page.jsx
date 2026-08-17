"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {TeamOutlined,UserAddOutlined,UserDeleteOutlined,SafetyOutlined,DownloadOutlined,SearchOutlined,} from "@ant-design/icons";
import { Spin } from 'antd';
import LoadingOrb from "../../../components/LoadingOrb";
import useScopedPermissions from "@/hooks/useScopedPermissions";
import { hasPermission } from "@/lib/permissions";
import { useRouter } from "next/navigation";

const DEFAULT_FILTERS = {
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
};

export default function EmployeeReportsPage() {
  const router = useRouter();
  const {user, loadingUser:authLoading,canView,} = useScopedPermissions("ems.employee_reports",{scopeType:"employee",});
  const canExportreport = hasPermission(user, "ems.employee_reports.export");
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false); // loading เฉพาะตอน filter/เปลี่ยนหน้า (ไม่ทำให้ทั้งหน้า flash)
  const isFirstRender = useRef(true);
  const reqIdRef = useRef(0); // ป้องกัน race condition / response ที่มาช้ากว่าเขียนทับของใหม่

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
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);


  const buildQueryString = (currentFilters, currentPagination) => {
    const params = new URLSearchParams();

    params.set("page", String(currentPagination.page));
    params.set("pageSize", String(currentPagination.pageSize));

    if (currentFilters.search) {
      params.set("search", currentFilters.search);
    }

    if (currentFilters.employeeStatus) {
      params.set("status", currentFilters.employeeStatus);
    }

    if (currentFilters.branch) {
      params.set("branch_id", currentFilters.branch);
    }

    if (currentFilters.department) {
      params.set("department_id", currentFilters.department);
    }

    if (currentFilters.division) {
      params.set("division_id", currentFilters.division);
    }

    if (currentFilters.unit) {
      params.set("unit_id", currentFilters.unit);
    }

    if (currentFilters.employmentType) {
      params.set("employment_type", currentFilters.employmentType);
    }

    if (currentFilters.gender) {
      params.set("gender", currentFilters.gender);
    }

    if (currentFilters.nationality) {
      params.set("nationality", currentFilters.nationality);
    }

    if (currentFilters.positionLevel) {
      params.set("position_level", currentFilters.positionLevel);
    }

    if (currentFilters.hireDateFrom) {
      params.set("start_work_date_from", currentFilters.hireDateFrom);
    }

    if (currentFilters.hireDateTo) {
      params.set("start_work_date_to", currentFilters.hireDateTo);
    }

    if (currentFilters.resignationDateFrom) {
      params.set("resignation_date_from", currentFilters.resignationDateFrom);
    }

    if (currentFilters.resignationDateTo) {
      params.set("resignation_date_to", currentFilters.resignationDateTo);
    }

    return params.toString();
  };

  const loadData = async (currentFilters, currentPagination) => {
    // เก็บ id ของ request นี้ไว้ เทียบกับตัวล่าสุดตอน response กลับมา
    const reqId = ++reqIdRef.current;

    try {
      if (isFirstRender.current) {
        setLoading(true);
      } else {
        setFiltering(true);
      }

      const queryString = buildQueryString(currentFilters, currentPagination);
      const res = await fetch(`/api/admin/employee-reports?${queryString}`, {
        cache: "no-store",
      });
      const result = await res.json();

      // ถ้ามี request ใหม่กว่ายิงไปแล้ว ผลลัพธ์รอบนี้ถือว่าล้าสมัย ไม่เอามาเขียนทับ
      if (reqId !== reqIdRef.current) return;

      if (!res.ok) {
        throw new Error(result?.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setSummary(result.summary || {});
      setEmployees(result.employees || []);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      if (reqId === reqIdRef.current) {
        setLoading(false);
        setFiltering(false);
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    // รวมการ reset page ไว้ใน setState callback เดียวกัน ลดจังหวะ re-render/effect ซ้อนกัน
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  // ยิง fetch ครั้งเดียวตอน mount (ไม่ใช่ effect แยกสองรอบจาก StrictMode/double state update)
  useEffect(() => {
    loadData(filters, pagination);
    isFirstRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce สำหรับ filter / เปลี่ยนหน้า / เปลี่ยน pageSize (ไม่รวม mount ครั้งแรก)
  useEffect(() => {
    if (isFirstRender.current) return;

    const timer = setTimeout(() => {
      loadData(filters, pagination);
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page, pagination.pageSize]);

  const filteredEmployees = useMemo(() => {
    let rows = [...employees];

    if (filters.search) {
      const keyword = filters.search.toLowerCase();

      rows = rows.filter(
        (item) =>
          item.employee_code?.toLowerCase().includes(keyword) ||
          item.full_name_th?.toLowerCase().includes(keyword) ||
          item.branch_name?.toLowerCase().includes(keyword) ||
          item.department_name?.toLowerCase().includes(keyword) ||
          item.division_name?.toLowerCase().includes(keyword) ||
          item.unit_name?.toLowerCase().includes(keyword) ||
          item.position_name?.toLowerCase().includes(keyword) ||
          item.phone?.toLowerCase().includes(keyword) ||
          item.email?.toLowerCase().includes(keyword) ||
          item.line_id?.toLowerCase().includes(keyword) ||
          item.employment_type?.toLowerCase().includes(keyword)
      );
    }

    if (filters.employeeStatus) {
      rows = rows.filter(
        (item) => item.employee_status_code === filters.employeeStatus
      );
    }

    if (filters.branch) {
      rows = rows.filter((item) => item.branch_name === filters.branch);
    }

    if (filters.department) {
      rows = rows.filter(
        (item) => item.department_name === filters.department
      );
    }

    if (filters.division) {
      rows = rows.filter((item) => item.division_name === filters.division);
    }

    if (filters.unit) {
      rows = rows.filter((item) => item.unit_name === filters.unit);
    }

    if (filters.employmentType) {
      rows = rows.filter(
        (item) => item.employment_type === filters.employmentType
      );
    }

    if (filters.gender) {
      rows = rows.filter((item) => item.gender === filters.gender);
    }

    if (filters.nationality) {
      rows = rows.filter(
        (item) => item.nationality === filters.nationality
      );
    }

    if (filters.positionLevel) {
      rows = rows.filter(
        (item) => item.position_level === filters.positionLevel
      );
    }

    // Filter วันที่เริ่มงาน
    if (filters.hireDateFrom) {
      rows = rows.filter(
        (item) => (item.start_work_date || item.hire_date) &&
          (item.start_work_date || item.hire_date) >= filters.hireDateFrom
      );
    }

    if (filters.hireDateTo) {
      rows = rows.filter(
        (item) => (item.start_work_date || item.hire_date) &&
          (item.start_work_date || item.hire_date) <= filters.hireDateTo
      );
    }

    // Filter วันที่ลาออก
    if (filters.resignationDateFrom) {
      rows = rows.filter(
        (item) =>
          item.resignation_date &&
          item.resignation_date >= filters.resignationDateFrom
      );
    }

    if (filters.resignationDateTo) {
      rows = rows.filter(
        (item) =>
          item.resignation_date &&
          item.resignation_date <= filters.resignationDateTo
      );
    }

    return rows;
  }, [employees, filters]);

  const handleExport = () => {
    const queryString = buildQueryString(filters, pagination);
    window.location.href = `/api/admin/employee-reports/export?${queryString}`;
  };

  const computedSummary = useMemo(() => {
    const total = filteredEmployees.length;
    const countByStatus = (code) =>
      filteredEmployees.filter((x) => x.employee_status_code === code).length;
    const resigned = countByStatus("RESIGNED");

    return {
      totalEmployees: total,
      activeEmployees: countByStatus("ACTIVE"),
      probationEmployees: countByStatus("PROBATION"),
      resignedEmployees: resigned,
      retiredEmployees: countByStatus("RETIRED"),
      suspendedEmployees: countByStatus("SUSPENDED"),
      newThisMonth: filteredEmployees.filter((x) =>
        (x.start_work_date || x.hire_date)?.startsWith(
          new Date().toISOString().slice(0, 7)
        )
      ).length,
      resignedThisMonth: filteredEmployees.filter((x) =>
        x.resignation_date?.startsWith(new Date().toISOString().slice(0, 7))
      ).length,
      newThisYear: filteredEmployees.filter((x) =>
        (x.start_work_date || x.hire_date)?.startsWith(
          String(new Date().getFullYear())
        )
      ).length,
      resignedThisYear: filteredEmployees.filter((x) =>
        x.resignation_date?.startsWith(String(new Date().getFullYear()))
      ).length,
      turnoverRate: total > 0 ? ((resigned / total) * 100).toFixed(2) : "0.00",
    };
  }, [filteredEmployees]);

  const cards = [
    {
      title: "พนักงานทั้งหมด",
      value: computedSummary.totalEmployees,
      icon: <TeamOutlined />,
      color: "bg-blue-500",
    },
    {
      title: "พนักงานปัจจุบัน",
      value: computedSummary.activeEmployees,
      icon: <SafetyOutlined />,
      color: "bg-green-500",
    },
    {
      title: "ทดลองงาน",
      value: computedSummary.probationEmployees,
      icon: <SafetyOutlined />,
      color: "bg-yellow-500",
    },
    {
      title: "ลาออก",
      value: computedSummary.resignedEmployees,
      icon: <UserDeleteOutlined />,
      color: "bg-red-500",
    },
    {
      title: "เกษียณ",
      value: computedSummary.retiredEmployees,
      icon: <TeamOutlined />,
      color: "bg-slate-500",
    },
    {
      title: "พักงาน",
      value: computedSummary.suspendedEmployees,
      icon: <TeamOutlined />,
      color: "bg-orange-500",
    },
    {
      title: "เข้าใหม่เดือนนี้",
      value: computedSummary.newThisMonth,
      icon: <UserAddOutlined />,
      color: "bg-cyan-500",
    },
    {
      title: "ลาออกเดือนนี้",
      value: computedSummary.resignedThisMonth,
      icon: <UserDeleteOutlined />,
      color: "bg-rose-500",
    },
    {
      title: "เข้าใหม่ปีนี้",
      value: computedSummary.newThisYear,
      icon: <UserAddOutlined />,
      color: "bg-indigo-500",
    },
    {
      title: "ลาออกปีนี้",
      value: computedSummary.resignedThisYear,
      icon: <UserDeleteOutlined />,
      color: "bg-pink-500",
    },
    {
      title: "Turnover %",
      value: `${computedSummary.turnoverRate || 0}%`,
      icon: <SafetyOutlined />,
      color: "bg-purple-500",
    },
  ];

  const branchOptions = [
    ...new Set(employees.map((x) => x.branch_name).filter(Boolean)),
  ];

  const departmentOptions = [
    ...new Set(employees.map((x) => x.department_name).filter(Boolean)),
  ];

  const divisionOptions = [
    ...new Set(employees.map((x) => x.division_name).filter(Boolean)),
  ];

  const unitOptions = [
    ...new Set(employees.map((x) => x.unit_name).filter(Boolean)),
  ];

  const employmentTypeOptions = [
    ...new Set(employees.map((x) => x.employment_type).filter(Boolean)),
  ];

  const nationalityOptions = [
    ...new Set(employees.map((x) => x.nationality).filter(Boolean)),
  ];

  const positionLevelOptions = [
    ...new Set(employees.map((x) => x.position_level).filter(Boolean)),
  ];

  const genderOptions = [
    ...new Set(employees.map((x) => x.gender).filter(Boolean)),
  ];

  const getNationalityLabel = (value) => {
    switch (value?.toLowerCase()) {
      case "thai":
        return "ไทย";

      case "myanmar":
        return "เมียนมา";

      case "non_b":
        return "ต่างชาติ (Non-B)";

      default:
        return value;
    }
  };

  if (authLoading) return <LoadingOrb />;
  if (!user) return null;
  if (!canView) return null;

  // loading รวม: true ตอนโหลดครั้งแรกหรือตอนกำลัง filter/เปลี่ยนหน้า
  const isBusy = loading || filtering;

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
            {canExportreport && (
              <>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <DownloadOutlined />
                  Export Excel
                </button>

                <button
                  onClick={handleResetFilters}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm hover:bg-slate-50"
                >
                  ล้างตัวกรอง
                </button>
              </>
            )}
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
                <div className="text-sm text-slate-500">{card.title}</div>

                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {isBusy ? "-" : card.value}
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
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4"
            />
          </div>

          <select
            value={filters.employeeStatus}
            onChange={(e) =>
              handleFilterChange("employeeStatus", e.target.value)
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">ทุกสถานะ</option>
            <option value="ACTIVE">พนักงานปัจจุบัน</option>
            <option value="PROBATION">ทดลองงาน</option>
            <option value="RESIGNED">ลาออก</option>
            <option value="RETIRED">เกษียณ</option>
            <option value="SUSPENDED">พักงาน</option>
          </select>

          <select
            value={filters.branch}
            onChange={(e) => handleFilterChange("branch", e.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">ทุกสาขา</option>
            {branchOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={filters.department}
            onChange={(e) =>
              handleFilterChange("department", e.target.value)
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">ทุกแผนก</option>
            {departmentOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={filters.division}
            onChange={(e) => handleFilterChange("division", e.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">ทุกฝ่าย</option>
            {divisionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={filters.unit}
            onChange={(e) => handleFilterChange("unit", e.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">ทุกหน่วยงาน</option>
            {unitOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={filters.employmentType}
            onChange={(e) =>
              handleFilterChange("employmentType", e.target.value)
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">ทุกประเภทการจ้าง</option>
            {employmentTypeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={filters.gender}
            onChange={(e) => handleFilterChange("gender", e.target.value)}
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
              handleFilterChange("nationality", e.target.value)
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="">ทุกสัญชาติ</option>
            {nationalityOptions.map((item) => (
              <option key={item} value={item}>
                {getNationalityLabel(item)}
              </option>
            ))}
          </select>

          <select
            value={filters.positionLevel}
            onChange={(e) =>
              handleFilterChange("positionLevel", e.target.value)
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
                handleFilterChange("hireDateFrom", e.target.value)
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
                handleFilterChange("hireDateTo", e.target.value)
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
                handleFilterChange("resignationDateFrom", e.target.value)
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
                handleFilterChange("resignationDateTo", e.target.value)
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>
        </div>
      </div>

      {/* ต้องมี relative ที่ wrapper เพื่อให้ overlay ลอยซ้อนตรงตำแหน่งตารางพอดี */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isBusy && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <Spin size="large" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-4 text-left">รหัสพนักงาน</th>
                <th className="px-4 py-4 text-left">ชื่อ</th>
                <th className="px-4 py-4 text-left">สาขา</th>
                <th className="px-4 py-4 text-left">แผนก</th>
                <th className="px-4 py-4 text-left">ตำแหน่ง</th>
                <th className="px-4 py-4 text-left">สถานะ</th>
                <th className="px-4 py-4 text-left">วันเริ่มงาน</th>
                <th className="px-4 py-4 text-left">วันที่ลาออก</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-4">{item.employee_code}</td>
                  <td className="px-4 py-4">{item.full_name_th}</td>
                  <td className="px-4 py-4">{item.branch_name}</td>
                  <td className="px-4 py-4">{item.department_name}</td>
                  <td className="px-4 py-4">{item.position_name}</td>
                  <td className="px-4 py-4">{item.employee_status_name}</td>
                  <td className="px-4 py-4">
                    {item.start_work_date || item.hire_date || "-"}
                  </td>
                  <td className="px-4 py-4">
                    {item.resignation_date || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <div className="text-sm text-slate-500">
              ทั้งหมด {pagination.total} รายการ | หน้า {pagination.page} /{" "}
              {pagination.totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1 || isBusy}
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(prev.page - 1, 1),
                  }))
                }
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
              >
                ก่อนหน้า
              </button>

              <button
                disabled={pagination.page >= pagination.totalPages || isBusy}
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.page + 1, prev.totalPages),
                  }))
                }
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}