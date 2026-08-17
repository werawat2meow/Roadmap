import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
<<<<<<< HEAD

const calculateServiceYears = (hireDate) => {
  if (!hireDate) return 0;

  return Number(
    ((new Date() - new Date(hireDate)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)
  );
};

const textIncludes = (value, keyword) => String(value || "").toLowerCase().includes(keyword.toLowerCase());

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const branch = searchParams.get("branch_id")?.trim() || "";
    const department = searchParams.get("department_id")?.trim() || "";
    const division = searchParams.get("division_id")?.trim() || "";
    const unit = searchParams.get("unit_id")?.trim() || "";
    const employmentType = searchParams.get("employmentType")?.trim() || "";
    const gender = searchParams.get("gender")?.trim() || "";
    const nationality = searchParams.get("nationality")?.trim() || "";
    const positionLevel = searchParams.get("positionLevel")?.trim() || "";
    const hireDateFrom = searchParams.get("hireDateFrom")?.trim() || "";
    const hireDateTo = searchParams.get("hireDateTo")?.trim() || "";
    const resignationDateFrom =
      searchParams.get("resignationDateFrom")?.trim() || "";
    const resignationDateTo =
      searchParams.get("resignationDateTo")?.trim() || "";

    const { data, error } = await supabaseAdmin
      .from("employees")
      .select(`
        employee_code,
        first_name_th,
        last_name_th,
        first_name_en,
        last_name_en,
        nick_name,
        gender,
        phone,
        email,
=======
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const EMPLOYEE_REPORT_EXPORT_SELECT = `
        id,
        employee_code,

        first_name_th,
        middle_name_th,
        last_name_th,

        first_name_en,
        middle_name_en,
        last_name_en,

        nick_name,
        nickname_th,
        nickname_en,

        phone,
        mobile_phone,
        work_phone,

        email,
        personal_email,
        work_email,

>>>>>>> test_merge_all
        citizen_id,
        passport_no,
        birth_date,
        line_id,
<<<<<<< HEAD
        nationality,
        hire_date,
        resignation_date,
        employment_type,
        employee_type_digit,
        employee_year_2d,
        employee_running_no,
        branches (
          branch_name
        ),
        departments (
          department_name
        ),
        divisions (
          division_name
        ),
        units (
          unit_name
        ),
        positions (
          position_name,
          position_level,
          position_group
        ),
        employee_statuses (
          status_code,
          status_name
        )
      `)
      .order("employee_code");

    if (error) throw error;

    let filteredData = data || [];

    if (search) {
      filteredData = filteredData.filter(
        (item) =>
          textIncludes(item.employee_code, search) ||
          textIncludes(item.first_name_th, search) ||
          textIncludes(item.last_name_th, search) ||
          textIncludes(item.first_name_en, search) ||
          textIncludes(item.last_name_en, search) ||
          textIncludes(item.nick_name, search) ||
          textIncludes(item.phone, search) ||
          textIncludes(item.email, search) ||
          textIncludes(item.line_id, search) ||
          textIncludes(item.employment_type, search) ||
=======

        hire_date,
        start_work_date,
        resignation_date,

        branch_id,
        department_id,
        division_id,
        unit_id,

        employment_type_id,
        gender_id,
        nationality_id,
        position_level_id,
        position_id,
        employee_status_id,

        branches:branches!employees_branch_id_fkey (
          id,
          branch_code,
          branch_name
        ),

        departments:departments!employees_department_id_fkey (
          id,
          department_code,
          department_name
        ),

        divisions:divisions!employees_division_id_fkey (
          id,
          division_code,
          division_name
        ),

        units:units!employees_unit_id_fkey (
          id,
          unit_code,
          unit_name
        ),

        employment_types:employment_types!employees_employment_type_id_fkey (
          id,
          type_code,
          type_name
        ),

        genders:genders!employees_gender_id_fkey (
          id,
          gender_code,
          gender_name_th,
          gender_name_en
        ),

        nationalities:nationalities!employees_nationality_id_fkey (
          id,
          nationality_code,
          nationality_name_th,
          nationality_name_en
        ),

        position_levels:position_levels!employees_position_level_id_fkey (
          id,
          level_code,
          level_name
        ),

        positions:positions!employees_position_id_fkey (
          id,
          position_code,
          position_name
        ),

        employee_statuses:employee_statuses!employees_employee_status_id_fkey (
          id,
          status_code,
          status_name
        )
      `;

function getCurrentEmployeeId(guard) {
  const access = guard?.access || {};

  return (
    access?.employee_id ||
    access?.user?.employee_id ||
    access?.user_account?.employee_id ||
    guard?.user?.employee_id ||
    null
  );
}


const getStartWorkDate = (item) =>
  item?.start_work_date || item?.hire_date || "";

const getGenderName = (item) =>
  item?.genders?.gender_name_th ||
  item?.genders?.gender_name_en ||
  "";

const getNationalityName = (item) =>
  item?.nationalities?.nationality_name_th ||
  item?.nationalities?.nationality_name_en ||
  "";

const getEmploymentTypeName = (item) =>
  item?.employment_types?.type_name || "";

const getPositionLevel = (item) =>
  item?.position_levels?.level_code || "";

const calculateServiceYears = (startWorkDate) => {
  if (!startWorkDate) return 0;

  return Number(
    (
      (new Date() - new Date(startWorkDate)) /
      (1000 * 60 * 60 * 24 * 365)
    ).toFixed(1)
  );
};

const textIncludes = (value, keyword) =>
  String(value || "")
    .toLowerCase()
    .includes(String(keyword || "").toLowerCase());

export async function GET(req) {
  try {
    /* =========================================================
       PERMISSION + EMPLOYEE SCOPE
    ========================================================= */
    const guard = await requireScopedAccess(
      "ems.employee_reports",
      "export",
      {
        lineageScope: true,
      }
    );

    if (!guard.ok) {
      return guard.response;
    }

    const { searchParams } = new URL(req.url);

    /* =========================================================
       FILTERS
       ต้องใช้ชื่อเดียวกับ page.jsx buildQueryString()
    ========================================================= */
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const branch = searchParams.get("branch_id")?.trim() || "";
    const department = searchParams.get("department_id")?.trim() || "";
    const division = searchParams.get("division_id")?.trim() || "";
    const unit = searchParams.get("unit_id")?.trim() || "";

    const employmentType =
      searchParams.get("employment_type")?.trim() ||
      searchParams.get("employmentType")?.trim() ||
      "";

    const gender = searchParams.get("gender")?.trim() || "";
    const nationality = searchParams.get("nationality")?.trim() || "";

    const positionLevel =
      searchParams.get("position_level")?.trim() ||
      searchParams.get("positionLevel")?.trim() ||
      "";

    const startWorkDateFrom =
      searchParams.get("start_work_date_from")?.trim() ||
      searchParams.get("hireDateFrom")?.trim() ||
      "";

    const startWorkDateTo =
      searchParams.get("start_work_date_to")?.trim() ||
      searchParams.get("hireDateTo")?.trim() ||
      "";

    const resignationDateFrom =
      searchParams.get("resignation_date_from")?.trim() ||
      searchParams.get("resignationDateFrom")?.trim() ||
      "";

    const resignationDateTo =
      searchParams.get("resignation_date_to")?.trim() ||
      searchParams.get("resignationDateTo")?.trim() ||
      "";

    /* =========================================================
       LOAD ALL EMPLOYEES INSIDE ACCESS SCOPE
       Export ไม่ใช้ pagination ของหน้า
    ========================================================= */
    let query = supabaseAdmin
      .from("employees")
      .select(
        EMPLOYEE_REPORT_EXPORT_SELECT
      )
      .order("employee_code", {
        ascending: true,
      });

    /* Scope ต้องมาก่อน execute */
    query = guard.applyEmployeeScope(query);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const currentEmployeeId =
      getCurrentEmployeeId(guard);

    /*
     * Export ต้องใช้กฎเดียวกับ Employee List / Report:
     *
     * SELF + SCOPE
     *
     * Scope Query ด้านบนอาจไม่มีตัวเองอยู่ใน Scope
     * จึงโหลด Current Employee แยกแล้ว merge แบบ unique
     * ก่อนใช้ Filter และสร้าง Excel
     */
    let selfEmployee = null;

    if (currentEmployeeId) {
      const {
        data: selfData,
        error: selfError,
      } = await supabaseAdmin
        .from("employees")
        .select(
          EMPLOYEE_REPORT_EXPORT_SELECT
        )
        .eq(
          "id",
          currentEmployeeId
        )
        .maybeSingle();

      if (selfError) {
        throw selfError;
      }

      selfEmployee =
        selfData || null;
    }

    const mergedMap =
      new Map();

    if (selfEmployee?.id) {
      mergedMap.set(
        String(selfEmployee.id),
        selfEmployee
      );
    }

    for (
      const item of
      Array.isArray(data)
        ? data
        : []
    ) {
      if (!item?.id) {
        continue;
      }

      mergedMap.set(
        String(item.id),
        item
      );
    }

    let filteredData =
      Array.from(
        mergedMap.values()
      );

    /* =========================================================
       APPLY FILTERS EXACTLY AS SELECTED ON PAGE
    ========================================================= */
    if (search) {
      filteredData = filteredData.filter((item) => {
        const fullNameTh = [
          item.first_name_th,
          item.middle_name_th,
          item.last_name_th,
        ]
          .filter(Boolean)
          .join(" ");

        const fullNameEn = [
          item.first_name_en,
          item.middle_name_en,
          item.last_name_en,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          textIncludes(item.employee_code, search) ||
          textIncludes(fullNameTh, search) ||
          textIncludes(fullNameEn, search) ||
          textIncludes(item.nick_name, search) ||
          textIncludes(item.nickname_th, search) ||
          textIncludes(item.nickname_en, search) ||
          textIncludes(item.phone, search) ||
          textIncludes(item.mobile_phone, search) ||
          textIncludes(item.work_phone, search) ||
          textIncludes(item.email, search) ||
          textIncludes(item.personal_email, search) ||
          textIncludes(item.work_email, search) ||
          textIncludes(item.line_id, search) ||
          textIncludes(getEmploymentTypeName(item), search) ||
          textIncludes(getGenderName(item), search) ||
          textIncludes(getNationalityName(item), search) ||
>>>>>>> test_merge_all
          textIncludes(item.branches?.branch_name, search) ||
          textIncludes(item.departments?.department_name, search) ||
          textIncludes(item.divisions?.division_name, search) ||
          textIncludes(item.units?.unit_name, search) ||
<<<<<<< HEAD
          textIncludes(item.positions?.position_name, search)
      );
    }

    if (status) {
=======
          textIncludes(item.positions?.position_name, search) ||
          textIncludes(getPositionLevel(item), search)
        );
      });
    }

    if (status && status !== "ALL") {
>>>>>>> test_merge_all
      filteredData = filteredData.filter(
        (item) => item.employee_statuses?.status_code === status
      );
    }

    if (branch) {
      filteredData = filteredData.filter(
        (item) => item.branches?.branch_name === branch
      );
    }

    if (department) {
      filteredData = filteredData.filter(
        (item) => item.departments?.department_name === department
      );
    }

    if (division) {
      filteredData = filteredData.filter(
        (item) => item.divisions?.division_name === division
      );
    }

    if (unit) {
      filteredData = filteredData.filter(
        (item) => item.units?.unit_name === unit
      );
    }

    if (employmentType) {
      filteredData = filteredData.filter(
<<<<<<< HEAD
        (item) => item.employment_type === employmentType
=======
        (item) => getEmploymentTypeName(item) === employmentType
>>>>>>> test_merge_all
      );
    }

    if (gender) {
<<<<<<< HEAD
      filteredData = filteredData.filter((item) => item.gender === gender);
=======
      filteredData = filteredData.filter(
        (item) => getGenderName(item) === gender
      );
>>>>>>> test_merge_all
    }

    if (nationality) {
      filteredData = filteredData.filter(
<<<<<<< HEAD
        (item) => item.nationality === nationality
=======
        (item) => getNationalityName(item) === nationality
>>>>>>> test_merge_all
      );
    }

    if (positionLevel) {
      filteredData = filteredData.filter(
<<<<<<< HEAD
        (item) => item.positions?.position_level === positionLevel
      );
    }

    if (hireDateFrom) {
      filteredData = filteredData.filter(
        (item) => item.hire_date && item.hire_date >= hireDateFrom
      );
    }

    if (hireDateTo) {
      filteredData = filteredData.filter(
        (item) => item.hire_date && item.hire_date <= hireDateTo
      );
=======
        (item) => getPositionLevel(item) === positionLevel
      );
    }

    if (startWorkDateFrom) {
      filteredData = filteredData.filter((item) => {
        const date = getStartWorkDate(item);
        return date && date >= startWorkDateFrom;
      });
    }

    if (startWorkDateTo) {
      filteredData = filteredData.filter((item) => {
        const date = getStartWorkDate(item);
        return date && date <= startWorkDateTo;
      });
>>>>>>> test_merge_all
    }

    if (resignationDateFrom) {
      filteredData = filteredData.filter(
        (item) =>
<<<<<<< HEAD
          item.resignation_date && item.resignation_date >= resignationDateFrom
=======
          item.resignation_date &&
          item.resignation_date >= resignationDateFrom
>>>>>>> test_merge_all
      );
    }

    if (resignationDateTo) {
      filteredData = filteredData.filter(
        (item) =>
<<<<<<< HEAD
          item.resignation_date && item.resignation_date <= resignationDateTo
=======
          item.resignation_date &&
          item.resignation_date <= resignationDateTo
>>>>>>> test_merge_all
      );
    }

    const currentYear = new Date().getFullYear();

<<<<<<< HEAD
    const rows = filteredData.map((item) => ({
      "รหัสพนักงาน": item.employee_code || "",
      "ชื่อ (TH)": item.first_name_th || "",
      "นามสกุล (TH)": item.last_name_th || "",
      "ชื่อ (EN)": item.first_name_en || "",
      "นามสกุล (EN)": item.last_name_en || "",
      ชื่อเล่น: item.nick_name || "",
      เพศ: item.gender || "",
      สัญชาติ: item.nationality || "",
      โทรศัพท์: item.phone || "",
      Email: item.email || "",
      "Line ID": item.line_id || "",
      "เลขบัตรประชาชน": item.citizen_id || "",
      Passport: item.passport_no || "",
      วันเกิด: item.birth_date || "",
      สาขา: item.branches?.branch_name || "",
      แผนก: item.departments?.department_name || "",
      ฝ่าย: item.divisions?.division_name || "",
      หน่วยงาน: item.units?.unit_name || "",
      ตำแหน่ง: item.positions?.position_name || "",
      Level: item.positions?.position_level || "",
      "Position Group": item.positions?.position_group || "",
      "ประเภทการจ้าง": item.employment_type || "",
      "สถานะพนักงาน": item.employee_statuses?.status_name || "",
      "วันที่เริ่มงาน": item.hire_date || "",
      "วันที่ลาออก": item.resignation_date || "",
      "อายุงาน (ปี)": calculateServiceYears(item.hire_date),
    }));

    const newJoinersRows = filteredData
      .filter(
        (item) => item.hire_date && item.hire_date.startsWith(String(currentYear))
      )
      .map((item) => ({
        รหัสพนักงาน: item.employee_code,
        ชื่อ: `${item.first_name_th || ""} ${item.last_name_th || ""}`,
        วันที่เริ่มงาน: item.hire_date,
=======
    /* =========================================================
       EMPLOYEE SHEET
    ========================================================= */
    const rows = filteredData.map((item) => {
      const startWorkDate = getStartWorkDate(item);

      return {
        "รหัสพนักงาน": item.employee_code || "",
        "ชื่อ (TH)": item.first_name_th || "",
        "นามสกุล (TH)": item.last_name_th || "",
        "ชื่อ (EN)": item.first_name_en || "",
        "นามสกุล (EN)": item.last_name_en || "",
        ชื่อเล่น:
          item.nickname_th || item.nick_name || item.nickname_en || "",
        เพศ: getGenderName(item),
        สัญชาติ: getNationalityName(item),
        โทรศัพท์:
          item.mobile_phone || item.phone || item.work_phone || "",
        Email:
          item.work_email || item.email || item.personal_email || "",
        "Line ID": item.line_id || "",
        "เลขบัตรประชาชน": item.citizen_id || "",
        Passport: item.passport_no || "",
        วันเกิด: item.birth_date || "",
        สาขา: item.branches?.branch_name || "",
        แผนก: item.departments?.department_name || "",
        ฝ่าย: item.divisions?.division_name || "",
        หน่วยงาน: item.units?.unit_name || "",
        ตำแหน่ง: item.positions?.position_name || "",
        Level: getPositionLevel(item),
        "ประเภทการจ้าง": getEmploymentTypeName(item),
        "สถานะพนักงาน": item.employee_statuses?.status_name || "",
        "วันที่เริ่มงาน": startWorkDate,
        "วันที่ลาออก": item.resignation_date || "",
        "อายุงาน (ปี)": calculateServiceYears(startWorkDate),
      };
    });

    const newJoinersRows = filteredData
      .filter((item) => {
        const date = getStartWorkDate(item);
        return date && date.startsWith(String(currentYear));
      })
      .map((item) => ({
        รหัสพนักงาน: item.employee_code,
        ชื่อ: `${item.first_name_th || ""} ${item.last_name_th || ""}`.trim(),
        วันที่เริ่มงาน: getStartWorkDate(item),
>>>>>>> test_merge_all
      }));

    const resignedRows = filteredData
      .filter((item) => item.resignation_date)
      .map((item) => ({
        รหัสพนักงาน: item.employee_code,
<<<<<<< HEAD
        ชื่อ: `${item.first_name_th || ""} ${item.last_name_th || ""}`,
=======
        ชื่อ: `${item.first_name_th || ""} ${item.last_name_th || ""}`.trim(),
>>>>>>> test_merge_all
        วันที่ลาออก: item.resignation_date,
      }));

    const makeSummaryRows = (items, getName, label) => {
      const summary = {};

      items.forEach((item) => {
        const name = getName(item) || "Unknown";
        summary[name] = (summary[name] || 0) + 1;
      });

      return Object.entries(summary).map(([name, total]) => ({
        [label]: name,
        จำนวนพนักงาน: total,
      }));
    };

    const branchRows = makeSummaryRows(
      filteredData,
      (item) => item.branches?.branch_name,
      "สาขา"
    );

    const departmentRows = makeSummaryRows(
      filteredData,
      (item) => item.departments?.department_name,
      "แผนก"
    );

    const divisionRows = makeSummaryRows(
      filteredData,
      (item) => item.divisions?.division_name,
      "ฝ่าย"
    );

    const unitRows = makeSummaryRows(
      filteredData,
      (item) => item.units?.unit_name,
      "หน่วยงาน"
    );

    const levelRows = makeSummaryRows(
      filteredData,
<<<<<<< HEAD
      (item) => item.positions?.position_level || "N/A",
=======
      getPositionLevel,
>>>>>>> test_merge_all
      "Level"
    );

    const employmentTypeRows = makeSummaryRows(
      filteredData,
<<<<<<< HEAD
      (item) => item.employment_type,
=======
      getEmploymentTypeName,
>>>>>>> test_merge_all
      "ประเภทการจ้าง"
    );

    const statusRows = makeSummaryRows(
      filteredData,
      (item) => item.employee_statuses?.status_name,
      "สถานะพนักงาน"
    );

<<<<<<< HEAD
=======
    /* =========================================================
       WORKBOOK
    ========================================================= */
>>>>>>> test_merge_all
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows),
      "Employees"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(branchRows),
      "Branch Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(departmentRows),
      "Department Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(divisionRows),
      "Division Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(unitRows),
      "Unit Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(levelRows),
      "Position Levels"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(employmentTypeRows),
      "Employment Types"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(statusRows),
      "Employee Status"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(newJoinersRows),
      "New Joiners"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(resignedRows),
      "Resigned"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    await writeActivityLog({
      module_name: "employee_reports",
      action_type: "export",
      reference_table: "employees",
      description: "Export Employee Master Report Excel",
      new_data: {
        file_name: "Employee_Master_Report.xlsx",
        file_type: "xlsx",
        export_scope: searchParams.toString() ? "filtered" : "all",
        filters: Object.fromEntries(searchParams.entries()),
        total_records: filteredData.length,
        total_employee_rows: rows.length,
        total_new_joiners: newJoinersRows.length,
        total_resigned: resignedRows.length,
        total_branch_summary: branchRows.length,
        total_department_summary: departmentRows.length,
        total_division_summary: divisionRows.length,
        total_unit_summary: unitRows.length,
        total_position_level_summary: levelRows.length,
        total_employment_type_summary: employmentTypeRows.length,
        total_status_summary: statusRows.length,
      },
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
<<<<<<< HEAD
        "Content-Disposition": `attachment; filename=Employee_Master_Report.xlsx`,
      },
    });
  } catch (error) {
    console.error("EXPORT_EMPLOYEE_REPORT_ERROR:", error);
=======
        "Content-Disposition":
          'attachment; filename="Employee_Master_Report.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "EXPORT_EMPLOYEE_REPORT_ERROR:",
      error
    );
>>>>>>> test_merge_all

    return NextResponse.json(
      {
        success: false,
<<<<<<< HEAD
        error: error.message || "Export Employee Report ไม่สำเร็จ",
=======
        error:
          error?.message ||
          "Export Employee Report ไม่สำเร็จ",
>>>>>>> test_merge_all
      },
      {
        status: 500,
      }
    );
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> test_merge_all
