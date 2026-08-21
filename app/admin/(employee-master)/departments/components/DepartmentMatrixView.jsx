"use client";

import { useMemo } from "react";
import { Tooltip } from "antd";

import DepartmentMatrixPdfExport from "./DepartmentMatrixPdfExport";

import {
  MATRIX_ALL_COLOR,
  MATRIX_EMPTY_COLOR,
  buildBranchGroups,
  getBranchesByGroup,
  getDepartmentBranchesByGroup,
  getDepartmentMatrixColor,
  getDepartmentScopeLabel,
  getGroupMatrixColor,
  isDepartmentAllBranches,
  isDepartmentAllGroupBranches,
} from "./departmentMatrixUtils";

function BranchLogo({ branch, compact = false }) {
  const sizeClass = compact ? "h-10 w-10" : "h-14 w-14";

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm`}
    >
      {branch?.branch_image_url ? (
        <img
          src={branch.branch_image_url}
          alt={branch.branch_name || branch.branch_code || "Branch"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[8px] text-slate-400">LOGO</span>
      )}
    </div>
  );
}

function DepartmentActions({
  department,
  deletingId,
  canEditRecord,
  canDeleteRecord,
  onEdit,
  onDelete,
  compact = false,
}) {
  const canEditDepartment = canEditRecord(department);
  const canDeleteDepartment = canDeleteRecord(department);

  if (!canEditDepartment && !canDeleteDepartment) {
    return null;
  }

  return (
    <div className={`flex justify-end gap-2 ${compact ? "" : "justify-center"}`}>
      {canEditDepartment && (
        <button
          type="button"
          onClick={() => onEdit(department)}
          className="border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          Edit
        </button>
      )}

      {canDeleteDepartment && (
        <button
          type="button"
          onClick={() => onDelete(department)}
          disabled={deletingId === department.id}
          className="border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deletingId === department.id ? (compact ? "Deleting..." : "...") : "Delete"}
        </button>
      )}
    </div>
  );
}

function MobileMatrix({
  loading,
  departments,
  branches,
  branchGroups,
  deletingId,
  canEdit,
  canDelete,
  canEditRecord,
  canDeleteRecord,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="space-y-4 lg:hidden">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm"
          >
            <div className="h-16 animate-pulse bg-slate-200" />
            <div className="grid grid-cols-2 gap-px bg-slate-300 p-px">
              <div className="h-28 animate-pulse bg-slate-100" />
              <div className="h-28 animate-pulse bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!departments.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-400 lg:hidden">
        ไม่พบข้อมูลแผนก
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:hidden">
      {departments.map((department, index) => {
        const allBranches = isDepartmentAllBranches(department, branches);

        return (
          <div
            key={department.id}
            className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm"
          >
            <div
              className="border-b border-slate-300 p-4"
              style={{
                backgroundColor: getDepartmentMatrixColor(
                  department,
                  branches,
                  branchGroups
                ),
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                    Department {index + 1}
                  </div>
                  <div className="mt-1 text-base font-bold text-slate-900">
                    {department.name}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    {department.code}
                    {allBranches
                      ? " · ทุกสังกัด"
                      : ` · ${department.branch_ids?.length || 0} สังกัด`}
                  </div>
                </div>

                <span
                  className={`shrink-0 border px-2.5 py-1 text-[10px] font-bold ${
                    department.status === "active"
                      ? "border-green-600/30 bg-green-50 text-green-700"
                      : "border-red-600/30 bg-red-50 text-red-600"
                  }`}
                >
                  {department.status === "active" ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>

            <div className="border-b border-slate-300 bg-[#666666] px-3 py-2 text-center text-[11px] font-bold tracking-wider text-white">
              GROUP
            </div>

            <div className="divide-y divide-slate-300">
              {branchGroups.map((group) => {
                const groupBranches = getDepartmentBranchesByGroup(
                  department,
                  branches,
                  group.key
                );
                const allGroupBranches = isDepartmentAllGroupBranches(
                  department,
                  branches,
                  group.key
                );

                return (
                  <div key={group.key} className="grid grid-cols-[120px_1fr]">
                    <div className="border-r border-slate-300 bg-[#666666] px-3 py-3 text-center text-xs font-bold text-white">
                      {group.name}
                    </div>

                    <div
                      className="min-h-[72px] px-3 py-2"
                      style={{
                        backgroundColor: getGroupMatrixColor(
                          department,
                          branches,
                          group
                        ),
                      }}
                    >
                      {groupBranches.length ? (
                        <div className="space-y-1">
                          {groupBranches.map((branch) => (
                            <div
                              key={branch.id}
                              className="flex items-center gap-2 border-b border-black/10 py-1.5 last:border-b-0"
                            >
                              <BranchLogo branch={branch} compact />
                              <div className="min-w-0">
                                <div className="truncate text-[11px] font-bold text-slate-800">
                                  {branch.branch_code || "-"}
                                </div>
                                <div className="truncate text-[10px] text-slate-600">
                                  {branch.branch_name || "-"}
                                </div>
                              </div>
                            </div>
                          ))}

                          {allGroupBranches && (
                            <div className="pt-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                              ทุกสังกัดในกลุ่ม
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex min-h-[52px] items-center justify-center text-xs text-slate-500">
                          -
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {(canEdit || canDelete) &&
              (canEditRecord(department) || canDeleteRecord(department)) && (
                <div className="border-t border-slate-300 bg-white p-3">
                  <DepartmentActions
                    department={department}
                    deletingId={deletingId}
                    canEditRecord={canEditRecord}
                    canDeleteRecord={canDeleteRecord}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    compact
                  />
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
}

function DesktopMatrix({
  loading,
  departments,
  branches,
  branchGroups,
  deletingId,
  canEdit,
  canDelete,
  canEditRecord,
  canDeleteRecord,
  onEdit,
  onDelete,
}) {
  const manageEnabled = canEdit || canDelete;

  return (
    <div
      id="department-matrix-print-root"
      className="hidden overflow-hidden border border-slate-300 bg-white shadow-sm lg:block"
    >
      <div className="border-b border-slate-300 bg-white px-6 py-4 text-center">
        <h2 className="text-3xl font-black tracking-tight text-black">
          BUSINESS STRUCTURE 2026
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          GROUP / สังกัด อยู่ด้านซ้าย และ Department อยู่ด้านขวาตามรูปแบบโครงสร้างบริษัท
        </p>
      </div>

      <div className="overflow-x-auto" data-matrix-scroll>
        <table className="w-full min-w-[1250px] border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#666666] text-white">
              <th
                colSpan={Math.max(branchGroups.length, 1)}
                className="border border-slate-400 px-3 py-2 text-center text-xs font-bold tracking-wider"
              >
                GROUP
              </th>
              <th rowSpan={2} className="w-[58px] border border-slate-400 px-2 py-2 text-center font-bold">
                NO.
              </th>
              <th rowSpan={2} className="min-w-[220px] border border-slate-400 px-3 py-2 text-center font-bold">
                Department
              </th>
              <th rowSpan={2} className="w-[92px] border border-slate-400 px-2 py-2 text-center font-bold">
                Status
              </th>
              {manageEnabled && (
                <th
                  rowSpan={2}
                  data-matrix-no-print
                  className="w-[132px] border border-slate-400 px-2 py-2 text-center font-bold"
                >
                  Manage
                </th>
              )}
            </tr>

            <tr className="bg-[#666666] text-white">
              {branchGroups.length > 0 ? (
                branchGroups.map((group) => (
                  <th
                    key={group.key}
                    className="min-w-[155px] border border-slate-400 px-3 py-2 text-center font-bold"
                  >
                    {group.name}
                  </th>
                ))
              ) : (
                <th className="min-w-[155px] border border-slate-400 px-3 py-2 text-center font-bold">
                  -
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              [...Array(6)].map((_, index) => (
                <tr key={index}>
                  {(branchGroups.length ? branchGroups : [{ key: "loading" }]).map(
                    (group) => (
                      <td
                        key={`${group.key}-${index}`}
                        className="h-24 border border-slate-300 bg-slate-100 px-3 py-3"
                      >
                        <div className="mx-auto h-12 w-16 animate-pulse bg-slate-200" />
                      </td>
                    )
                  )}
                  <td className="border border-slate-300 bg-white px-2 py-3 text-center">
                    <div className="mx-auto h-4 w-6 animate-pulse bg-slate-200" />
                  </td>
                  <td className="border border-slate-300 bg-white px-3 py-3">
                    <div className="h-4 w-32 animate-pulse bg-slate-200" />
                  </td>
                  <td className="border border-slate-300 bg-white px-2 py-3">
                    <div className="mx-auto h-5 w-14 animate-pulse bg-slate-200" />
                  </td>
                  {manageEnabled && (
                    <td className="border border-slate-300 bg-white px-2 py-3">
                      <div className="mx-auto h-7 w-20 animate-pulse bg-slate-200" />
                    </td>
                  )}
                </tr>
              ))
            ) : departments.length > 0 ? (
              departments.map((department, index) => {
                const allBranches = isDepartmentAllBranches(department, branches);

                return (
                  <tr key={department.id}>
                    {index === 0 &&
                      (branchGroups.length > 0 ? (
                        branchGroups.map((group) => {
                          const groupBranches = getBranchesByGroup(branches, group.key);

                          return (
                            <td
                              key={group.key}
                              rowSpan={departments.length}
                              className="border border-slate-300 p-0 align-top"
                              style={{
                                backgroundColor: group.color || MATRIX_EMPTY_COLOR,
                              }}
                            >
                              <div className="divide-y divide-black/10">
                                {groupBranches.length > 0 ? (
                                  groupBranches.map((branch) => (
                                    <Tooltip
                                      key={branch.id}
                                      title={`${branch.branch_code || ""} ${branch.branch_name || ""}`}
                                      placement="top"
                                      color="#0f172a"
                                    >
                                      <div className="flex min-h-[92px] flex-col items-center justify-center px-2 py-3 text-center">
                                        <BranchLogo branch={branch} />
                                        <div className="mt-2 max-w-[135px] truncate text-[10px] font-bold text-slate-800">
                                          {branch.branch_code || "-"}
                                        </div>
                                        <div className="mt-0.5 max-w-[135px] truncate text-[9px] text-slate-600">
                                          {branch.branch_name || "-"}
                                        </div>
                                      </div>
                                    </Tooltip>
                                  ))
                                ) : (
                                  <div className="flex min-h-[100px] items-center justify-center text-slate-500">
                                    -
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })
                      ) : (
                        <td
                          rowSpan={departments.length}
                          className="border border-slate-300 bg-slate-50 px-3 py-3 text-center text-slate-400"
                        >
                          -
                        </td>
                      ))}

                    <td
                      className="border border-slate-300 px-2 py-3 text-center align-middle font-bold text-slate-800"
                      style={{
                        backgroundColor: getDepartmentMatrixColor(
                          department,
                          branches,
                          branchGroups
                        ),
                      }}
                    >
                      {index + 1}
                    </td>

                    <td
                      className="border border-slate-300 px-3 py-3 align-middle"
                      style={{
                        backgroundColor: getDepartmentMatrixColor(
                          department,
                          branches,
                          branchGroups
                        ),
                      }}
                    >
                      <div className="font-bold text-slate-900">{department.name}</div>
                      <div className="mt-0.5 text-[10px] text-slate-700">{department.code}</div>
                      <div className="mt-1 text-[9px] font-medium text-slate-600">
                        {getDepartmentScopeLabel(department, branches, branchGroups)}
                        {allBranches ? " · สีเทา" : ""}
                      </div>
                    </td>

                    <td className="border border-slate-300 bg-white px-2 py-3 text-center align-middle">
                      <span
                        className={`inline-flex border px-2 py-1 text-[9px] font-bold ${
                          department.status === "active"
                            ? "border-green-300 bg-green-50 text-green-700"
                            : "border-red-300 bg-red-50 text-red-600"
                        }`}
                      >
                        {department.status === "active" ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    {manageEnabled && (
                      <td
                        data-matrix-no-print
                        className="border border-slate-300 bg-white px-2 py-3 align-middle"
                      >
                        {canEditRecord(department) || canDeleteRecord(department) ? (
                          <DepartmentActions
                            department={department}
                            deletingId={deletingId}
                            canEditRecord={canEditRecord}
                            canDeleteRecord={canDeleteRecord}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        ) : (
                          <div className="text-center text-slate-400">-</div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={
                    Math.max(branchGroups.length, 1) + 3 + (manageEnabled ? 1 : 0)
                  }
                  className="border border-slate-300 bg-white px-6 py-12 text-center text-slate-400"
                >
                  ไม่พบข้อมูลแผนก
                </td>
              </tr>
            )}
          </tbody>

          {!loading && departments.length > 0 && (
            <tfoot>
              <tr className="bg-[#666666] text-white">
                {branchGroups.length > 0 ? (
                  branchGroups.map((group) => (
                    <td
                      key={group.key}
                      className="border border-slate-400 px-3 py-2 text-center font-bold"
                    >
                      {getBranchesByGroup(branches, group.key).length}
                    </td>
                  ))
                ) : (
                  <td className="border border-slate-400 px-3 py-2 text-center font-bold">
                    0
                  </td>
                )}
                <td className="border border-slate-400 px-2 py-2 text-center font-bold">-</td>
                <td className="border border-slate-400 px-3 py-2 text-right font-bold">
                  รวม {departments.length} แผนก
                </td>
                <td className="border border-slate-400 px-2 py-2 text-center font-bold">-</td>
                {manageEnabled && (
                  <td
                    data-matrix-no-print
                    className="border border-slate-400 px-2 py-2 text-center font-bold"
                  >
                    -
                  </td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-slate-300 bg-slate-50 px-4 py-2 text-[10px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <span
            className="h-3 w-5 border border-slate-400"
            style={{ backgroundColor: MATRIX_ALL_COLOR }}
          />
          สีเทา = ทุกสังกัด / ข้ามหลาย Group
        </div>
        <div>อยู่ Group เดียว = ใช้สีของ Branch Group อัตโนมัติ</div>
      </div>
    </div>
  );
}

export default function DepartmentMatrixView({
  loading,
  departments = [],
  branches = [],
  deletingId,
  canEdit,
  canDelete,
  canEditRecord,
  canDeleteRecord,
  onEdit,
  onDelete,
}) {
  const branchGroups = useMemo(() => buildBranchGroups(branches), [branches]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end" data-matrix-no-print>
        <DepartmentMatrixPdfExport
          disabled={loading || departments.length === 0}
        />
      </div>

      <MobileMatrix
        loading={loading}
        departments={departments}
        branches={branches}
        branchGroups={branchGroups}
        deletingId={deletingId}
        canEdit={canEdit}
        canDelete={canDelete}
        canEditRecord={canEditRecord}
        canDeleteRecord={canDeleteRecord}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <DesktopMatrix
        loading={loading}
        departments={departments}
        branches={branches}
        branchGroups={branchGroups}
        deletingId={deletingId}
        canEdit={canEdit}
        canDelete={canDelete}
        canEditRecord={canEditRecord}
        canDeleteRecord={canDeleteRecord}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <style jsx global>{`
        @media print {
          @page {
            size: A3 landscape;
            margin: 7mm;
          }

          html,
          body {
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          #department-matrix-print-root,
          #department-matrix-print-root * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #department-matrix-print-root {
            display: block !important;
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            overflow: visible !important;
            border: 1px solid #94a3b8 !important;
            box-shadow: none !important;
          }

          #department-matrix-print-root [data-matrix-no-print] {
            display: none !important;
          }

          #department-matrix-print-root [data-matrix-scroll] {
            overflow: visible !important;
          }

          #department-matrix-print-root table {
            width: 100% !important;
            min-width: 0 !important;
            table-layout: fixed !important;
            font-size: 6.5pt !important;
          }

          #department-matrix-print-root th,
          #department-matrix-print-root td {
            min-width: 0 !important;
            padding: 1.3mm 1mm !important;
          }

          #department-matrix-print-root img {
            max-width: 11mm !important;
            max-height: 11mm !important;
            object-fit: contain !important;
          }

          #department-matrix-print-root tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          #department-matrix-print-root h2 {
            font-size: 18pt !important;
          }
        }
      `}</style>
    </div>
  );
}
