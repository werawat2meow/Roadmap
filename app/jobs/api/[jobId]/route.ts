// app/api/jobs/[jobId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
    const { jobId } = await params;
        
    if (!jobId) {
        return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    // ── 1. ดึงข้อมูลจาก recruit_job_open ──────────────────────────────────────
    const { data: jobOpen, error: jobOpenError } = await supabase
        .from("recruit_job_open")
        .select(
        `
        id,
        position_id,
        opening_count,
        urgent,
        branch_id,
        department_id,
        division_id,
        unit_id,
        branches ( id, branch_name ),
        positions ( id, position_name )
        `
        )
        .eq("id", jobId)
        .single();
        
    if (jobOpenError || !jobOpen) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // ── 2. ค้นหา recruit_job_description ด้วย position_id → branch_id → ... ──
    const { data: jobDesc, error: jobDescError } = await supabase
        .from("recruit_job_description")
        .select("*")
        .eq("positions_id", jobOpen.position_id)
        .eq("branch_id", jobOpen.branch_id)
        .eq("department_id", jobOpen.department_id)
        .eq("division_id", jobOpen.division_id)
        .eq("unit_id", jobOpen.unit_id)
        .maybeSingle();
    
    if (jobDescError) {
        return NextResponse.json(
        { error: "Failed to fetch job description" },
        { status: 500 }
        );
    }

    const jobDescriptionId = jobDesc?.id ?? null;

    // ── 3. ดึง requirements / responsibilities / benefits ──────────────────────
    const [reqRes, respRes, benRes] = await Promise.all([
        jobDescriptionId
        ? supabase
            .from("recruit_job_description_requirements")
            .select("requirement_text")
            .eq("job_description_id", jobDescriptionId)
            .order("id")
        : Promise.resolve({ data: [], error: null }),

        jobDescriptionId
        ? supabase
            .from("recruit_job_description_responsibilities")
            .select("responsibility_text")
            .eq("job_description_id", jobDescriptionId)
            .order("id")
        : Promise.resolve({ data: [], error: null }),

        jobDescriptionId
        ? supabase
            .from("recruit_job_description_benefits")
            .select("benefit_text")
            .eq("job_description_id", jobDescriptionId)
            .order("id")
        : Promise.resolve({ data: [], error: null }),
    ]);

    // ── 0. ดึง language slugs จาก recruit_language ก่อนเลย ─────────────────────
    const { data: languages } = await supabase
    .from("recruit_language")
    .select("language_slug")
    .order("id");

    const slugs: string[] = (languages ?? []).map((l) => l.language_slug);
    // e.g. ["TH", "EN"] หรือ ["th", "en"] — ยึดตาม DB เป็นหลัก

    // ── 4. แปลง JSON field ────────────────────────────────────────────────────
    // requirement_text, responsibility_text, benefit_text เป็น JSON จาก DB
    // e.g. { "th": "ข้อความ", "en": "text" }
    const parseJsonField = (
    raw: unknown,
    slugs: string[]
    ): Record<string, string> => {
        if (!raw) return {};

        let obj: Record<string, string>;
        if (typeof raw === "object") {
            obj = raw as Record<string, string>;
        } else {
            try {
                obj = JSON.parse(raw as string);
            } catch {
                return {};
            }
        }

        // map แต่ละ key → หา slug ที่ตรงกัน (case-insensitive)
        // ถ้าไม่เจอ slug ที่ match ก็ใช้ key เดิม
        const result: Record<string, string> = {};
        for (const [k, v] of Object.entries(obj)) {
            const matched =
            slugs.find((s) => s.toLowerCase() === k.toLowerCase()) ?? k;
            result[matched] = v;
        }
        return result;
    };

    const requirements = (reqRes.data ?? []).map((row) => parseJsonField(row.requirement_text, slugs));
    const responsibilities = (respRes.data ?? []).map((row) => parseJsonField(row.responsibility_text, slugs));
    const benefits = (benRes.data ?? []).map((row) => parseJsonField(row.benefit_text, slugs));
    
    // ── 5. Compose response ───────────────────────────────────────────────────
    return NextResponse.json({
        id: jobOpen.id,
        opening_count: jobOpen.opening_count,
        urgent: jobOpen.urgent,
        salary_min: jobDesc.salary_min,
        salary_max: jobDesc.salary_max,
        type_of_work: jobDesc.type_of_work,
        workLocation: jobDesc.workLocation,
        companyName: jobOpen?.branches.branch_name,
        positionTitle: (jobOpen as any).positions?.position_name,
        requirements,
        responsibilities,
        benefits,
    });
}
