import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/lib/supabaseServer";


const calculateServiceYears = (hireDate) => {
  if (!hireDate) return 0;

  return Number(
    (
      (new Date() -
        new Date(hireDate)) /
      (1000 * 60 * 60 * 24 * 365)
    ).toFixed(1)
  );
};

export async function GET() {
  try {
    const branchSummary = {};
    const departmentSummary = {};
    const divisionSummary = {};
    const unitSummary = {};
    const levelSummary = {};
    const employmentTypeSummary = {};
    const statusSummary = {};
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
          status_name
        )
      `)
      .order("employee_code");

    if (error) {
      throw error;
    }

    const currentYear = new Date().getFullYear();

const newJoinersRows =
  (data || [])
    .filter(
      (item) =>
        item.hire_date &&
        item.hire_date.startsWith(
          String(currentYear)
        )
    )
    .map((item) => ({
      รหัสพนักงาน:
        item.employee_code,

      ชื่อ:
        `${item.first_name_th} ${item.last_name_th}`,

      วันที่เริ่มงาน:
        item.hire_date,
    }));


    const resignedRows =
      (data || [])
        .filter(
          (item) =>
            item.resignation_date
        )
        .map((item) => ({
          รหัสพนักงาน:
            item.employee_code,

          ชื่อ:
            `${item.first_name_th} ${item.last_name_th}`,

          วันที่ลาออก:
            item.resignation_date,
        }));


    const rows = (data || []).map((item) => ({
      "รหัสพนักงาน":
        item.employee_code || "",

      "ชื่อ (TH)":
        item.first_name_th || "",

      "นามสกุล (TH)":
        item.last_name_th || "",

      "ชื่อ (EN)":
        item.first_name_en || "",

      "นามสกุล (EN)":
        item.last_name_en || "",

      ชื่อเล่น:
        item.nick_name || "",

      เพศ:
        item.gender || "",

      สัญชาติ:
        item.nationality || "",

      โทรศัพท์:
        item.phone || "",

      Email:
        item.email || "",

      "Line ID":
        item.line_id || "",

      "เลขบัตรประชาชน":
        item.citizen_id || "",

      Passport:
        item.passport_no || "",

      "วันเกิด":
        item.birth_date || "",

      สาขา:
        item.branches?.branch_name || "",

      แผนก:
        item.departments?.department_name || "",

      ฝ่าย:
        item.divisions?.division_name || "",

      หน่วยงาน:
        item.units?.unit_name || "",

      ตำแหน่ง:
        item.positions?.position_name || "",

      Level:
        item.positions?.position_level || "",

      "Position Group":
        item.positions?.position_group || "",

      "ประเภทการจ้าง":
        item.employment_type || "",

      "สถานะพนักงาน":
        item.employee_statuses?.status_name || "",

      "วันที่เริ่มงาน":
        item.hire_date || "",

      "วันที่ลาออก":
        item.resignation_date || "",
      "อายุงาน (ปี)":
        calculateServiceYears(
          item.hire_date
        ),
    }));

    (data || []).forEach((item) => {
      const branch =
        item.branches?.branch_name || "Unknown";

      branchSummary[branch] =
        (branchSummary[branch] || 0) + 1;
    });

    const branchRows =
      Object.entries(branchSummary).map(
        ([branch, total]) => ({
          สาขา: branch,
          จำนวนพนักงาน: total,
        })
      );


    (data || []).forEach((item) => {
      const department =
        item.departments?.department_name ||
        "Unknown";

      departmentSummary[department] =
        (departmentSummary[department] || 0) + 1;
    });

    const departmentRows =
      Object.entries(departmentSummary).map(
        ([name, total]) => ({
          แผนก: name,
          จำนวนพนักงาน: total,
        })
      );

    (data || []).forEach((item) => {
      const division =
        item.divisions?.division_name ||
        "Unknown";

      divisionSummary[division] =
        (divisionSummary[division] || 0) + 1;

      const unit =
        item.units?.unit_name ||
        "Unknown";

      unitSummary[unit] =
        (unitSummary[unit] || 0) + 1;

      const level =
        item.positions?.position_level ||
        "N/A";

      levelSummary[level] =
        (levelSummary[level] || 0) + 1;

      const employmentType =
        item.employment_type ||
        "Unknown";

      employmentTypeSummary[
        employmentType
      ] =
        (
          employmentTypeSummary[
            employmentType
          ] || 0
        ) + 1;

      const status =
        item.employee_statuses
          ?.status_name ||
        "Unknown";

      statusSummary[status] =
        (statusSummary[status] || 0) + 1;
    });


    const divisionRows =
      Object.entries(
        divisionSummary
      ).map(([name, total]) => ({
        ฝ่าย: name,
        จำนวนพนักงาน: total,
      }));

    const unitRows =
      Object.entries(
        unitSummary
      ).map(([name, total]) => ({
        หน่วยงาน: name,
        จำนวนพนักงาน: total,
      }));

    const levelRows =
      Object.entries(
        levelSummary
      ).map(([name, total]) => ({
        Level: name,
        จำนวนพนักงาน: total,
      }));

    const employmentTypeRows =
      Object.entries(
        employmentTypeSummary
      ).map(([name, total]) => ({
        ประเภทการจ้าง: name,
        จำนวนพนักงาน: total,
      }));

    const statusRows =
      Object.entries(
        statusSummary
      ).map(([name, total]) => ({
        สถานะพนักงาน: name,
        จำนวนพนักงาน: total,
      }));

      
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
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

    const buffer = XLSX.write(
      workbook,
      {
        type: "buffer",
        bookType: "xlsx",
      }
    );

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "Content-Disposition":
          `attachment; filename=Employee_Master_Report.xlsx`,
      },
    });
  } catch (error) {
    console.error(
      "EXPORT_EMPLOYEE_REPORT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Export Employee Report ไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}