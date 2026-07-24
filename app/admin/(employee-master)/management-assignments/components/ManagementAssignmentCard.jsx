"use client";

import {
  EditOutlined,
  DeleteOutlined,
  CrownOutlined,
  ApartmentOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import {
  getAssignmentScopes,
  getSingleScopeLabel,
  getScopeTypeLabel,
} from "../utils/scopeUtils";

export default function ManagementAssignmentCard({

  assignment,

  supervisor,

  onEdit,

  onDelete,

}) {

  if (!assignment) {
    return null;
  }

  const scopes =
    getAssignmentScopes(
      assignment
    );

  const primaryScope =
    scopes.find(
      (scope) =>
        scope.is_primary
    ) || scopes[0];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">

      {/* Header */}

      <div className="border-b border-slate-100 p-5">

        <div className="flex items-start justify-between gap-4">

          <div className="flex items-start gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100">

              {assignment.employee_photo_url ? (

                <img
                  src={
                    assignment.employee_photo_url
                  }
                  alt=""
                  className="h-full w-full rounded-2xl object-cover"
                />

              ) : (

                <UserOutlined className="text-xl text-sky-700" />

              )}

            </div>

            <div>

              <div className="flex items-center gap-2">

                <h3 className="text-lg font-black text-slate-800">
                  {assignment.employee_name}
                </h3>

                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">

                  {assignment.management_level}

                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">

                {assignment.position_name}

              </p>

              <p className="text-xs text-slate-400">

                {assignment.employee_code}

              </p>

            </div>

          </div>

          <div className="flex gap-2">

            <button
              onClick={() =>
                onEdit?.(assignment)
              }
              className="rounded-xl border border-slate-300 px-3 py-2 hover:bg-slate-50"
            >
              <EditOutlined />
            </button>

            <button
              onClick={() =>
                onDelete?.(assignment)
              }
              className="rounded-xl border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
            >
              <DeleteOutlined />
            </button>

          </div>

        </div>

      </div>

      {/* Body */}

      <div className="space-y-5 p-5">

        {/* Primary Scope */}

        {primaryScope && (

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">

            <div className="mb-2 flex items-center gap-2">

              <CrownOutlined className="text-amber-600" />

              <span className="text-sm font-bold text-amber-700">

                Scope หลัก

              </span>

            </div>

            <div className="text-sm font-semibold">

              {getScopeTypeLabel(
                primaryScope.scope_type
              )}

            </div>

            <div className="mt-1 text-sm text-slate-600">

              {getSingleScopeLabel(
                primaryScope
              )}

            </div>

          </div>

        )}

        {/* All Scopes */}

        <div>

          <div className="mb-3 flex items-center gap-2">

            <ApartmentOutlined />

            <span className="font-bold">

              Scope ทั้งหมด

            </span>

          </div>

          <div className="space-y-2">

            {scopes.map(
              (scope, index) => (

                <div
                  key={
                    scope.id ||
                    index
                  }
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                >

                  <div>

                    <div className="text-sm font-semibold">

                      {getScopeTypeLabel(
                        scope.scope_type
                      )}

                    </div>

                    <div className="text-xs text-slate-500">

                      {getSingleScopeLabel(
                        scope
                      )}

                    </div>

                  </div>

                  {scope.is_primary && (

                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">

                      Primary

                    </span>

                  )}

                </div>

              )
            )}

          </div>

        </div>

        {/* Supervisor */}

        <div className="rounded-2xl border border-slate-200 p-4">

          <div className="mb-2 flex items-center gap-2">

            <TeamOutlined />

            <span className="font-bold">

              ผู้บังคับบัญชา

            </span>

          </div>

          {supervisor ? (

            <>

              <div className="font-semibold">

                {supervisor.employee_name}

              </div>

              <div className="text-sm text-slate-500">

                {supervisor.management_level}

              </div>

            </>

          ) : (

            <div className="text-sm text-slate-400">

              ไม่มีผู้บังคับบัญชา

            </div>

          )}

        </div>

        {/* Status */}

        <div className="flex items-center justify-between">

          <span className="text-sm font-semibold">

            Status

          </span>

          <span
            className={
              assignment.status ===
              "active"
                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                : "rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"
            }
          >

            {assignment.status}

          </span>

        </div>

      </div>

    </div>
  );
}