"use client";

import { Modal, Select } from "antd";
import {
  ApartmentOutlined,
  CloseOutlined,
  SaveOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

import EmployeeSummaryCard from "./EmployeeSummaryCard";
import ManagementScopeEditor from "./ManagementScopeEditor";
import SupervisorSelect from "./SupervisorSelect";
import AssignmentSettings from "./AssignmentSettings";

import {
  MANAGEMENT_LEVELS,
  SUPERVISOR_LEVEL_BY_LEVEL,
  getEmployeeName,
  getEmployeePositionName,
  resolveEmployeeManagementLevel,
} from "../utils/scopeUtils";

/* =========================================================
   Helper
========================================================= */

function buildEmployeeOption(employee) {
  const employeeName =
    employee?.resolved_employee_name ||
    getEmployeeName(employee);

  const employeeCode =
    employee?.employee_code || "-";

  const positionName =
    employee?.resolved_position_name ||
    getEmployeePositionName(employee);

  const managementLevel =
    employee?.resolved_management_level ||
    resolveEmployeeManagementLevel(employee);

  return {
    value: employee?.id,

    label: [
      employeeCode,
      employeeName,
      positionName,
    ]
      .filter(Boolean)
      .join(" | "),

    employee,

    employeeName,

    employeeCode,

    positionName,

    managementLevel,
  };
}

function filterEmployeeOption(
  input,
  option
) {
  const keyword = String(input || "")
    .trim()
    .toLowerCase();

  if (!keyword) {
    return true;
  }

  const searchText = [
    option?.label,
    option?.employeeCode,
    option?.employeeName,
    option?.positionName,
    option?.managementLevel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchText.includes(keyword);
}

/* =========================================================
   ManagementAssignmentModal
========================================================= */

export default function ManagementAssignmentModal({
  open = false,

  mode = "create",

  loading = false,

  saving = false,

  loadingEmployees = false,

  loadingScopeOptions = false,

  form,

  selectedEmployee,

  employees = [],

  supervisorOptions = [],

  scopeOptions,

  onClose,

  onSubmit,

  onFormChange,

  onEmployeeChange,

  onManagementLevelChange,

  onAddScope,

  onRemoveScope,

  onUpdateScope,

  onSetPrimaryScope,
}) {
  const safeForm = {
    employee_id: "",
    management_level: "",
    scopes: [],
    supervisor_employee_id: "",
    is_primary: true,
    status: "active",
    sort_order: 0,
    ...form,
  };

  const isEditMode =
    mode === "edit";

  const modalTitle =
    isEditMode
      ? "แก้ไขสายบังคับบัญชา"
      : "เพิ่มสายบังคับบัญชา";

  const requiredSupervisorLevel =
    SUPERVISOR_LEVEL_BY_LEVEL[
      safeForm.management_level
    ] || "";

  const employeeOptions = employees
    .filter((employee) => employee?.id)
    .map(buildEmployeeOption);

  const handleChange = (
    field,
    value
  ) => {
    if (
      typeof onFormChange !==
      "function"
    ) {
      return;
    }

    onFormChange(field, value);
  };

  const handleEmployeeSelect = (
    employeeId
  ) => {
    if (
      typeof onEmployeeChange ===
      "function"
    ) {
      onEmployeeChange(
        employeeId || ""
      );

      return;
    }

    handleChange(
      "employee_id",
      employeeId || ""
    );
  };

  const handleLevelSelect = (
    managementLevel
  ) => {
    if (
      typeof onManagementLevelChange ===
      "function"
    ) {
      onManagementLevelChange(
        managementLevel || ""
      );

      return;
    }

    handleChange(
      "management_level",
      managementLevel || ""
    );
  };

  const handleSubmit = () => {
    if (
      saving ||
      loading ||
      typeof onSubmit !== "function"
    ) {
      return;
    }

    onSubmit();
  };

  return (
    <Modal
      open={open}
      title={null}
      footer={null}
      width={980}
      centered
      destroyOnHidden
      maskClosable={!saving}
      keyboard={!saving}
      closable={false}
      onCancel={() => {
        if (!saving) {
          onClose?.();
        }
      }}
      styles={{
        body: {
          padding: 0,
        },
        content: {
          padding: 0,
          overflow: "hidden",
          borderRadius: 24,
        },
      }}
    >
      <div className="flex max-h-[92vh] flex-col bg-white">
        {/* =================================================
            Modal Header
        ================================================= */}

        <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-xl text-sky-700">
                <ApartmentOutlined />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-slate-800">
                    {modalTitle}
                  </h2>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-bold",
                      isEditMode
                        ? "bg-amber-100 text-amber-700"
                        : "bg-sky-100 text-sky-700",
                    ].join(" ")}
                  >
                    {isEditMode
                      ? "Edit"
                      : "Create"}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  กำหนดระดับผู้บริหาร
                  ผู้บังคับบัญชา
                  และขอบเขตการดูแลแบบหลาย Scope
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => onClose?.()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="ปิดหน้าต่าง"
            >
              <CloseOutlined />
            </button>
          </div>
        </header>

        {/* =================================================
            Modal Body
        ================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-6 px-5 py-6 sm:px-7">
            {/* Loading State */}

            {loading ? (
              <div className="flex min-h-80 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    กำลังโหลดข้อมูล...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* =========================================
                    Employee and Level
                ========================================= */}

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                      <UserOutlined />
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-800">
                        ข้อมูลผู้บริหาร
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        เลือกพนักงานและกำหนดระดับ
                        Management Level
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Employee Select */}

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        พนักงาน

                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <Select
                        showSearch
                        allowClear
                        size="large"
                        className="w-full"
                        loading={loadingEmployees}
                        disabled={
                          saving ||
                          isEditMode
                        }
                        value={
                          safeForm.employee_id ||
                          undefined
                        }
                        placeholder="ค้นหารหัสหรือชื่อพนักงาน"
                        options={employeeOptions}
                        optionFilterProp="label"
                        filterOption={
                          filterEmployeeOption
                        }
                        onChange={
                          handleEmployeeSelect
                        }
                        optionRender={(option) => {
                          const data =
                            option?.data || {};

                          return (
                            <div className="py-1">
                              <div className="flex items-center justify-between gap-3">
                                <span className="truncate text-sm font-bold text-slate-800">
                                  {data.employeeName ||
                                    "-"}
                                </span>

                                {data.managementLevel && (
                                  <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">
                                    {
                                      data.managementLevel
                                    }
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-400">
                                <span>
                                  {data.employeeCode ||
                                    "-"}
                                </span>

                                <span>•</span>

                                <span className="truncate">
                                  {data.positionName ||
                                    "-"}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                        notFoundContent={
                          loadingEmployees
                            ? "กำลังโหลดพนักงาน..."
                            : "ไม่พบข้อมูลพนักงาน"
                        }
                      />

                      {isEditMode && (
                        <p className="mt-2 text-xs text-amber-600">
                          ไม่สามารถเปลี่ยนพนักงานในโหมดแก้ไขได้
                        </p>
                      )}
                    </div>

                    {/* Management Level */}

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Management Level

                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <Select
                        size="large"
                        className="w-full"
                        disabled={
                          saving ||
                          !safeForm.employee_id
                        }
                        value={
                          safeForm.management_level ||
                          undefined
                        }
                        placeholder="เลือกระดับผู้บริหาร"
                        options={MANAGEMENT_LEVELS.map(
                          (level) => ({
                            value: level,
                            label: level,
                          })
                        )}
                        onChange={
                          handleLevelSelect
                        }
                      />

                      <p className="mt-2 text-xs text-slate-400">
                        รองรับระดับ P12, P11,
                        P10 และ P9
                      </p>
                    </div>
                  </div>
                </section>

                {/* =========================================
                    Selected Employee Summary
                ========================================= */}

                {selectedEmployee && (
                  <EmployeeSummaryCard
                    employee={
                      selectedEmployee
                    }
                    managementLevel={
                      safeForm.management_level
                    }
                  />
                )}

                {/* =========================================
                    Supervisor Section
                ========================================= */}

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <TeamOutlined />
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-800">
                        ผู้บังคับบัญชา
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        กำหนดผู้บริหารระดับบน
                        ที่พนักงานรายนี้ขึ้นตรง
                      </p>
                    </div>
                  </div>

                  <SupervisorSelect
                    managementLevel={
                      safeForm.management_level
                    }
                    requiredSupervisorLevel={
                      requiredSupervisorLevel
                    }
                    employeeId={
                      safeForm.employee_id
                    }
                    value={
                      safeForm.supervisor_employee_id
                    }
                    options={
                      supervisorOptions
                    }
                    onChange={(value) =>
                      handleChange(
                        "supervisor_employee_id",
                        value
                      )
                    }
                  />
                </section>

                                {/* =========================================
                    Multiple Scope Section
                ========================================= */}

                <ManagementScopeEditor
                  scopes={safeForm.scopes}
                  scopeOptions={scopeOptions}
                  loadingOptions={
                    loadingScopeOptions
                  }
                  disabled={saving}
                  onAdd={() => {
                    onAddScope?.();
                  }}
                  onRemove={(scopeIndex) => {
                    onRemoveScope?.(
                      scopeIndex
                    );
                  }}
                  onUpdate={(
                    scopeIndex,
                    field,
                    value
                  ) => {
                    onUpdateScope?.(
                      scopeIndex,
                      field,
                      value
                    );
                  }}
                  onSetPrimary={(
                    scopeIndex
                  ) => {
                    onSetPrimaryScope?.(
                      scopeIndex
                    );
                  }}
                />

                {/* =========================================
                    Assignment Settings
                ========================================= */}

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <SaveOutlined />
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-800">
                        การตั้งค่า Assignment
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        กำหนดสถานะ ลำดับการแสดงผล
                        และ Assignment หลัก
                      </p>
                    </div>
                  </div>

                  <AssignmentSettings
                    form={safeForm}
                    onChange={(
                      field,
                      value
                    ) => {
                      handleChange(
                        field,
                        value
                      );
                    }}
                  />
                </section>

                {/* =========================================
                    Validation Summary
                ========================================= */}

                <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Employee
                      </p>

                      <p
                        className={[
                          "mt-2 text-sm font-black",
                          safeForm.employee_id
                            ? "text-emerald-600"
                            : "text-red-500",
                        ].join(" ")}
                      >
                        {safeForm.employee_id
                          ? "เลือกแล้ว"
                          : "ยังไม่เลือก"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Management Level
                      </p>

                      <p
                        className={[
                          "mt-2 text-sm font-black",
                          safeForm.management_level
                            ? "text-emerald-600"
                            : "text-red-500",
                        ].join(" ")}
                      >
                        {safeForm.management_level ||
                          "ยังไม่เลือก"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Supervisor
                      </p>

                      <p
                        className={[
                          "mt-2 text-sm font-black",
                          safeForm.management_level ===
                            "P12" ||
                          safeForm.supervisor_employee_id
                            ? "text-emerald-600"
                            : "text-amber-600",
                        ].join(" ")}
                      >
                        {safeForm.management_level ===
                        "P12"
                          ? "ไม่จำเป็น"
                          : safeForm.supervisor_employee_id
                            ? "เลือกแล้ว"
                            : "ยังไม่เลือก"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Scopes
                      </p>

                      <p
                        className={[
                          "mt-2 text-sm font-black",
                          Array.isArray(
                            safeForm.scopes
                          ) &&
                          safeForm.scopes.length >
                            0
                            ? "text-emerald-600"
                            : "text-red-500",
                        ].join(" ")}
                      >
                        {Array.isArray(
                          safeForm.scopes
                        )
                          ? `${safeForm.scopes.length} รายการ`
                          : "0 รายการ"}
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>

        
        {/* =================================================
            Modal Footer
        ================================================= */}

        <footer className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

            {/* Left */}

            <div className="text-xs text-slate-400">
              <p>
                <span className="font-semibold">
                  *
                </span>{" "}
                กรุณาตรวจสอบข้อมูลก่อนบันทึก
              </p>

              <p className="mt-1">
                ระบบรองรับ Multiple Scope และกำหนด Scope หลักได้เพียง 1 รายการ
              </p>
            </div>

            {/* Right */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  onClose?.();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CloseOutlined />

                ยกเลิก
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  loading
                }
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <SaveOutlined />

                    {isEditMode
                      ? "บันทึกการแก้ไข"
                      : "บันทึกข้อมูล"}
                  </>
                )}
              </button>

            </div>

          </div>
        </footer>

      </div>

    </Modal>
  );
}
