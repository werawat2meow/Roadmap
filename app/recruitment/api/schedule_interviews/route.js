import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseServer";

/**
 * GET /recruitment/api/candidate
 *
 * Query params (list mode - default):
 *   status      : ค่า status (number) - optional
 *   position_id : id ของตำแหน่งงาน - optional
 *   date_from   : ISO string ของวันที่เริ่มต้น (created_at >=) - optional
 *   date_to     : ISO string ของวันที่สิ้นสุด (created_at <=) - optional
 *   page        : เลขหน้า (default 1)
 *   pageSize    : 10|20|30|40|50|100|all (default 10)
 *
 * Query params (lookup mode):
 *   resource=positions -> คืนรายการตำแหน่งงานทั้งหมด { id, position_name }
 *
 * หมายเหตุ: ถ้าตาราง recruit_job_applications เปิด RLS และ policy ไม่อนุญาตให้
 * anon key อ่านได้ทั้งหมด ให้เปลี่ยนไปใช้ service role key ใน client ฝั่ง server
 * แทน (แนะนำสร้างไฟล์ @/lib/supabaseServerClient แยกต่างหาก แล้วเปลี่ยน import
 * ด้านบนเป็นตัวนั้น)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ---------- Lookup mode: ตัวเลือกตำแหน่งงาน ----------
    if (searchParams.get('resource') === 'positions') {
      const { data, error } = await supabaseAdmin
        .from('positions')
        .select('id, position_name')
        .order('position_name', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data: data ?? [] });
    }

    // ---------- List mode: รายการผู้สมัคร ----------
    const status = searchParams.get('status');
    const positionId = searchParams.get('position_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSizeParam = searchParams.get('pageSize') || '10';
    const isAll = pageSizeParam === 'all';
    let pageSize = isAll ? null : parseInt(pageSizeParam, 10);
    if (!isAll && (!Number.isFinite(pageSize) || pageSize <= 0)) {
      pageSize = 10;
    }
    if (!isAll) {
      pageSize = Math.min(pageSize, 100); // จำกัด max
    }

    let query = supabaseAdmin
    .from("recruit_job_applications")
    .select(
      `
        id,
        first_name,
        last_name,
        created_at,
        status,
        position_id,
        positions (position_name),
        recruit_job_interviews!inner (
          interview_datetime,
          interview_order,
          reviewer
        )
      `,
      { count: "exact" }
    )
    .order("interview_order", {
      foreignTable: "recruit_job_interviews",
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

    if (status !== null && status !== '' && status !== undefined) {
      const statusNum = Number(status);
      if (!Number.isNaN(statusNum)) {
        query = query.eq('status', statusNum);
      }
    } else {
      query = query.in('status', [4, 5, 6, 8, 9, 10, 11]); // default เฉพาะตอนไม่ระบุ status
    }

    if (positionId) {
      query = query.eq('position_id', positionId);
    }

    // Filter interview_datetime
    if (dateFrom) {
      query = query.gte(
        "recruit_job_interviews.interview_datetime",
        `${dateFrom} 00:00:00`
      );
    }

    if (dateTo) {
      query = query.lte(
        "recruit_job_interviews.interview_datetime",
        `${dateTo} 23:59:59`
      );
    }

    if (!isAll) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;   
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], count: count ?? 0 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? 'Unexpected server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("recruit_job_applications")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (err) {
    return NextResponse.json(
      {
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}
