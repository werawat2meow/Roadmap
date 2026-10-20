import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";

const MAX_PAGE_SIZE = 100;

function getUniqueIds(rows, field) {
  return [...new Set(rows.map((row) => row[field]).filter(Boolean))];
}

function createLookup(rows) {
  return new Map((rows || []).map((row) => [String(row.id), row]));
}

async function getMasterData(table, columns, ids) {
  if (ids.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from(table)
    .select(columns)
    .in("id", ids);

  if (error) throw error;
  return data || [];
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(Number.parseInt(searchParams.get("page") || "1", 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number.parseInt(searchParams.get("pageSize") || "20", 10) || 20, 1),
      MAX_PAGE_SIZE
    );
    const keyword = (searchParams.get("keyword") || "").trim();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("recruit_job_applications")
      .select(
        `
          id,
          emp_code,
          title_id,
          first_name,
          last_name,
          position_id,
          position_level_id,
          company_id,
          branch_id,
          department_id,
          division_id,
          unit_id,
          user_approve,
          hire_date,
          contract_number,
          contract_signer_id,
          employer_signature_type
        `,
        { count: "exact" }
      )
      .eq("status", 15);

    if (keyword) {
      const safeKeyword = keyword.replace(/[,%()]/g, " ").trim();
      if (safeKeyword) {
        query = query.or(
          `emp_code.ilike.%${safeKeyword}%,first_name.ilike.%${safeKeyword}%,last_name.ilike.%${safeKeyword}%`
        );
      }
    }

    const { data: applications, count, error } = await query
      .order("hire_date", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const rows = applications || [];
    const [titles, positions, positionLevels, companies, branches, departments, divisions, units, approverAccounts] =
      await Promise.all([
        getMasterData("titles", "id, title_name_th", getUniqueIds(rows, "title_id")),
        getMasterData("positions", "id, position_name", getUniqueIds(rows, "position_id")),
        getMasterData(
          "position_levels",
          "id, level_code, level_name",
          getUniqueIds(rows, "position_level_id")
        ),
        getMasterData("companies", "id, company_name_th", getUniqueIds(rows, "company_id")),
        getMasterData("branches", "id, branch_name", getUniqueIds(rows, "branch_id")),
        getMasterData("departments", "id, department_name", getUniqueIds(rows, "department_id")),
        getMasterData("divisions", "id, division_name", getUniqueIds(rows, "division_id")),
        getMasterData("units", "id, unit_name", getUniqueIds(rows, "unit_id")),
        getMasterData(
          "user_accounts",
          "id, employee_id",
          getUniqueIds(rows, "user_approve")
        ),
      ]);

    const approverEmployees = await getMasterData(
      "employees",
      "id, first_name_th, last_name_th",
      getUniqueIds(approverAccounts, "employee_id")
    );

    const lookups = {
      titles: createLookup(titles),
      positions: createLookup(positions),
      positionLevels: createLookup(positionLevels),
      companies: createLookup(companies),
      branches: createLookup(branches),
      departments: createLookup(departments),
      divisions: createLookup(divisions),
      units: createLookup(units),
      approverAccounts: createLookup(approverAccounts),
      approverEmployees: createLookup(approverEmployees),
    };

    const result = rows.map((row) => {
      const title = lookups.titles.get(String(row.title_id));
      const position = lookups.positions.get(String(row.position_id));
      const positionLevel = lookups.positionLevels.get(String(row.position_level_id));
      const approverAccount = lookups.approverAccounts.get(String(row.user_approve));
      const approver = approverAccount
        ? lookups.approverEmployees.get(String(approverAccount.employee_id))
        : null;

      return {
        id: row.id,
        emp_code: row.emp_code,
        employee_name: [title?.title_name_th, row.first_name, row.last_name]
          .filter(Boolean)
          .join(" "),
        position_name: position?.position_name || null,
        position_level_code: positionLevel?.level_code || null,
        position_level_name: positionLevel?.level_name || null,
        company_name: lookups.companies.get(String(row.company_id))?.company_name_th || null,
        branch_name: lookups.branches.get(String(row.branch_id))?.branch_name || null,
        department_name:
          lookups.departments.get(String(row.department_id))?.department_name || null,
        division_name: lookups.divisions.get(String(row.division_id))?.division_name || null,
        unit_name: lookups.units.get(String(row.unit_id))?.unit_name || null,
        approver_name: approver
          ? [approver.first_name_th, approver.last_name_th].filter(Boolean).join(" ")
          : null,
        hire_date: row.hire_date,
        contract_number: row.contract_number,
        contract_signer_id: row.contract_signer_id,
        employer_signature_type: row.employer_signature_type,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Approved employee report error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "ไม่สามารถดึงข้อมูลรายงานได้" },
      { status: 500 }
    );
  }
}
