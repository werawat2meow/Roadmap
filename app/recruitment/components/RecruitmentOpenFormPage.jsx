"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import LoadingOrb from "@/app/components/LoadingOrb";

function SearchableSelect({
  label,
  placeholder = "พิมพ์เพื่อค้นหา...",
  value,
  options,
  loading,
  disabled,
  onChange,
  onSearch,
  hint,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((item) => item.id === value) ?? null,
    [options, value]
  );

  useEffect(() => {
    onSearch(query);
  }, [query, onSearch]);

  useEffect(() => {
    if (selected) {
      setQuery(selected.label);
    } else if (value === null) {
      setQuery("");
    }
  }, [selected, value]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="relative">
        <input
          type="text"
          value={open ? query : selected?.label ?? query}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            onChange(null);
          }}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
        />

        {open ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="max-h-64 overflow-auto">
              {loading ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  กำลังโหลดข้อมูล...
                </div>
              ) : options.length ? (
                options.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(item.id);
                      setQuery(item.label);
                      setOpen(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 ${
                      item.id === value
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    <div className="font-medium">{item.label}</div>
                    {item.meta?.subtitle ? (
                      <div className="text-xs text-gray-500">
                        {String(item.meta.subtitle)}
                      </div>
                    ) : null}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  ไม่พบข้อมูล
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export default function RecruitmentOpenFormPage({
  mode = "create",
  initialData = null,
}){

  const [pageLoading, setPageLoading] = useState(
    mode === "edit" && !initialData
  );
  useEffect(() => {
    if (!initialData) return;

    setBranchId(initialData.branch_id);
    setDepartmentId(initialData.department_id);
    setDivisionId(initialData.division_id);
    setUnitId(initialData.unit_id);
    setPositionId(initialData.position_id);

    setOpeningCount(initialData.opening_count || 1);

    setStartDate(
      initialData.start_date
        ? initialData.start_date.substring(0, 10)
        : ""
    );

    setEndDate(
      initialData.end_date
        ? initialData.end_date.substring(0, 10)
        : ""
    );

    setUrgent(initialData.urgent || false);

    setPageLoading(false);
  }, [initialData]);


  const router = useRouter();
  const [branchId, setBranchId] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [divisionId, setDivisionId] = useState(null);
  const [unitId, setUnitId] = useState(null);
  const [positionId, setPositionId] = useState(null);

  const [branchTerm, setBranchTerm] = useState("");
  const [departmentTerm, setDepartmentTerm] = useState("");
  const [divisionTerm, setDivisionTerm] = useState("");
  const [unitTerm, setUnitTerm] = useState("");
  const [positionTerm, setPositionTerm] = useState("");

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);

  const [loading, setLoading] = useState({
    branches: false,
    departments: false,
    divisions: false,
    units: false,
    positions: false,
  });

  const [headcountTarget, setHeadcountTarget] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [openingCount, setOpeningCount] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const remaining = Math.max(headcountTarget - employeeCount, 0);
  const exceedsLimit = openingCount > remaining;

  useEffect(() => {
    setLoading((s) => ({ ...s, branches: true }));
    fetchJSON(`/recruitment/api/job_openings/branches?status=active&q=${encodeURIComponent(branchTerm)}`)
      .then(setBranches)
      .catch(() => setBranches([]))
      .finally(() => setLoading((s) => ({ ...s, branches: false })));
  }, [branchTerm]);

  useEffect(() => {
    if (!branchId) {
      setDepartments([]);
      setDepartmentId(null);
      setDivisionId(null);
      setUnitId(null);
      setPositionId(null);
      return;
    }

    setLoading((s) => ({ ...s, departments: true }));
    fetchJSON(
      `/recruitment/api/job_openings/departments?branch_id=${branchId}&status=active&q=${encodeURIComponent(
        departmentTerm
      )}`
    )
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setLoading((s) => ({ ...s, departments: false })));
  }, [branchId, departmentTerm]);

  useEffect(() => {
    if (!departmentId) {
      setDivisions([]);
      setDivisionId(null);
      setUnitId(null);
      setPositionId(null);
      return;
    }

    setLoading((s) => ({ ...s, divisions: true }));
    fetchJSON(
      `/recruitment/api/job_openings/divisions?department_id=${departmentId}&status=active&q=${encodeURIComponent(
        divisionTerm
      )}`
    )
      .then(setDivisions)
      .catch(() => setDivisions([]))
      .finally(() => setLoading((s) => ({ ...s, divisions: false })));
  }, [departmentId, divisionTerm]);

  useEffect(() => {
    if (!divisionId) {
      setUnits([]);
      setUnitId(null);
      setPositionId(null);
      return;
    }

    setLoading((s) => ({ ...s, units: true }));
    fetchJSON(
      `/recruitment/api/job_openings/units?division_id=${divisionId}&status=active&q=${encodeURIComponent(
        unitTerm
      )}`
    )
      .then(setUnits)
      .catch(() => setUnits([]))
      .finally(() => setLoading((s) => ({ ...s, units: false })));
  }, [divisionId, unitTerm]);

  useEffect(() => {
    if (!unitId) {
      setPositions([]);
      setPositionId(null);
      return;
    }

    setLoading((s) => ({ ...s, positions: true }));
    fetchJSON(
      `/recruitment/api/job_openings/positions?unit_id=${unitId}&status=active&q=${encodeURIComponent(
        positionTerm
      )}`
    )
      .then(setPositions)
      .catch(() => setPositions([]))
      .finally(() => setLoading((s) => ({ ...s, positions: false })));
  }, [unitId, positionTerm]);

  useEffect(() => {
    if (!positionId) {
      setHeadcountTarget(0);
      setEmployeeCount(0);
      return;
    }

    fetchJSON(`/recruitment/api/job_openings/position-capacity?position_id=${positionId}`)
      .then((data) => {
        setHeadcountTarget(data.headcount_target ?? 0);
        setEmployeeCount(data.employee_count ?? 0);
      })
      .catch(() => {
        setHeadcountTarget(0);
        setEmployeeCount(0);
      });
  }, [positionId]);

  const canSubmit = Boolean(
    branchId &&
      departmentId &&
      divisionId &&
      unitId &&
      positionId &&
      startDate &&
      endDate &&
      !exceedsLimit &&
      openingCount > 0 &&
      openingCount <= remaining
  );

  async function handleSubmit(e) {
    e.preventDefault();

    setError(null);
    setMessage(null);

    if (!canSubmit) {
      setError(
        "กรุณากรอกข้อมูลให้ครบ และตรวจสอบจำนวนเปิดรับไม่เกินจำนวนที่รับได้"
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        branch_id: branchId,
        department_id: departmentId,
        division_id: divisionId,
        unit_id: unitId,
        position_id: positionId,
        opening_count: openingCount,
        start_date: startDate,
        end_date: endDate,
        urgent,
      };

      const endpoint =
        mode === "edit"
          ? `/recruitment/api/job_openings/${initialData.id}`
          : "/recruitment/api/job_openings";

      const method =
        mode === "edit"
          ? "PUT"
          : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "บันทึกไม่สำเร็จ"
        );
      }

      router.push("/recruitment/setting/job_openings");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาด"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <LoadingOrb />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === "edit"
                ? "แก้ไขข้อมูลการเปิดรับสมัครพนักงาน"
                : "บันทึกข้อมูลการเปิดรับสมัครพนักงาน"}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <SearchableSelect
              label="1) Branch"
              value={branchId}
              options={branches.map((item) => ({
                ...item,
              }))}
              loading={loading.branches}
              onChange={(id) => {
                setBranchId(id);
                setDepartmentId(null);
                setDivisionId(null);
                setUnitId(null);
                setPositionId(null);
                setDepartments([]);
                setDivisions([]);
                setUnits([]);
                setPositions([]);
              }}
              onSearch={setBranchTerm}
            />

            <SearchableSelect
              label="2) Department"
              value={departmentId}
              options={departments.map((item) => ({
                ...item,
              }))}
              loading={loading.departments}
              disabled={!branchId}
              onChange={(id) => {
                setDepartmentId(id);
                setDivisionId(null);
                setUnitId(null);
                setPositionId(null);
                setDivisions([]);
                setUnits([]);
                setPositions([]);
              }}
              onSearch={setDepartmentTerm}
            />

            <SearchableSelect
              label="3) Division"
              value={divisionId}
              options={divisions.map((item) => ({
                ...item,
              }))}
              loading={loading.divisions}
              disabled={!departmentId}
              onChange={(id) => {
                setDivisionId(id);
                setUnitId(null);
                setPositionId(null);
                setUnits([]);
                setPositions([]);
              }}
              onSearch={setDivisionTerm}
            />

            <SearchableSelect
              label="4) Unit"
              value={unitId}
              options={units.map((item) => ({
                ...item,
              }))}
              loading={loading.units}
              disabled={!divisionId}
              onChange={(id) => {
                setUnitId(id);
                setPositionId(null);
                setPositions([]);
              }}
              onSearch={setUnitTerm}
            />

            <SearchableSelect
              label="5) Position"
              value={positionId}
              options={positions.map((item) => ({
                ...item,
              }))}
              loading={loading.positions}
              disabled={!unitId}
              onChange={setPositionId}
              onSearch={setPositionTerm}
            />

            <div className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-medium text-gray-700">
                6) จำนวนเปิดรับได้คือ {remaining}
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  จำนวนที่จะเปิด
                </label>
                <input
                  type="number"
                  min={1}
                  max={remaining || 1}
                  value={openingCount}
                  onChange={(e) =>
                    setOpeningCount(Number(e.target.value) || 0)
                  }
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${
                    exceedsLimit
                      ? "border-red-400 ring-2 ring-red-100"
                      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                {exceedsLimit ? (
                  <p className="mt-1 text-xs text-red-600">
                    จำนวนเปิดรับมากกว่าคงเหลือที่รับได้
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    ห้ามมากกว่าจำนวนคงเหลือ( {remaining} )ที่รับได้
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                7) วันที่เริ่มเปิดรับ
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                วันที่ปิดรับ
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">ด่วนหรือไม่ด่วน</span>
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">

            <div>
              <button
                type="button"
                onClick={() => router.push("/recruitment/setting/job_openings")}
                className="rounded-lg px-4 py-2 text-white font-medium shadow-smtransition-colors cursor-pointer"
                style={{ backgroundColor: "orange" , color:"black" }}
              >
                ย้อนกลับ
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="reset"
                onClick={() => {
                  setBranchId(null);
                  setDepartmentId(null);
                  setDivisionId(null);
                  setUnitId(null);
                  setPositionId(null);
                  setOpeningCount(1);
                  setStartDate("");
                  setEndDate("");
                  setUrgent(false);
                  setMessage(null);
                  setError(null);
                }}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ล้างค่า
              </button>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {
                  submitting
                  ? "กำลังบันทึก..."
                  : mode === "edit"
                  ? "อัปเดตข้อมูล"
                  : "บันทึกข้อมูล"
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}