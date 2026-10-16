import { redirect } from 'next/navigation';
import { requireSharingReportAccess } from '@/lib/recruitment/jobSharingReportServer';
import ReportClient from './ReportClient';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }) {
  const guard = await requireSharingReportAccess();
  if (!guard.ok) redirect(guard.response.status === 401 ? '/login' : '/recruitment');
  const query = await searchParams;
  return (
    <main className="min-h-full w-full bg-slate-50/70 p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1500px]">
        <ReportClient initialDates={{ dateFrom: typeof query?.dateFrom === 'string' ? query.dateFrom : '', dateTo: typeof query?.dateTo === 'string' ? query.dateTo : '' }} />
      </div>
    </main>
  );
}
