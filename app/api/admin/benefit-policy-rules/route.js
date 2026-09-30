import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

const MODULE = "benefits.policy_rules";

function cleanText(
  value
) {
  return String(
    value || ""
  ).trim();
}

function nullableText(
  value
) {
  const cleaned =
    cleanText(
      value
    );

  return cleaned ||
    null;
}

function nullableNumber(
  value
) {
  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

function buildPayload(
  body
) {
  return {
    benefit_id:
      body
        ?.benefit_id ||
      null,

    policy_code:
      cleanText(
        body
          ?.policy_code
      ).toUpperCase(),

    policy_name:
      cleanText(
        body
          ?.policy_name
      ),

    rule_year:
      Number(
        body
          ?.rule_year ||
          new Date()
            .getFullYear()
      ),

    company_id:
      body
        ?.company_id ||
      null,

    branch_id:
      body
        ?.branch_id ||
      null,

    department_id:
      body
        ?.department_id ||
      null,

    division_id:
      body
        ?.division_id ||
      null,

    unit_id:
      body
        ?.unit_id ||
      null,

    position_level:
      nullableText(
        body
          ?.position_level
      ),

    employment_type_id:
      body
        ?.employment_type_id ||
      null,

    employee_status_id:
      body
        ?.employee_status_id ||
      null,

    min_service_months:
      Math.max(
        Number(
          body
            ?.min_service_months ||
            0
        ),
        0
      ),

    max_service_months:
      nullableNumber(
        body
          ?.max_service_months
      ),

    min_age:
      nullableNumber(
        body?.min_age
      ),

    max_age:
      nullableNumber(
        body?.max_age
      ),

    probation_required:
      Boolean(
        body
          ?.probation_required
      ),

    quota_amount:
      Boolean(
        body
          ?.is_unlimited
      )
        ? 0
        : Math.max(
            Number(
              body
                ?.quota_amount ||
                0
            ),
            0
          ),

    quota_unit:
      nullableText(
        body
          ?.quota_unit
      ) ||
      "amount",

    quota_frequency:
      nullableText(
        body
          ?.quota_frequency
      ) ||
      "yearly",

    is_unlimited:
      Boolean(
        body
          ?.is_unlimited
      ),

    priority:
      Math.max(
        Number(
          body
            ?.priority ||
            100
        ),
        1
      ),

    is_active:
      body
        ?.is_active !==
      false,

    updated_at:
      new Date()
        .toISOString(),
  };
}

function validatePayload(
  payload
) {
  if (
    !payload
      .benefit_id
  ) {
    return "กรุณาเลือกแผนสวัสดิการ";
  }

  if (
    !payload
      .policy_code
  ) {
    return "กรุณากรอก Policy Code";
  }

  if (
    !payload
      .policy_name
  ) {
    return "กรุณากรอกชื่อ Policy";
  }

  if (
    !Number.isInteger(
      payload
        .rule_year
    ) ||
    payload
      .rule_year <
      2000 ||
    payload
      .rule_year >
      2100
  ) {
    return "ปีที่ใช้ Rule ไม่ถูกต้อง";
  }

  if (
    payload
      .max_service_months !==
      null &&
    payload
      .max_service_months <
      payload
        .min_service_months
  ) {
    return "อายุงานสูงสุดต้องไม่น้อยกว่าอายุงานขั้นต่ำ";
  }

  if (
    payload
      .max_age !==
      null &&
    payload
      .min_age !==
      null &&
    payload
      .max_age <
      payload
        .min_age
  ) {
    return "อายุสูงสุดต้องไม่น้อยกว่าอายุขั้นต่ำ";
  }

  return null;
}

async function writeBenefitAudit({
  req,
  guard,
  actionType,
  refId,
  description,
  oldData = null,
  newData = null,
}) {
  try {
    await supabaseAdmin
      .from(
        "benefit_audit_logs"
      )
      .insert({
        module_name:
          "policy_rule",

        action_type:
          actionType,

        ref_table:
          "benefit_policy_rules",

        ref_id:
          refId ||
          null,

        description,

        old_data:
          oldData,

        new_data:
          newData,

        created_by:
          guard
            ?.access
            ?.id ||
          null,

        created_by_name:
          guard
            ?.access
            ?.username ||
          null,

        ip_address:
          req.headers.get(
            "x-forwarded-for"
          ) ||
          req.headers.get(
            "x-real-ip"
          ) ||
          null,

        user_agent:
          req.headers.get(
            "user-agent"
          ) ||
          null,
      });
  } catch (
    error
  ) {
    console.error(
      "BENEFIT_POLICY_AUDIT_ERROR:",
      error
    );
  }
}

async function loadMasters() {
  const [
    benefitsResult,
    companiesResult,
    branchesResult,
    departmentsResult,
    divisionsResult,
    unitsResult,
    levelsResult,
    employmentTypesResult,
    employeeStatusesResult,
  ] =
    await Promise.all([
      supabaseAdmin
        .from(
          "benefits"
        )
        .select(
          "id, benefit_code, benefit_name, is_active"
        )
        .eq(
          "is_active",
          true
        )
        .order(
          "benefit_name",
          {
            ascending:
              true,
          }
        ),

      supabaseAdmin
        .from(
          "companies"
        )
        .select(
          "id, company_code, company_name_th, company_name_en, status"
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "company_code",
          {
            ascending:
              true,
          }
        ),

      supabaseAdmin
        .from(
          "branches"
        )
        .select(
          "id, company_id, branch_code, branch_name, status"
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "branch_code",
          {
            ascending:
              true,
          }
        ),

      supabaseAdmin
        .from(
          "departments"
        )
        .select(
          "id, department_code, department_name, status"
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "department_code",
          {
            ascending:
              true,
          }
        ),

      supabaseAdmin
        .from(
          "divisions"
        )
        .select(
          "id, department_id, division_code, division_name, status"
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "division_code",
          {
            ascending:
              true,
          }
        ),

      supabaseAdmin
        .from(
          "units"
        )
        .select(
          "id, division_id, unit_code, unit_name, status"
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "unit_code",
          {
            ascending:
              true,
          }
        ),

      supabaseAdmin
        .from(
          "position_levels"
        )
        .select(
          "id, level_code, level_name, status, sort_order"
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        ),

      supabaseAdmin
        .from(
          "employment_types"
        )
        .select(
          "id, type_code, type_name, status"
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "type_name",
          {
            ascending:
              true,
          }
        ),

      supabaseAdmin
        .from(
          "employee_statuses"
        )
        .select(
          "id, status_code, status_name, status"
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "status_name",
          {
            ascending:
              true,
          }
        ),
    ]);

  const results = [
    benefitsResult,
    companiesResult,
    branchesResult,
    departmentsResult,
    divisionsResult,
    unitsResult,
    levelsResult,
    employmentTypesResult,
    employeeStatusesResult,
  ];

  const errorResult =
    results.find(
      (item) =>
        item?.error
    );

  if (
    errorResult?.error
  ) {
    throw errorResult.error;
  }

  return {
    benefits:
      benefitsResult
        .data ||
      [],

    companies:
      companiesResult
        .data ||
      [],

    branches:
      branchesResult
        .data ||
      [],

    departments:
      departmentsResult
        .data ||
      [],

    divisions:
      divisionsResult
        .data ||
      [],

    units:
      unitsResult
        .data ||
      [],

    positionLevels:
      levelsResult
        .data ||
      [],

    employmentTypes:
      employmentTypesResult
        .data ||
      [],

    employeeStatuses:
      employeeStatusesResult
        .data ||
      [],
  };
}

function buildLookupMap(
  rows,
  labelBuilder
) {
  return new Map(
    (
      rows || []
    ).map(
      (item) => [
        String(
          item.id
        ),
        labelBuilder(
          item
        ),
      ]
    )
  );
}

function enrichRows(
  rows,
  masters
) {
  const benefitMap =
    new Map(
      (
        masters
          .benefits ||
        []
      ).map(
        (item) => [
          String(
            item.id
          ),
          item,
        ]
      )
    );

  const companyMap =
    buildLookupMap(
      masters.companies,
      (item) =>
        item.company_code
          ? `${item.company_code} - ${
              item.company_name_th ||
              item.company_name_en ||
              "-"
            }`
          : item.company_name_th ||
            item.company_name_en ||
            "-"
    );

  const branchMap =
    buildLookupMap(
      masters.branches,
      (item) =>
        item.branch_code
          ? `${item.branch_code} - ${
              item.branch_name ||
              "-"
            }`
          : item.branch_name ||
            "-"
    );

  const departmentMap =
    buildLookupMap(
      masters.departments,
      (item) =>
        item.department_code
          ? `${item.department_code} - ${
              item.department_name ||
              "-"
            }`
          : item.department_name ||
            "-"
    );

  const divisionMap =
    buildLookupMap(
      masters.divisions,
      (item) =>
        item.division_code
          ? `${item.division_code} - ${
              item.division_name ||
              "-"
            }`
          : item.division_name ||
            "-"
    );

  const unitMap =
    buildLookupMap(
      masters.units,
      (item) =>
        item.unit_code
          ? `${item.unit_code} - ${
              item.unit_name ||
              "-"
            }`
          : item.unit_name ||
            "-"
    );

  const employmentTypeMap =
    buildLookupMap(
      masters.employmentTypes,
      (item) =>
        item.type_code
          ? `${item.type_code} - ${
              item.type_name ||
              "-"
            }`
          : item.type_name ||
            "-"
    );

  const employeeStatusMap =
    buildLookupMap(
      masters.employeeStatuses,
      (item) =>
        item.status_code
          ? `${item.status_code} - ${
              item.status_name ||
              "-"
            }`
          : item.status_name ||
            "-"
    );

  return (
    rows || []
  ).map(
    (item) => {
      const benefit =
        benefitMap.get(
          String(
            item
              .benefit_id ||
              ""
          )
        );

      return {
        ...item,

        benefit_code:
          benefit
            ?.benefit_code ||
          null,

        benefit_name:
          benefit
            ?.benefit_name ||
          null,

        company_name:
          item
            .company_id
            ? companyMap.get(
                String(
                  item
                    .company_id
                )
              ) ||
              null
            : null,

        branch_name:
          item
            .branch_id
            ? branchMap.get(
                String(
                  item
                    .branch_id
                )
              ) ||
              null
            : null,

        department_name:
          item
            .department_id
            ? departmentMap.get(
                String(
                  item
                    .department_id
                )
              ) ||
              null
            : null,

        division_name:
          item
            .division_id
            ? divisionMap.get(
                String(
                  item
                    .division_id
                )
              ) ||
              null
            : null,

        unit_name:
          item
            .unit_id
            ? unitMap.get(
                String(
                  item
                    .unit_id
                )
              ) ||
              null
            : null,

        employment_type_name:
          item
            .employment_type_id
            ? employmentTypeMap.get(
                String(
                  item
                    .employment_type_id
                )
              ) ||
              null
            : null,

        employee_status_name:
          item
            .employee_status_id
            ? employeeStatusMap.get(
                String(
                  item
                    .employee_status_id
                )
              ) ||
              null
            : null,
      };
    }
  );
}

async function ensurePolicyCodeUnique({
  policyCode,
  excludeId = null,
}) {
  let query =
    supabaseAdmin
      .from(
        "benefit_policy_rules"
      )
      .select("id")
      .ilike(
        "policy_code",
        policyCode
      )
      .limit(1);

  if (
    excludeId
  ) {
    query =
      query.neq(
        "id",
        excludeId
      );
  }

  const {
    data,
    error,
  } =
    await query;

  if (error) {
    throw error;
  }

  return !(
    data ||
    []
  ).length;
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        MODULE,
        "view"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      searchParams,
    } =
      new URL(
        req.url
      );

    const page =
      Math.max(
        Number(
          searchParams.get(
            "page"
          )
        ) || 1,
        1
      );

    const pageSize =
      Math.min(
        Math.max(
          Number(
            searchParams.get(
              "pageSize"
            )
          ) || 20,
          1
        ),
        100
      );

    const search =
      cleanText(
        searchParams.get(
          "search"
        )
      );

    const year =
      cleanText(
        searchParams.get(
          "year"
        )
      );

    const benefitId =
      cleanText(
        searchParams.get(
          "benefit_id"
        )
      );

    const activeParam =
      searchParams.get(
        "active"
      );

    const masters =
      await loadMasters();

    let baseQuery =
      supabaseAdmin
        .from(
          "benefit_policy_rules"
        )
        .select(
          `
            id,
            benefit_id,
            policy_name,
            policy_code,
            rule_year,
            company_id,
            branch_id,
            department_id,
            division_id,
            unit_id,
            position_level,
            employment_type_id,
            employee_status_id,
            min_service_months,
            max_service_months,
            min_age,
            max_age,
            probation_required,
            quota_amount,
            quota_unit,
            quota_frequency,
            is_unlimited,
            priority,
            is_active,
            created_at,
            updated_at
          `,
          {
            count:
              "exact",
          }
        );

    if (search) {
      const safeSearch =
        search.replace(
          /[%_,]/g,
          " "
        );

      baseQuery =
        baseQuery.or(
          `policy_code.ilike.%${safeSearch}%,policy_name.ilike.%${safeSearch}%`
        );
    }

    if (year) {
      baseQuery =
        baseQuery.eq(
          "rule_year",
          Number(year)
        );
    }

    if (
      benefitId
    ) {
      baseQuery =
        baseQuery.eq(
          "benefit_id",
          benefitId
        );
    }

    if (
      activeParam ===
        "true" ||
      activeParam ===
        "false"
    ) {
      baseQuery =
        baseQuery.eq(
          "is_active",
          activeParam ===
            "true"
        );
    }

    const from =
      (page - 1) *
      pageSize;

    const to =
      from +
      pageSize -
      1;

    const {
      data,
      error,
      count,
    } =
      await baseQuery
        .order(
          "priority",
          {
            ascending:
              true,
          }
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .range(
          from,
          to
        );

    if (error) {
      throw error;
    }

    const [
      totalResult,
      activeResult,
      unlimitedResult,
    ] =
      await Promise.all([
        supabaseAdmin
          .from(
            "benefit_policy_rules"
          )
          .select(
            "id",
            {
              count:
                "exact",
              head:
                true,
            }
          ),

        supabaseAdmin
          .from(
            "benefit_policy_rules"
          )
          .select(
            "id",
            {
              count:
                "exact",
              head:
                true,
            }
          )
          .eq(
            "is_active",
            true
          ),

        supabaseAdmin
          .from(
            "benefit_policy_rules"
          )
          .select(
            "id",
            {
              count:
                "exact",
              head:
                true,
            }
          )
          .eq(
            "is_unlimited",
            true
          ),
      ]);

    const totalAll =
      Number(
        totalResult
          .count ||
          0
      );

    const activeAll =
      Number(
        activeResult
          .count ||
          0
      );

    const rows =
      enrichRows(
        data,
        masters
      );

    return NextResponse.json({
      success:
        true,

      data:
        rows,

      masters,

      summary: {
        total:
          totalAll,

        active:
          activeAll,

        inactive:
          Math.max(
            totalAll -
              activeAll,
            0
          ),

        unlimited:
          Number(
            unlimitedResult
              .count ||
              0
          ),
      },

      pagination: {
        page,
        pageSize,

        total:
          Number(
            count ||
              0
          ),

        totalPages:
          Math.max(
            Math.ceil(
              Number(
                count ||
                  0
              ) /
                pageSize
            ),
            1
          ),
      },
    });
  } catch (
    error
  ) {
    console.error(
      "GET_BENEFIT_POLICY_RULES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error?.message ||
          "ไม่สามารถโหลดกฎเกณฑ์สวัสดิการได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        MODULE,
        "create"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const body =
      await req.json();

    const payload =
      buildPayload(
        body
      );

    const validationError =
      validatePayload(
        payload
      );

    if (
      validationError
    ) {
      return NextResponse.json(
        {
          success:
            false,
          error:
            validationError,
        },
        {
          status: 400,
        }
      );
    }

    const unique =
      await ensurePolicyCodeUnique({
        policyCode:
          payload
            .policy_code,
      });

    if (!unique) {
      return NextResponse.json(
        {
          success:
            false,
          error:
            "Policy Code นี้มีอยู่แล้ว",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "benefit_policy_rules"
        )
        .insert(
          payload
        )
        .select()
        .single();

    if (error) {
      throw error;
    }

    await writeBenefitAudit({
      req,
      guard,
      actionType:
        "create",
      refId:
        data.id,
      description:
        `เพิ่ม Benefit Policy Rule ${data.policy_code}`,
      newData:
        data,
    });

    return NextResponse.json(
      {
        success:
          true,

        message:
          "เพิ่มกฎเกณฑ์สวัสดิการเรียบร้อยแล้ว",

        data,
      },
      {
        status: 201,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "POST_BENEFIT_POLICY_RULE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error?.message ||
          "ไม่สามารถเพิ่มกฎเกณฑ์สวัสดิการได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH
========================================================= */

export async function PATCH(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        MODULE,
        "edit"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const body =
      await req.json();

    const id =
      cleanText(
        body?.id
      );

    if (!id) {
      return NextResponse.json(
        {
          success:
            false,
          error:
            "ไม่พบ id ของ Policy",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data:
        oldData,
      error:
        oldError,
    } =
      await supabaseAdmin
        .from(
          "benefit_policy_rules"
        )
        .select("*")
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (oldError) {
      throw oldError;
    }

    if (!oldData) {
      return NextResponse.json(
        {
          success:
            false,
          error:
            "ไม่พบ Policy ที่ต้องการแก้ไข",
        },
        {
          status: 404,
        }
      );
    }

    const payload =
      buildPayload(
        body
      );

    const validationError =
      validatePayload(
        payload
      );

    if (
      validationError
    ) {
      return NextResponse.json(
        {
          success:
            false,
          error:
            validationError,
        },
        {
          status: 400,
        }
      );
    }

    const unique =
      await ensurePolicyCodeUnique({
        policyCode:
          payload
            .policy_code,
        excludeId:
          id,
      });

    if (!unique) {
      return NextResponse.json(
        {
          success:
            false,
          error:
            "Policy Code นี้มีอยู่แล้ว",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "benefit_policy_rules"
        )
        .update(
          payload
        )
        .eq(
          "id",
          id
        )
        .select()
        .single();

    if (error) {
      throw error;
    }

    await writeBenefitAudit({
      req,
      guard,
      actionType:
        "update",
      refId:
        id,
      description:
        `แก้ไข Benefit Policy Rule ${data.policy_code}`,
      oldData,
      newData:
        data,
    });

    return NextResponse.json({
      success:
        true,

      message:
        "แก้ไขกฎเกณฑ์สวัสดิการเรียบร้อยแล้ว",

      data,
    });
  } catch (
    error
  ) {
    console.error(
      "PATCH_BENEFIT_POLICY_RULE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error?.message ||
          "ไม่สามารถแก้ไขกฎเกณฑ์สวัสดิการได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        MODULE,
        "delete"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      searchParams,
    } =
      new URL(
        req.url
      );

    const id =
      cleanText(
        searchParams.get(
          "id"
        )
      );

    if (!id) {
      return NextResponse.json(
        {
          success:
            false,
          error:
            "ไม่พบ id ของ Policy",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data:
        oldData,
      error:
        oldError,
    } =
      await supabaseAdmin
        .from(
          "benefit_policy_rules"
        )
        .select("*")
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (oldError) {
      throw oldError;
    }

    if (!oldData) {
      return NextResponse.json(
        {
          success:
            false,
          error:
            "ไม่พบ Policy ที่ต้องการลบ",
        },
        {
          status: 404,
        }
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "benefit_policy_rules"
        )
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      throw error;
    }

    await writeBenefitAudit({
      req,
      guard,
      actionType:
        "delete",
      refId:
        id,
      description:
        `ลบ Benefit Policy Rule ${oldData.policy_code}`,
      oldData,
    });

    return NextResponse.json({
      success:
        true,

      message:
        "ลบกฎเกณฑ์สวัสดิการเรียบร้อยแล้ว",
    });
  } catch (
    error
  ) {
    console.error(
      "DELETE_BENEFIT_POLICY_RULE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error?.message ||
          "ไม่สามารถลบกฎเกณฑ์สวัสดิการได้",
      },
      {
        status: 500,
      }
    );
  }
}
