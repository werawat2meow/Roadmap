import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

function unavailableMetric() {
  return {
    available: false,
    data: null,
  };
}

async function runScopedMetric({
  moduleCode,
  options,
  loader,
}) {
  try {
    const guard =
      await requireScopedAccess(
        moduleCode,
        "view",
        options
      );

    if (!guard?.ok) {
      return unavailableMetric();
    }

    const data =
      await loader(guard);

    return {
      available: true,
      data,
    };
  } catch (error) {
    console.error(
      `PORTAL_HOME_METRIC_ERROR:${moduleCode}:`,
      error
    );

    return {
      available: true,
      data: null,
      error:
        error?.message ||
        "ไม่สามารถโหลดข้อมูลได้",
    };
  }
}

function summarizeStatuses(
  rows = []
) {
  return rows.reduce(
    (result, row) => {
      const status =
        String(
          row?.status || ""
        ).toLowerCase();

      result.total += 1;

      if (status) {
        result[status] =
          (
            result[status] ||
            0
          ) + 1;
      }

      return result;
    },
    {
      total: 0,
    }
  );
}

export async function GET() {
  try {
    const [
      employees,
      payrollPeriods,
      payrollRuns,
      taxRates,
      socialSecurity,
    ] =
      await Promise.all([
        runScopedMetric({
          moduleCode:
            "ems.employees",

          options: {
            scopeType:
              "employee",
          },

          loader:
            async (
              guard
            ) => {
              /*
               * Employee Scope ต้องใช้ helper เฉพาะ Employee
               * ไม่ fallback ไปนับทั้งระบบ
               */
              if (
                typeof guard
                  .applyEmployeeScope !==
                "function"
              ) {
                return {
                  total: 0,
                  active: 0,
                  scope_supported:
                    false,
                };
              }

              let query =
                supabaseAdmin
                  .from(
                    "employees"
                  )
                  .select(
                    "id,status",
                    {
                      count:
                        "exact",
                    }
                  );

              query =
                guard.applyEmployeeScope(
                  query
                );

              const {
                data,
                error,
                count,
              } =
                await query.limit(
                  5000
                );

              if (error) {
                throw error;
              }

              const rows =
                data || [];

              return {
                total:
                  count ??
                  rows.length,

                active:
                  rows.filter(
                    (item) =>
                      String(
                        item.status ||
                        ""
                      ).toLowerCase() ===
                      "active"
                  ).length,

                scope_supported:
                  true,
              };
            },
        }),

        runScopedMetric({
          moduleCode:
            "ems.payroll_periods",

          options: {
            scopeType:
              "company",
          },

          loader:
            async (
              guard
            ) => {
              let query =
                supabaseAdmin
                  .from(
                    "payroll_periods"
                  )
                  .select(
                    "id,status"
                  );

              query =
                guard.applyScope(
                  query,
                  "company_id"
                );

              const {
                data,
                error,
              } =
                await query.limit(
                  5000
                );

              if (error) {
                throw error;
              }

              return summarizeStatuses(
                data || []
              );
            },
        }),

        runScopedMetric({
          moduleCode:
            "ems.payroll_runs",

          options: {
            scopeType:
              "company",
          },

          loader:
            async (
              guard
            ) => {
              let query =
                supabaseAdmin
                  .from(
                    "payroll_runs"
                  )
                  .select(
                    "id,status,error_count"
                  );

              query =
                guard.applyScope(
                  query,
                  "company_id"
                );

              const {
                data,
                error,
              } =
                await query.limit(
                  5000
                );

              if (error) {
                throw error;
              }

              const rows =
                data || [];

              return {
                ...summarizeStatuses(
                  rows
                ),

                with_errors:
                  rows.filter(
                    (item) =>
                      Number(
                        item.error_count ||
                        0
                      ) > 0
                  ).length,
              };
            },
        }),

        runScopedMetric({
          moduleCode:
            "ems.tax_rates",

          options: {
            scopeType:
              "company",
          },

          loader:
            async (
              guard
            ) => {
              let query =
                supabaseAdmin
                  .from(
                    "tax_rate_sets"
                  )
                  .select(
                    "id,status,is_default"
                  );

              query =
                guard.applyScope(
                  query,
                  "company_id"
                );

              const {
                data,
                error,
              } =
                await query.limit(
                  5000
                );

              if (error) {
                throw error;
              }

              const rows =
                data || [];

              return {
                total:
                  rows.length,

                active:
                  rows.filter(
                    (item) =>
                      item.status ===
                      "active"
                  ).length,

                default:
                  rows.filter(
                    (item) =>
                      item.status ===
                        "active" &&
                      item.is_default ===
                        true
                  ).length,
              };
            },
        }),

        runScopedMetric({
          moduleCode:
            "ems.social_security",

          options: {
            scopeType:
              "company",
          },

          loader:
            async (
              guard
            ) => {
              let query =
                supabaseAdmin
                  .from(
                    "social_security_settings"
                  )
                  .select(
                    "id,status,is_default"
                  );

              query =
                guard.applyScope(
                  query,
                  "company_id"
                );

              const {
                data,
                error,
              } =
                await query.limit(
                  5000
                );

              if (error) {
                throw error;
              }

              const rows =
                data || [];

              return {
                total:
                  rows.length,

                active:
                  rows.filter(
                    (item) =>
                      item.status ===
                      "active"
                  ).length,

                default:
                  rows.filter(
                    (item) =>
                      item.status ===
                        "active" &&
                      item.is_default ===
                        true
                  ).length,
              };
            },
        }),
      ]);

    return NextResponse.json({
      success: true,

      data: {
        employees,
        payroll_periods:
          payrollPeriods,
        payroll_runs:
          payrollRuns,
        tax_rates:
          taxRates,
        social_security:
          socialSecurity,
      },

      generated_at:
        new Date()
          .toISOString(),
    });
  } catch (error) {
    console.error(
      "GET_PORTAL_HOME_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถโหลดข้อมูลหน้า Portal Home ได้",
      },
      {
        status: 500,
      }
    );
  }
}
