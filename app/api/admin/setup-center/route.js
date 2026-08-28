import { NextResponse } from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

import {
  SETUP_CENTER_STEPS,
  getAllSetupItems,
} from "@/lib/setupCenter/setupCenterConfig";

/* =========================================================
   Helpers
========================================================= */

async function countTable(
  table
) {
  try {
    const {
      count,
      error,
    } =
      await supabaseAdmin
        .from(table)
        .select(
          "*",
          {
            count:
              "exact",

            head:
              true,
          }
        );

    if (error) {
      return {
        table,
        available:
          false,
        count: 0,
        error:
          error.message,
      };
    }

    return {
      table,
      available:
        true,
      count:
        Number(
          count || 0
        ),
      error: null,
    };
  } catch (error) {
    return {
      table,
      available:
        false,
      count: 0,
      error:
        error?.message ||
        "Unknown table error",
    };
  }
}

function calculateStepStatus(
  items
) {
  const requiredItems =
    items.filter(
      (item) =>
        item.required
    );

  if (!requiredItems.length) {
    return {
      status:
        "ready",
      percent: 100,
    };
  }

  const readyRequired =
    requiredItems.filter(
      (item) =>
        item.ready
    ).length;

  const percent =
    Math.round(
      (
        readyRequired /
        requiredItems.length
      ) *
        100
    );

  if (
    readyRequired ===
    requiredItems.length
  ) {
    return {
      status:
        "ready",
      percent: 100,
    };
  }

  if (
    readyRequired >
    0
  ) {
    return {
      status:
        "in_progress",
      percent,
    };
  }

  return {
    status:
      "not_started",
    percent: 0,
  };
}

/* =========================================================
   GET /api/admin/setup-center
========================================================= */

export async function GET() {
  try {
    const guard =
      await requireScopedAccess(
        "system.setup_center",
        "view"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const allItems =
      getAllSetupItems();

    const tableNames =
      [
        ...new Set(
          allItems
            .map(
              (item) =>
                item.table
            )
            .filter(Boolean)
        ),
      ];

    const tableResults =
      await Promise.all(
        tableNames.map(
          countTable
        )
      );

    const tableMap =
      new Map(
        tableResults.map(
          (item) => [
            item.table,
            item,
          ]
        )
      );

    const steps =
      SETUP_CENTER_STEPS.map(
        (step) => {
          const items =
            step.items.map(
              (item) => {
                const table =
                  tableMap.get(
                    item.table
                  ) ||
                  {
                    available:
                      false,
                    count: 0,
                    error:
                      "ไม่ได้กำหนด Table",
                  };

                const ready =
                  item.manualReady
                    ? table.available
                    : table.available &&
                      table.count >
                        0;

                return {
                  ...item,

                  available:
                    table.available,

                  count:
                    table.count,

                  ready,

                  error:
                    table.error,
                };
              }
            );

          const statusInfo =
            calculateStepStatus(
              items
            );

          return {
            ...step,
            ...statusInfo,
            items,
          };
        }
      );

    const requiredEmployeeSteps =
      steps.filter(
        (step) =>
          step.requiredForEmployee
      );

    const employeeReady =
      requiredEmployeeSteps.every(
        (step) =>
          step.status ===
          "ready"
      );

    const p0Steps =
      steps.filter(
        (step) =>
          step.priority ===
          "P0"
      );

    const p0Ready =
      p0Steps.every(
        (step) =>
          step.status ===
          "ready"
      );

    const requiredItems =
      steps.flatMap(
        (step) =>
          step.items.filter(
            (item) =>
              item.required
          )
      );

    const readyItems =
      requiredItems.filter(
        (item) =>
          item.ready
      );

    const overallPercent =
      requiredItems.length
        ? Math.round(
            (
              readyItems.length /
              requiredItems.length
            ) *
              100
          )
        : 100;

    let nextRequiredAction =
      null;

    for (
      const step of
        steps
    ) {
      const nextItem =
        step.items.find(
          (item) =>
            item.required &&
            !item.ready
        );

      if (nextItem) {
        nextRequiredAction = {
          step_key:
            step.key,

          step_order:
            step.order,

          step_title:
            step.title,

          priority:
            step.priority,

          ...nextItem,
        };

        break;
      }
    }

    return NextResponse.json({
      success: true,

      data: {
        steps,

        readiness: {
          employee_ready:
            employeeReady,

          p0_ready:
            p0Ready,

          overall_percent:
            overallPercent,

          required_total:
            requiredItems.length,

          required_ready:
            readyItems.length,

          next_required_action:
            nextRequiredAction,
        },

        table_health:
          tableResults
            .filter(
              (item) =>
                !item.available
            )
            .map(
              (item) => ({
                table:
                  item.table,

                error:
                  item.error,
              })
            ),
      },
    });
  } catch (error) {
    console.error(
      "GET_SETUP_CENTER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถตรวจสอบความพร้อมของระบบได้",
      },
      {
        status: 500,
      }
    );
  }
}
