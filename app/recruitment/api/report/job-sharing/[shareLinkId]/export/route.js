import { exportSharingReport } from '@/lib/recruitment/jobSharingExportServer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  const { shareLinkId } = await params;
  return exportSharingReport(request, shareLinkId);
}
