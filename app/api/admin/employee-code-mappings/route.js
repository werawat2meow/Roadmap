import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

export const runtime = "nodejs";

function actorId(guard) {
  return guard?.access?.user_account_id || guard?.access?.user?.id || guard?.user?.id || null;
}

function csvCell(value) {
  const text = String(value ?? "");
  // Prevent spreadsheet formula execution when CSV is opened in Excel.
  const safe = /^[\s]*[=+@\-]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(req) {
  try {
    const guard = await requireScopedAccess("data.import", "view", { scopeType: "employee" });
    if (!guard.ok) return guard.response;

    const params = new URL(req.url).searchParams;
    const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(params.get("pageSize") || "20", 10) || 20));
    const search = (params.get("search") || "").trim().toLocaleLowerCase();
    const status = params.get("status") || "all";
    const format = params.get("format") || "json";
    if (!["all", "imported", "pending"].includes(status) || !["json", "csv"].includes(format)) {
      return NextResponse.json({ success: false, error: "ตัวกรองไม่ถูกต้อง" }, { status: 400 });
    }

    // data_import_jobs has no organization scope. Non-all users can see only their own jobs,
    // and every linked employee must still pass employee-level scope checks.
    if (!guard.hasAllScope && !actorId(guard)) {
      return NextResponse.json({ success: true, data: [], pagination: { page, pageSize, total: 0 } });
    }

    const visibleJobs = new Map();
    for (let offset = 0; ; offset += 500) {
      let q = supabaseAdmin.from("data_import_jobs")
        .select("id,file_name,created_by,created_at")
        .eq("import_type", "employee_migration")
        .order("created_at", { ascending: false })
        .range(offset, offset + 499);
      if (!guard.hasAllScope) q = q.eq("created_by", actorId(guard));
      const { data, error } = await q;
      if (error) throw error;
      for (const job of data || []) visibleJobs.set(job.id, job);
      if ((data || []).length < 500) break;
    }

    const collected = [];
    const jobIds = [...visibleJobs.keys()];
    // Chunk job IDs to avoid oversized PostgREST IN expressions.
    for (let k = 0; k < jobIds.length; k += 50) {
      const ids = jobIds.slice(k, k + 50);
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabaseAdmin.from("data_import_rows")
          .select(`id,import_job_id,row_no,employee_code,external_employee_id,action,status,employee_id,created_at,
            employee:employees!data_import_rows_employee_id_fkey(id,employee_code,first_name_th,last_name_th,company_id,branch_group_id,branch_id,department_id,division_id,unit_id)`)
          .in("import_job_id", ids)
          .order("created_at", { ascending: false })
          .range(offset, offset + 499);
        if (error) throw error;
        for (const r of data || []) {
          const emp = Array.isArray(r.employee) ? r.employee[0] : r.employee;
          const job = visibleJobs.get(r.import_job_id);
          if (!job) continue;
          // Linked employees are always checked against Employee Scope, even for job owners.
          if (emp && !guard.canAccessEmployee(emp)) continue;
          // Rows without an employee cannot yet be scoped to an organization.
          // Never expose someone else's pending rows to non-all-scope accounts.
          if (!emp && !guard.hasAllScope && job.created_by !== actorId(guard)) continue;
          const mapped = {
            id: r.id, row_no: r.row_no, old_employee_code: r.employee_code,
            new_employee_code: emp?.employee_code || null,
            external_employee_id: r.external_employee_id,
            employee_id: emp?.id || null,
            employee_name: [emp?.first_name_th, emp?.last_name_th].filter(Boolean).join(" ") || "-",
            status: r.status, action: r.action, file_name: job.file_name,
            imported_at: r.created_at, job_created_at: job.created_at,
          };
          if (status === "imported" && !(r.status === "imported" && emp)) continue;
          if (status === "pending" && r.status === "imported" && emp) continue;
          if (search && ![mapped.old_employee_code, mapped.new_employee_code, mapped.external_employee_id, mapped.employee_name, mapped.file_name].some(v => String(v || "").toLocaleLowerCase().includes(search))) continue;
          collected.push(mapped);
        }
        if ((data || []).length < 500) break;
      }
    }

    collected.sort((a, b) => String(b.imported_at || "").localeCompare(String(a.imported_at || "")));
    if (format === "csv") {
      const header = ["รหัสพนักงานเก่า", "รหัสพนักงานใหม่", "ชื่อ-สกุล", "External ID", "สถานะ", "ไฟล์นำเข้า", "วันที่บันทึก"];
      const lines = [header, ...collected.map(r => [r.old_employee_code, r.new_employee_code, r.employee_name, r.external_employee_id, r.status, r.file_name, r.imported_at])];
      const csv = "\uFEFF" + lines.map(cols => cols.map(csvCell).join(",")).join("\r\n");
      return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="employee-code-mappings.csv"', "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ success: true, data: collected.slice((page - 1) * pageSize, page * pageSize), pagination: { page, pageSize, total: collected.length } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("EMPLOYEE_CODE_MAPPINGS_ERROR", error);
    return NextResponse.json({ success: false, error: "ไม่สามารถโหลดข้อมูลเทียบรหัสพนักงานได้" }, { status: 500 });
  }
}
