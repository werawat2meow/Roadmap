"use client";

export default function EmployeeSummaryCard({
  employee,
  managementLevel,
}) {
  if (!employee) {
    return null;
  }

  const employeeName =
    employee.resolved_employee_name ||
    employee.full_name_th ||
    "-";

  const employeeCode =
    employee.employee_code || "-";

  const positionName =
    employee.resolved_position_name ||
    employee.position_name ||
    "-";

  return (
    <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-sky-200 text-xl font-black text-sky-700 shadow-sm">

          {employee.employee_photo_url ? (
            <img
              src={employee.employee_photo_url}
              alt={employeeName}
              className="h-full w-full object-cover"
            />
          ) : (
            employeeName.charAt(0).toUpperCase()
          )}

        </div>

        <div className="min-w-0 flex-1">

          <h3 className="truncate text-lg font-black text-slate-800">
            {employeeName}
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {employeeCode}
          </p>

          <p className="mt-1 truncate text-sm text-slate-500">
            {positionName}
          </p>

        </div>

        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Management Level
          </p>

          <p className="mt-2 text-2xl font-black text-sky-700">
            {managementLevel || "-"}
          </p>

        </div>

      </div>

    </div>
  );
}