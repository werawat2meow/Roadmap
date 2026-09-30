import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireScopedAccess } from '@/lib/auth/requireScopedAccess';
import { getOrCreateShareLink, isOpeningAvailable, isUuid, loadOpening, publicShareOrigin } from '@/lib/recruitment/jobShare.mjs';

export const runtime = 'nodejs';
const failure = (status, code, message) => NextResponse.json({ success: false, code, message }, { status });

export async function POST(request) {
  try {
    const guard = await requireScopedAccess('recruitment.job.openings', 'view', { lineageScope: true });
    if (!guard.ok) return guard.response;
    const body = await request.json().catch(() => null);
    if (!isUuid(body?.job_open_id)) return failure(400, 'INVALID_JOB_ID', 'กรุณาระบุรหัสประกาศงานให้ถูกต้อง');
    const opening = await loadOpening(supabaseAdmin, body.job_open_id);
    if (!opening) return failure(404, 'JOB_UNAVAILABLE', 'ไม่พบประกาศงาน');
    if (!guard.canAccessEmployee(opening)) return failure(403, 'FORBIDDEN', 'ไม่มีสิทธิ์แชร์ประกาศงานนี้');
    if (!isOpeningAvailable(opening)) return failure(404, 'JOB_UNAVAILABLE', 'ประกาศงานนี้ไม่ได้เปิดรับสมัคร');
    const origin = publicShareOrigin();
    const link = await getOrCreateShareLink(supabaseAdmin, opening.id, guard.user.id);
    if (link.revoked_at) return failure(409, 'SHARE_LINK_REVOKED', 'ลิงก์นี้ถูกยกเลิกแล้ว');
    return NextResponse.json({ success: true, data: {
      id: link.id, job_open_id: link.job_open_id, share_code: link.share_code,
      url: `${origin}/jobs/s/${link.share_code}`,
    } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('JOB_SHARE_LINK_ERROR', error?.code || error?.message);
    return failure(500, 'SHARE_LINK_ERROR', 'ไม่สามารถสร้างลิงก์ได้ กรุณาติดต่อผู้ดูแลระบบ');
  }
}
