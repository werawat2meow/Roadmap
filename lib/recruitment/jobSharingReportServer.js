import { NextResponse } from 'next/server';
import { requireScopedAccess } from '@/lib/auth/requireScopedAccess';
import { REPORT_MODULE, ReportError } from './jobSharingReport.mjs';

export const requireSharingReportAccess = () => requireScopedAccess(REPORT_MODULE, 'view', { lineageScope: true });
export function reportResponse(data) {
  return NextResponse.json({ success: true, ...data }, { headers: { 'Cache-Control': 'private, no-store' } });
}
export function reportError(error) {
  if (!(error instanceof ReportError)) console.error('SHARING_REPORT_ERROR', error?.code || error?.message);
  return NextResponse.json({ success: false, message: error instanceof ReportError ? error.message : 'ไม่สามารถโหลดรายงานได้' },
    { status: error instanceof ReportError ? error.status : 500, headers: { 'Cache-Control': 'private, no-store' } });
}
