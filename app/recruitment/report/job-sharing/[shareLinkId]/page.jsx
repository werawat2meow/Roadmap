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
    <>
      <div className="h-full w-full">
        <div className="overflow-y-auto p-6 w-full">
          <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Report Job Share
              </h1>
              <p className="mt-2 text-slate-500">รายงานการแชร์ประกาศ</p>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 w-full">
          <div
            style={{
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
              overflow: "hidden",
            }}
          >
            <ReportClient shareLinkId={shareLinkId} initialDates={{ dateFrom: typeof query?.dateFrom === 'string' ? query.dateFrom : '', dateTo: typeof query?.dateTo === 'string' ? query.dateTo : '' }} />
          </div>
        </div>
      </div>
    </>
  );
}
