import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

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
        citizen_id,
        passport_no,
        birth_date,
        line_id,
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
          textIncludes(item.branches?.branch_name, search) ||
          textIncludes(item.departments?.department_name, search) ||
          textIncludes(item.divisions?.division_name, search) ||
          textIncludes(item.units?.unit_name, search) ||
          textIncludes(item.positions?.position_name, search)
      );
    }

    if (status) {
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
        (item) => item.employment_type === employmentType
      );
    }

    if (gender) {
      filteredData = filteredData.filter((item) => item.gender === gender);
    }

    if (nationality) {
      filteredData = filteredData.filter(
        (item) => item.nationality === nationality
      );
    }

    if (positionLevel) {
      filteredData = filteredData.filter(
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
    }

    if (resignationDateFrom) {
      filteredData = filteredData.filter(
        (item) =>
          item.resignation_date && item.resignation_date >= resignationDateFrom
      );
    }

    if (resignationDateTo) {
      filteredData = filteredData.filter(
        (item) =>
          item.resignation_date && item.resignation_date <= resignationDateTo
      );
    }

    const currentYear = new Date().getFullYear();

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
      }));

    const resignedRows = filteredData
      .filter((item) => item.resignation_date)
      .map((item) => ({
        รหัสพนักงาน: item.employee_code,
        ชื่อ: `${item.first_name_th || ""} ${item.last_name_th || ""}`,
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
      (item) => item.positions?.position_level || "N/A",
      "Level"
    );

    const employmentTypeRows = makeSummaryRows(
      filteredData,
      (item) => item.employment_type,
      "ประเภทการจ้าง"
    );

    const statusRows = makeSummaryRows(
      filteredData,
      (item) => item.employee_statuses?.status_name,
      "สถานะพนักงาน"
    );

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
        "Content-Disposition": `attachment; filename=Employee_Master_Report.xlsx`,
      },
    });
  } catch (error) {
    console.error("EXPORT_EMPLOYEE_REPORT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Export Employee Report ไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}