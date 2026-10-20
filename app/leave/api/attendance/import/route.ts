import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

interface ImportRow {
  sourceEmployeeCode: string;
  workDate: string;
  checkIn?: string;
  checkOut?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fileName = String(body.fileName || "");
    const rows = Array.isArray(body.rows) ? (body.rows as ImportRow[]) : [];

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลสำหรับนำเข้า",
        },
        { status: 400 },
      );
    }

    const sourceCodes = [
      ...new Set(
        rows
          .map((row) => String(row.sourceEmployeeCode || "").trim())
          .filter(Boolean),
      ),
    ];

    /*
     * ระยะแรกใช้ employee_code ใหม่เพื่อทดสอบเท่านั้น
     * เพราะเรายังไม่รู้ว่ารหัสเก่าจะอยู่ field ไหนใน employees
     */
    const { data: employees, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id, employee_code")
      .in("employee_code", sourceCodes);

    if (employeeError) throw employeeError;

    const employeeMap = new Map(
      (employees || []).map((employee) => [employee.employee_code, employee]),
    );

    const { data: batch, error: batchError } = await supabaseAdmin
      .from("leave_attendance_import_batches")
      .insert({
        file_name: fileName || null,
        total_rows: rows.length,
        status: "importing",
      })
      .select("id")
      .single();

    if (batchError || !batch) {
      throw batchError || new Error("สร้าง Import batch ไม่สำเร็จ");
    }

    const importRows = rows.map((row) => {
      const sourceCode = String(row.sourceEmployeeCode || "").trim();

      const employee = employeeMap.get(sourceCode);

      return {
        import_batch_id: batch.id,
        external_employee_code: sourceCode,
        employee_id: employee?.id || null,
        employee_code: employee?.employee_code || null,
        work_date: row.workDate,
        check_in: row.checkIn || null,
        check_out: row.checkOut || null,
        match_status: employee ? "matched" : "unmatched",
        error_message: employee ? null : "ยังไม่พบรหัสพนักงานในระบบ",
      };
    });

    const { error: importError } = await supabaseAdmin
      .from("leave_attendance_import_rows")
      .upsert(importRows, {
        onConflict: "external_employee_code,work_date,check_in,check_out",
      });

    if (importError) {
      throw importError;
    }

    const matchedRows = importRows.filter(
      (row) => row.match_status === "matched",
    );

    const unmatchedCount = importRows.length - matchedRows.length;

    await supabaseAdmin
      .from("leave_attendance_import_batches")
      .update({
        matched_rows: matchedRows.length,
        unmatched_rows: unmatchedCount,
        status: "completed",
      })
      .eq("id", batch.id);

    if (matchedRows.length > 0) {
      const records = matchedRows.map((row) => ({
        employee_id: row.employee_id,
        employee_code: row.employee_code,
        work_date: row.work_date,
        check_in: row.check_in,
        check_out: row.check_out,
        source: "fingerprint",
      }));

      const { error: recordError } = await supabaseAdmin
        .from("leave_attendance_records")
        .upsert(records, {
          onConflict: "employee_id,work_date",
        });

      if (recordError) throw recordError;
    }

    return NextResponse.json({
      success: true,
      totalRows: importRows.length,
      matchedRows: matchedRows.length,
      unmatchedRows: unmatchedCount,
      batchId: batch.id,
    });
  } catch (error: any) {
    console.error("Attendance import failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "นำเข้าข้อมูลไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}
