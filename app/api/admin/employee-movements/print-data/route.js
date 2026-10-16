import {NextResponse} from 'next/server';
import {db,gate,safeError,authorizedEmployee} from '@/lib/employeeMovements';
import {roster} from '@/lib/employeeMovementRoster';
export async function GET(req){
 try{
  const a=await gate(req);if(a.response)return a.response;
  const params=new URL(req.url).searchParams;
  const ids=[...new Set((params.get('ids')||'').split(',').filter(Boolean))];
  if(!ids.length||ids.length>100)return NextResponse.json({success:false,error:'เลือกได้ 1–100 รายการต่อครั้ง'},{status:400});
  for(const id of ids)if(!await authorizedEmployee(a.guard,id))return NextResponse.json({success:false,error:'ไม่มีสิทธิ์เข้าถึงข้อมูลบางรายการ'},{status:403});
  const {rows}=await roster(a.guard,new URLSearchParams());
  const records=rows.filter(x=>ids.includes(x.id));
  if(records.length!==ids.length)return NextResponse.json({success:false,error:'ไม่พบรายการทั้งหมดใน Scope'},{status:403});
  const reportType=params.get('type')==='exit'?'exit':'orientation';
  if(reportType==='exit' && records.some(r=>!['RESIGNED','RETIRED','TERMINATED'].includes(String(r.status_code||'').toUpperCase()) && r.event!=='EXITED'))return NextResponse.json({success:false,error:'รายงานพ้นสภาพใช้ได้เฉพาะพนักงานที่พ้นสภาพแล้ว'},{status:400});
  if(reportType==='orientation' && records.some(r=>r.orientation_status!=='COMPLETED'))return NextResponse.json({success:false,error:'ต้องยืนยัน Orientation เสร็จแล้วก่อนจึงจะส่งออกรายงานได้'},{status:400});
  const branches=[...new Set(records.map(x=>x.branch_id).filter(Boolean))];
  const branchImages={};
  if(branches.length){
   const {data,error}=await db.from('branches').select('id,branch_image_url').in('id',branches);if(error)throw error;
   for(const b of data||[])branchImages[b.id]=b.branch_image_url||null;
  }
  // Set the actual photo column in .env. Never leak arbitrary employee columns to the browser.
  const photoColumn=process.env.EMPLOYEE_MOVEMENT_PHOTO_COLUMN||'';
  const photos={};
  if(photoColumn){
   if(!/^[a-z][a-z_0-9]*$/.test(photoColumn))throw Error('Invalid EMPLOYEE_MOVEMENT_PHOTO_COLUMN');
   const {data,error}=await db.from('employees').select(`id,${photoColumn}`).in('id',ids);if(error)throw error;
   for(const x of data||[])photos[x.id]=x[photoColumn]||null;
  }
  const output=records.map(r=>({id:r.id,employee_code:r.employee_code,name:[r.first_name_th,r.last_name_th].filter(Boolean).join(' '),hire_date:r.hire_date,orientation_date:r.orientation_date||r.hire_date,orientation_location:r.orientation_location||'',orientation_status:r.orientation_status,event:r.event,report_type:reportType,employee_status:r.status_name,exit_date:r.resignation_date,branch_id:r.branch_id,branch_name:r.organization?.branch_id,branch_image_url:branchImages[r.branch_id]||null,department:r.organization?.department_id,photo_url:photos[r.id]||null}));
  return NextResponse.json({success:true,data:output});
 }catch(e){return safeError(e)}
}
