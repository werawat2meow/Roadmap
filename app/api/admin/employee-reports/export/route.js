import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const branchSummary = {};
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



    const workbook =
      XLSX.utils.book_new();

    const worksheet =
      XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Employees"
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