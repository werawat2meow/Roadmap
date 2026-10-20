import { withActivity } from "@/app/recruitment/lib/activity/server";
import { exportSharingReport } from '@/lib/recruitment/jobSharingExportServer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function handleGET(request) { return exportSharingReport(request); }

export const GET = withActivity(handleGET, {"page_path": "/recruitment/report/job-sharing", "action": "EXPORT", "resource_type": "job_sharing_report", "idField": "id"});
