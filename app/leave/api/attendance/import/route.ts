import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { applyEmployeeScope } from "@/lib/auth/requireScopedAccess";
import {
  assessAttendanceRange,
  type AttendanceAssessment,
} from "@/lib/leave-attendance-assessment";

interface ImportRow {
  sourceEmployeeCode: string;
  workDate: string;
  checkIn?: string;
  checkOut?: string;
}
type EmployeeMatch = {
  id: string;
  employee_code: string;
  first_name_th: string | null;
  last_name_th: string | null;
};

type LegacyCode = {
  id: string;
  employee_id: string;
  legacy_code: string;
};

type ReadQuery<T> = {
  range(
    from: number,
    to: number,
  ): PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>;
};

// อ่านให้ครบ ไม่ติดจำนวนแถวสูงสุดของ Supabase
async function readAll<T>(query: ReadQuery<T>): Promise<T[]> {
  const result: T[] = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await query.range(offset, offset + pageSize - 1);

    if (error) throw new Error(error.message);

    const items = data || [];
    result.push(...items);

    if (items.length < pageSize) return result;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const auth = await requirePermission("leave.view");

    if (!auth.ok) {
      return auth.response;
    }

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

    const employeesById = new Map<string, EmployeeMatch>();
    const directCodes = new Map<string, Set<string>>();
    const legacyRows: LegacyCode[] = [];

    function addCandidate(
      map: Map<string, Set<string>>,
      code: string,
      employeeId: string,
    ) {
      const ids = map.get(code) || new Set<string>();
      ids.add(employeeId);
      map.set(code, ids);
    }

    // ค้นรหัสปัจจุบันและรหัสเก่า แบ่งอ่านทีละชุด
    for (let offset = 0; offset < sourceCodes.length; offset += 200) {
      const codes = sourceCodes.slice(offset, offset + 200);

      const [directEmployees, legacyCodes] = await Promise.all([
        readAll<EmployeeMatch>(
          supabaseAdmin
            .from("employees")
            .select("id, employee_code, first_name_th, last_name_th")
            .eq("is_deleted", false)
            .in("employee_code", codes)
            .order("id"),
        ),

        readAll<LegacyCode>(
          supabaseAdmin
            .from("employee_legacy_codes")
            .select("id, employee_id, legacy_code")
            .in("legacy_code", codes)
            .order("id"),
        ),
      ]);

      for (const employee of directEmployees) {
        employeesById.set(employee.id, employee);

        addCandidate(directCodes, employee.employee_code, employee.id);
      }

      legacyRows.push(...legacyCodes);
    }

    // อ่านพนักงานที่รหัสเก่าเชื่อมไว้
    const legacyEmployeeIds = [
      ...new Set(legacyRows.map((item) => item.employee_id)),
    ];

    for (let offset = 0; offset < legacyEmployeeIds.length; offset += 200) {
      const ids = legacyEmployeeIds.slice(offset, offset + 200);

      const linkedEmployees = await readAll<EmployeeMatch>(
        supabaseAdmin
          .from("employees")
          .select("id, employee_code, first_name_th, last_name_th")
          .eq("is_deleted", false)
          .in("id", ids)
          .order("id"),
      );

      for (const employee of linkedEmployees) {
        employeesById.set(employee.id, employee);
      }
    }

    // รวมผู้สมัครจากทั้งรหัสใหม่และรหัสเก่า
    const candidates = new Map<string, Set<string>>();

    for (const [code, ids] of directCodes) {
      for (const id of ids) {
        addCandidate(candidates, code, id);
      }
    }

    for (const legacy of legacyRows) {
      if (!employeesById.has(legacy.employee_id)) continue;

      addCandidate(candidates, legacy.legacy_code, legacy.employee_id);
    }

    // ตรวจขอบเขตพนักงานที่ผู้ใช้นำเข้าได้
    const candidateIds = [...employeesById.keys()];
    const accessibleIds = new Set<string>();

    for (let offset = 0; offset < candidateIds.length; offset += 200) {
      const ids = candidateIds.slice(offset, offset + 200);

      let query = supabaseAdmin
        .from("employees")
        .select("id")
        .eq("is_deleted", false)
        .in("id", ids);

      query = applyEmployeeScope(query, auth.access, {
        permission: "leave.view",
      });

      const accessible = await readAll<{ id: string }>(query.order("id"));

      for (const employee of accessible) {
        accessibleIds.add(employee.id);
      }
    }

    const employeeMap = new Map<string, EmployeeMatch>();
    const matchErrors = new Map<string, string>();

    for (const code of sourceCodes) {
      const ids = [...(candidates.get(code) || [])];

      if (ids.length === 0) {
        matchErrors.set(
          code,
          "ไม่พบรหัสปัจจุบันหรือรหัสเก่าที่เชื่อมกับพนักงาน",
        );
        continue;
      }

      if (ids.length > 1) {
        matchErrors.set(
          code,
          "รหัสนี้ตรงกับพนักงานหลายคน อาจซ้ำต่างบริษัทหรือแหล่งรหัส ต้องตรวจสอบก่อนนำเข้า",
        );
        continue;
      }

      const employee = employeesById.get(ids[0]);

      if (!employee || !employee.employee_code?.trim()) {
        matchErrors.set(
          code,
          "พบข้อมูลรหัสเก่า แต่พนักงานยังไม่มีรหัสปัจจุบัน",
        );
        continue;
      }

      if (!accessibleIds.has(employee.id)) {
        matchErrors.set(code, "พนักงานไม่อยู่ในขอบเขตสิทธิ์ที่นำเข้าได้");
        continue;
      }

      employeeMap.set(code, employee);
    }

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
        error_message: employee
          ? null
          : matchErrors.get(sourceCode) || "ไม่สามารถจับคู่พนักงานได้",
      };
    });

    const uniqueImportRows = [
      ...new Map(
        importRows.map((row) => [
          JSON.stringify([
            row.external_employee_code,
            row.work_date,
            row.check_in,
            row.check_out,
          ]),
          row,
        ]),
      ).values(),
    ];

    const { error: importError } = await supabaseAdmin
      .from("leave_attendance_import_rows")
      .upsert(uniqueImportRows, {
        onConflict: "external_employee_code,work_date,check_in,check_out",
      });

    if (importError) {
      throw importError;
    }

    const matchedRows = importRows.filter(
      (row) => row.match_status === "matched",
    );

    const unmatchedCount = importRows.length - matchedRows.length;

    if (matchedRows.length > 0) {
      type AttendanceRecord = {
        employee_id: string;
        employee_code: string;
        work_date: string;
        check_in: string | null;
        check_out: string | null;
        source: string;
      };

      const grouped = new Map<
        string,
        {
          employeeId: string;
          employeeCode: string;
          workDate: string;
          pairs: {
            checkIn: string | null;
            checkOut: string | null;
          }[];
        }
      >();

      function normalizeClock(value: string | null | undefined): string | null {
        if (!value) return null;

        const match = value
          .trim()
          .match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);

        if (!match) {
          throw new Error(`เวลาไม่ถูกต้อง: ${value}`);
        }

        return (
          match[1].padStart(2, "0") + ":" + match[2] + ":" + (match[3] || "00")
        );
      }

      for (const row of matchedRows) {
        if (!row.employee_id || !row.employee_code) continue;

        const key = `${row.employee_id}:${row.work_date}`;

        const group = grouped.get(key) || {
          employeeId: row.employee_id,
          employeeCode: row.employee_code,
          workDate: row.work_date,
          pairs: [],
        };

        group.pairs.push({
          checkIn: normalizeClock(row.check_in),
          checkOut: normalizeClock(row.check_out),
        });

        grouped.set(key, group);
      }

      const records: AttendanceRecord[] = [];

      for (const group of grouped.values()) {
        const checkIns = [
          ...new Set(
            group.pairs
              .map((pair) => pair.checkIn)
              .filter((value): value is string => Boolean(value)),
          ),
        ].sort();

        const checkOuts = [
          ...new Set(
            group.pairs
              .map((pair) => pair.checkOut)
              .filter((value): value is string => Boolean(value)),
          ),
        ].sort();

        const hasOvernight = group.pairs.some(
          (pair) =>
            pair.checkIn && pair.checkOut && pair.checkOut < pair.checkIn,
        );

        // ข้อมูลเวลาอย่างเดียวไม่มีวันที่เลิกงาน
        // จึงไม่เดารวมหลายคู่ของกะข้ามคืน
        if (hasOvernight && (checkIns.length > 1 || checkOuts.length > 1)) {
          throw new Error(
            `พนักงาน ${group.employeeCode} วันที่ ${group.workDate} ` +
              "มีกะข้ามคืนหลายช่วง กรุณาตรวจและรวมข้อมูลให้เหลือหนึ่งคู่ก่อนนำเข้า",
          );
        }

        records.push({
          employee_id: group.employeeId,
          employee_code: group.employeeCode,
          work_date: group.workDate,
          check_in: checkIns[0] || null,
          check_out: checkOuts[checkOuts.length - 1] || null,
          source: "fingerprint",
        });
      }

      const { error: recordError } = await supabaseAdmin
        .from("leave_attendance_records")
        .upsert(records, {
          onConflict: "employee_id,work_date",
        });

      if (recordError) throw recordError;
    }

    const { error: completeError } = await supabaseAdmin
      .from("leave_attendance_import_batches")
      .update({
        matched_rows: matchedRows.length,
        unmatched_rows: unmatchedCount,
        status: "completed",
      })
      .eq("id", batch.id);

    if (completeError) throw completeError;

    let assessments: AttendanceAssessment[] = [];
    let assessmentWarning: string | null = null;

    if (matchedRows.length > 0) {
      try {
        const employeeIds = [
          ...new Set(
            matchedRows
              .map((row) => row.employee_id)
              .filter((id): id is string => Boolean(id)),
          ),
        ];

        const importedDates = [
          ...new Set(matchedRows.map((row) => row.work_date)),
        ].sort();

        const allAssessments = await assessAttendanceRange(
          employeeIds,
          importedDates[0],
          importedDates[importedDates.length - 1],
        );

        // คืนผลเฉพาะพนักงาน/วันที่ที่อยู่ในไฟล์ครั้งนี้
        const importedKeys = new Set(
          matchedRows.map((row) => `${row.employee_id}:${row.work_date}`),
        );

        assessments = allAssessments.filter((item) =>
          importedKeys.has(`${item.employeeId}:${item.workDate}`),
        );
      } catch (error) {
        // ข้อมูลสแกนบันทึกสำเร็จแล้ว
        // หากตรวจตารางไม่สำเร็จ ห้ามแจ้งว่าการนำเข้าล้มเหลว
        assessmentWarning =
          error instanceof Error ? error.message : "ตรวจเทียบตารางงานไม่สำเร็จ";
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: importRows.length,
      matchedRows: matchedRows.length,
      unmatchedRows: unmatchedCount,
      batchId: batch.id,
      assessments: assessments.map((item) => {
        const employee = employeesById.get(item.employeeId);

        return {
          ...item,
          employeeCode: employee?.employee_code || "",
          employeeName:
            [employee?.first_name_th, employee?.last_name_th]
              .filter(Boolean)
              .join(" ") || "ไม่ระบุชื่อ",
        };
      }),
      assessmentWarning,

      // ส่งเหตุผลของรายการที่จับคู่ไม่ได้กลับไปแสดงหน้าจอ
      issues: importRows
        .filter((row) => row.match_status !== "matched")
        .slice(0, 20)
        .map((row) => ({
          sourceEmployeeCode: row.external_employee_code,
          workDate: row.work_date,
          reason: row.error_message || "จับคู่ไม่ได้",
        })),
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
