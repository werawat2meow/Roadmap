import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { findShareLink, isOpeningAvailable, loadOpening, makeShareCookie, publicShareOrigin, shareCookieName, SHARE_MAX_AGE } from '@/lib/recruitment/jobShare.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const { shareCode } = await params;
    const link = await findShareLink(supabaseAdmin, shareCode);
    if (!link || link.revoked_at || !isOpeningAvailable(await loadOpening(supabaseAdmin, link.job_open_id))) {
      return new NextResponse('ลิงก์นี้ไม่พร้อมใช้งาน หรือประกาศงานปิดรับสมัครแล้ว', {
        status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    const response = NextResponse.redirect(new URL(`/jobs/${link.job_open_id}?ref=${link.share_code}`, publicShareOrigin()));
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'same-origin');
    response.cookies.set(shareCookieName(link.job_open_id), makeShareCookie(link.job_open_id, link.share_code, process.env.JWT_SECRET), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      path: '/jobs', maxAge: SHARE_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error('JOB_SHARE_REDIRECT_ERROR', error?.code || error?.message);
    return new NextResponse('ไม่สามารถเปิดลิงก์ได้ กรุณาลองอีกครั้ง', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}
