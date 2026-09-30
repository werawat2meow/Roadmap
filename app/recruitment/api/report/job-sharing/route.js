import { supabaseAdmin } from '@/lib/supabaseServer';
import { getSharingSummary, parseReportFilters } from '@/lib/recruitment/jobSharingReport.mjs';
import { requireSharingReportAccess, reportResponse, reportError } from '@/lib/recruitment/jobSharingReportServer';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    const guard = await requireSharingReportAccess();
    if (!guard.ok) return guard.response;
    return reportResponse(await getSharingSummary(supabaseAdmin, guard, parseReportFilters(new URL(request.url).searchParams)));
  } catch (error) { return reportError(error); }
}
