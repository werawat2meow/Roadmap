import { supabaseAdmin } from '@/lib/supabaseServer';
import { getSharingHistory, parseReportFilters } from '@/lib/recruitment/jobSharingReport.mjs';
import { requireSharingReportAccess, reportResponse, reportError } from '@/lib/recruitment/jobSharingReportServer';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  try {
    const guard = await requireSharingReportAccess();
    if (!guard.ok) return guard.response;
    const { shareLinkId } = await params;
    return reportResponse(await getSharingHistory(supabaseAdmin, guard, shareLinkId, parseReportFilters(new URL(request.url).searchParams)));
  } catch (error) { return reportError(error); }
}
