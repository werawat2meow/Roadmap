import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireSharingReportAccess } from '@/lib/recruitment/jobSharingReportServer';
import { requireReportId, getReportLinks, ReportError } from '@/lib/recruitment/jobSharingReport.mjs';
import ReportClient from '../ReportClient';
export const dynamic = 'force-dynamic';
export default async function Page({ params, searchParams }) {
  const guard = await requireSharingReportAccess();
  if (!guard.ok) redirect(guard.response.status === 401 ? '/login' : '/recruitment');
  const { shareLinkId } = await params;
  try {
    requireReportId(shareLinkId);
    await getReportLinks(supabaseAdmin, guard, {}, shareLinkId);
  } catch (error) { if (error instanceof ReportError) notFound(); throw error; }
  const query = await searchParams;
  return (
    <main className="min-h-full w-full bg-slate-50/70 p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1500px]">
        <ReportClient shareLinkId={shareLinkId} initialDates={{ dateFrom: typeof query?.dateFrom === 'string' ? query.dateFrom : '', dateTo: typeof query?.dateTo === 'string' ? query.dateTo : '' }} />
      </div>
    </main>
  );
}
