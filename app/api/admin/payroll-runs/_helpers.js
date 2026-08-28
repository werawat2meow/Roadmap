import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

export const RUN_TYPES = [
  "regular",
  "adjustment",
  "bonus",
  "final",
];

export const RUN_STATUSES = [
  "draft",
  "prepared",
  "processing",
  "completed",
  "cancelled",
];

export function cleanText(
  value
) {
  return String(
    value || ""
  ).trim();
}

export function cleanNullableText(
  value
) {
  const text =
    cleanText(value);

  return text || null;
}

export function cleanCode(
  value
) {
  return cleanText(value)
    .toUpperCase()
    .replace(
      /[^A-Z0-9_-]/g,
      "_"
    )
    .replace(
      /_+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );
}

export function sanitizeSearch(
  value
) {
  return cleanText(value)
    .replaceAll(
      ",",
      " "
    )
    .replaceAll(
      "(",
      " "
    )
    .replaceAll(
      ")",
      " "
    )
    .replaceAll(
      "%",
      ""
    )
    .replaceAll(
      "*",
      ""
    )
    .trim();
}

export function jsonError(
  message,
  status = 500,
  extra = {}
) {
  return Response.json(
    {
      success:
        false,
      error:
        message,
      ...extra,
    },
    {
      status,
    }
  );
}

export function getActorId(
  guard
) {
  return (
    guard
      ?.access
      ?.user_account_id ||
    guard
      ?.access
      ?.user
      ?.id ||
    guard
      ?.user
      ?.id ||
    null
  );
}

export function getErrorStatus(
  error
) {
  if (!error) {
    return 500;
  }

  if (
    error.code ===
    "23505"
  ) {
    return 409;
  }

  if (
    [
      "23503",
      "23514",
      "23502",
      "22P02",
    ].includes(
      error.code
    )
  ) {
    return 400;
  }

  return 500;
}

export function mapDatabaseError(
  error
) {
  if (!error) {
    return "เกิดข้อผิดพลาดในฐานข้อมูล";
  }

  if (
    error.code ===
    "23505"
  ) {
    return "รหัส Payroll Run ซ้ำ หรือมี Regular Run ของงวดนี้อยู่แล้ว";
  }

  if (
    error.code ===
    "23503"
  ) {
    return "ข้อมูล Payroll Run ถูกอ้างอิง หรือไม่พบข้อมูลที่เกี่ยวข้อง";
  }

  if (
    error.code ===
    "23514"
  ) {
    return "ข้อมูล Payroll Run ไม่ผ่านเงื่อนไข";
  }

  if (
    error.code ===
    "23502"
  ) {
    return "กรุณากรอกข้อมูลที่จำเป็นให้ครบ";
  }

  if (
    error.code ===
    "22P02"
  ) {
    return "รูปแบบ UUID หรือข้อมูลไม่ถูกต้อง";
  }

  return (
    error.message ||
    "เกิดข้อผิดพลาดในฐานข้อมูล"
  );
}

export async function loadRun(
  id
) {
  return supabaseAdmin
    .from(
      "payroll_runs"
    )
    .select(
      `
        id,
        company_id,
        payroll_period_id,
        payroll_group_id,
        run_code,
        run_name,
        run_type,
        status,
        calculation_engine,
        employee_count,
        calculated_count,
        error_count,
        base_salary_total,
        gross_amount,
        deduction_amount,
        net_amount,
        prepared_at,
        started_at,
        completed_at,
        cancelled_at,
        is_locked,
        remark,
        created_by,
        updated_by,
        created_at,
        updated_at,
        companies:company_id (
          id,
          company_code,
          company_name_th,
          company_name_en
        ),
        payroll_periods:payroll_period_id (
          id,
          company_id,
          payroll_group_id,
          period_code,
          period_name,
          period_year,
          period_no,
          period_start_date,
          period_end_date,
          cutoff_start_date,
          cutoff_end_date,
          payment_date,
          status,
          is_locked
        ),
        payroll_groups:payroll_group_id (
          id,
          payroll_group_code,
          payroll_group_name,
          payroll_company_id,
          payment_frequency,
          status
        )
      `
    )
    .eq(
      "id",
      id
    )
    .maybeSingle();
}

export async function validatePeriod({
  companyId,
  payrollPeriodId,
  requireOpen = false,
}) {
  const {
    data: period,
    error,
  } =
    await supabaseAdmin
      .from(
        "payroll_periods"
      )
      .select(
        `
          id,
          company_id,
          payroll_group_id,
          period_code,
          period_name,
          period_year,
          period_no,
          period_start_date,
          period_end_date,
          cutoff_start_date,
          cutoff_end_date,
          payment_date,
          status,
          is_locked
        `
      )
      .eq(
        "id",
        payrollPeriodId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!period) {
    return {
      error:
        "ไม่พบงวดเงินเดือนที่เลือก",
    };
  }

  if (
    String(
      period.company_id
    ) !==
    String(companyId)
  ) {
    return {
      error:
        "งวดเงินเดือนนี้ไม่ได้อยู่ในบริษัทที่เลือก",
    };
  }

  if (
    !period.payroll_group_id
  ) {
    return {
      error:
        "งวดเงินเดือนนี้ไม่ได้ผูกกับ Payroll Group",
    };
  }

  if (
    requireOpen &&
    period.status !==
      "open"
  ) {
    return {
      error:
        "ต้องเปิดงวดเงินเดือน (Open) ก่อนเตรียมประมวลผล",
    };
  }

  return {
    period,
  };
}

function toDateKey(
  value
) {
  if (!value) {
    return null;
  }

  return String(
    value
  ).slice(
    0,
    10
  );
}

function isCurrentCompensation(
  compensation,
  period
) {
  if (!compensation) {
    return false;
  }

  if (
    compensation.status &&
    ![
      "active",
      "current",
    ].includes(
      String(
        compensation.status
      ).toLowerCase()
    )
  ) {
    return false;
  }

  const effective =
    toDateKey(
      compensation.effective_date ||
      compensation.start_date
    );

  const expire =
    toDateKey(
      compensation.expire_date ||
      compensation.end_date
    );

  const periodStart =
    toDateKey(
      period.period_start_date
    );

  const periodEnd =
    toDateKey(
      period.period_end_date
    );

  if (
    effective &&
    periodEnd &&
    effective >
      periodEnd
  ) {
    return false;
  }

  if (
    expire &&
    periodStart &&
    expire <
      periodStart
  ) {
    return false;
  }

  return true;
}

function getEmployeeName(
  employee
) {
  const th =
    [
      employee
        ?.first_name_th,
      employee
        ?.last_name_th,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  if (th) {
    return th;
  }

  const en =
    [
      employee
        ?.first_name_en,
      employee
        ?.last_name_en,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  return (
    en ||
    employee
      ?.employee_code ||
    "-"
  );
}

function getRowCompanyId({
  employee,
  compensation,
  branchCompanyMap,
}) {
  return (
    compensation
      ?.company_id ||
    employee
      ?.company_id ||
    branchCompanyMap.get(
      String(
        employee
          ?.branch_id ||
        ""
      )
    ) ||
    null
  );
}

function getRowPayrollGroupId({
  employee,
  compensation,
}) {
  return (
    compensation
      ?.payroll_group_id ||
    employee
      ?.payroll_group_id ||
    null
  );
}

function getBaseSalary(
  compensation
) {
  const value =
    Number(
      compensation
        ?.base_salary ||
      0
    );

  return Number.isFinite(
    value
  )
    ? Math.max(
        value,
        0
      )
    : 0;
}

/*
 * โหลด Employee Snapshot แบบยืดหยุ่น
 *
 * ใช้ select("*") เพื่อไม่ผูกกับ schema ของ Employee Compensation
 * มากเกินไป และรองรับ field ที่ Project มีอยู่แล้ว
 *
 * Matching Payroll Group:
 * 1) compensation.payroll_group_id
 * 2) employee.payroll_group_id
 * 3) fallback payroll_company_id (เมื่อ Employee ไม่มี payroll_group_id)
 */
export async function buildPayrollEmployeeSnapshot({
  companyId,
  payrollGroupId,
  period,
}) {
  const {
    data: group,
    error:
      groupError,
  } =
    await supabaseAdmin
      .from(
        "payroll_groups"
      )
      .select(
        `
          id,
          payroll_company_id,
          payroll_group_code,
          payroll_group_name,
          status
        `
      )
      .eq(
        "id",
        payrollGroupId
      )
      .maybeSingle();

  if (groupError) {
    throw groupError;
  }

  if (!group) {
    throw new Error(
      "ไม่พบ Payroll Group ของงวด"
    );
  }

  const {
    data:
      compensations,
    error:
      compensationError,
  } =
    await supabaseAdmin
      .from(
        "employee_compensations"
      )
      .select("*")
      .limit(20000);

  if (
    compensationError
  ) {
    throw compensationError;
  }

  const currentComps =
    (
      compensations ||
      []
    ).filter(
      (item) =>
        isCurrentCompensation(
          item,
          period
        )
    );

  const employeeIds =
    [
      ...new Set(
        currentComps
          .map(
            (item) =>
              item.employee_id
          )
          .filter(Boolean)
      ),
    ];

  if (
    employeeIds.length ===
    0
  ) {
    return [];
  }

  const employees = [];

  const CHUNK_SIZE =
    500;

  for (
    let index = 0;
    index <
    employeeIds.length;
    index +=
      CHUNK_SIZE
  ) {
    const chunk =
      employeeIds.slice(
        index,
        index +
          CHUNK_SIZE
      );

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "employees"
        )
        .select("*")
        .in(
          "id",
          chunk
        );

    if (error) {
      throw error;
    }

    employees.push(
      ...(data || [])
    );
  }

  const branchIds =
    [
      ...new Set(
        employees
          .map(
            (item) =>
              item.branch_id
          )
          .filter(Boolean)
      ),
    ];

  const branchCompanyMap =
    new Map();

  if (
    branchIds.length >
    0
  ) {
    const {
      data: branches,
      error:
        branchError,
    } =
      await supabaseAdmin
        .from(
          "branches"
        )
        .select(
          "id,company_id"
        )
        .in(
          "id",
          branchIds
        );

    if (branchError) {
      throw branchError;
    }

    (
      branches || []
    ).forEach(
      (branch) => {
        branchCompanyMap.set(
          String(
            branch.id
          ),
          branch.company_id
        );
      }
    );
  }

  const employeeMap =
    new Map(
      employees.map(
        (item) => [
          String(
            item.id
          ),
          item,
        ]
      )
    );

  const compensationByEmployee =
    new Map();

  currentComps
    .sort(
      (a, b) =>
        String(
          b.effective_date ||
          b.created_at ||
          ""
        ).localeCompare(
          String(
            a.effective_date ||
            a.created_at ||
            ""
          )
        )
    )
    .forEach(
      (item) => {
        const key =
          String(
            item.employee_id ||
            ""
          );

        if (
          key &&
          !compensationByEmployee.has(
            key
          )
        ) {
          compensationByEmployee.set(
            key,
            item
          );
        }
      }
    );

  const result = [];

  for (
    const [
      employeeId,
      compensation,
    ] of
      compensationByEmployee.entries()
  ) {
    const employee =
      employeeMap.get(
        employeeId
      );

    if (!employee) {
      continue;
    }

    if (
      employee.status &&
      [
        "inactive",
        "resigned",
        "retired",
        "terminated",
      ].includes(
        String(
          employee.status
        ).toLowerCase()
      )
    ) {
      continue;
    }

    const rowCompanyId =
      getRowCompanyId({
        employee,
        compensation,
        branchCompanyMap,
      });

    if (
      String(
        rowCompanyId ||
        ""
      ) !==
      String(companyId)
    ) {
      continue;
    }

    const rowGroupId =
      getRowPayrollGroupId({
        employee,
        compensation,
      });

    const employeePayrollCompanyId =
      compensation
        ?.payroll_company_id ||
      employee
        ?.payroll_company_id ||
      null;

    const exactGroupMatch =
      rowGroupId &&
      String(
        rowGroupId
      ) ===
        String(
          payrollGroupId
        );

    const payrollCompanyFallback =
      !rowGroupId &&
      employeePayrollCompanyId &&
      group
        .payroll_company_id &&
      String(
        employeePayrollCompanyId
      ) ===
        String(
          group
            .payroll_company_id
        );

    if (
      !exactGroupMatch &&
      !payrollCompanyFallback
    ) {
      continue;
    }

    const baseSalary =
      getBaseSalary(
        compensation
      );

    result.push({
      employee_id:
        employee.id,

      employee_code:
        employee
          .employee_code ||
        null,

      employee_name:
        getEmployeeName(
          employee
        ),

      base_salary:
        baseSalary,

      snapshot: {
        employee: {
          id:
            employee.id,
          employee_code:
            employee
              .employee_code ||
            null,
          branch_id:
            employee
              .branch_id ||
            null,
          department_id:
            employee
              .department_id ||
            null,
          division_id:
            employee
              .division_id ||
            null,
          unit_id:
            employee
              .unit_id ||
            null,
          position_id:
            employee
              .position_id ||
            null,
          payroll_company_id:
            employee
              .payroll_company_id ||
            null,
          payroll_group_id:
            employee
              .payroll_group_id ||
            null,
        },

        compensation: {
          id:
            compensation
              .id ||
            null,
          base_salary:
            baseSalary,
          salary_structure_id:
            compensation
              .salary_structure_id ||
            null,
          position_level_band_id:
            compensation
              .position_level_band_id ||
            null,
          payroll_company_id:
            compensation
              .payroll_company_id ||
            null,
          payroll_group_id:
            compensation
              .payroll_group_id ||
            null,
          effective_date:
            compensation
              .effective_date ||
            null,
          expire_date:
            compensation
              .expire_date ||
            null,
        },

        matching: {
          method:
            exactGroupMatch
              ? "payroll_group_id"
              : "payroll_company_fallback",
        },
      },
    });
  }

  return result.sort(
    (a, b) =>
      String(
        a.employee_code ||
        ""
      ).localeCompare(
        String(
          b.employee_code ||
          ""
        )
      )
  );
}
