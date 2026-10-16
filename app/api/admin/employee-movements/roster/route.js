import { movementSharedViewGate } from "@/lib/employeeMovementAuditAccess";
import {NextResponse} from 'next/server';
import {gate,safeError} from '@/lib/employeeMovements';
import {roster} from '@/lib/employeeMovementRoster';
export async function GET(req){
 try{
  const a=await movementSharedViewGate(req);if(a.response)return a.response;
  const s=new URL(req.url).searchParams;
  const {rows,today}=await roster(a.guard,s);
  const counts={UPCOMING:0,ORIENTATION_PENDING:0,STARTED:0,PROBATION:0,EXIT_PENDING:0,EXITED:0,OTHER:0};
  for(const r of rows)for(const ev of r.event_types||[r.event])counts[ev]=(counts[ev]||0)+1;

  const page=Math.max(1,Number(s.get('page'))||1),pageSize=Math.min(100,Math.max(1,Number(s.get('pageSize'))||20));
  return NextResponse.json({success:true,data:rows.slice((page-1)*pageSize,page*pageSize),pagination:{page,pageSize,total:rows.length},counts,today});
 }catch(e){return safeError(e)}
}
