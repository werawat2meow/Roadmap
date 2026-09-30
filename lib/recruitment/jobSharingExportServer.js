import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getSharingSummary, getSharingHistory, parseReportFilters } from './jobSharingReport.mjs';
import { requireSharingReportAccess, reportError } from './jobSharingReportServer';
import { buildSharingWorkbook } from './jobSharingExcel.mjs';

export async function exportSharingReport(request, shareLinkId = null) {
  try {
    const guard = await requireSharingReportAccess();
    if (!guard.ok) return guard.response;
    const params = new URL(request.url).searchParams;
    // Pagination is intentionally ignored for exports, even if supplied manually.
    params.delete('page'); params.delete('pageSize');
    const filters = parseReportFilters(params);
    const data = shareLinkId === null
      ? await getSharingSummary(supabaseAdmin, guard, filters, { all: true })
      : await getSharingHistory(supabaseAdmin, guard, shareLinkId, filters, { all: true });
    const { workbook, filename } = buildSharingWorkbook(data, filters, { history: shareLinkId !== null });
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(buffer), { headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) { return reportError(error); }
}
