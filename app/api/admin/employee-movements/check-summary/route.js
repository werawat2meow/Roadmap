import { movementSharedViewGate } from "@/lib/employeeMovementAuditAccess";
import { NextResponse } from "next/server";
import { db, gate, safeError, authorizedEmployee } from "@/lib/employeeMovements";
const UUID=/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i;
export async function GET(req){
 try{
  const access=await movementSharedViewGate(req); if(access.response)return access.response;
  const ids=[...new Set((new URL(req.url).searchParams.get("ids")||"").split(",").filter(Boolean))];
  if(ids.length>100||ids.some(id=>!UUID.test(id)))return NextResponse.json({success:false,error:"รายการไม่ถูกต้อง"},{status:400});
  for(const id of ids)if(!await authorizedEmployee(access.guard,id))return NextResponse.json({success:false,error:"ไม่มีสิทธิ์เข้าถึงข้อมูลบางรายการ"},{status:403});
  if(!ids.length)return NextResponse.json({success:true,data:{}});
  const {data,error}=await db.from("employee_movement_check_items")
   .select("employee_id,area,state").in("employee_id",ids);
  if(error)throw error;
  const result=Object.fromEntries(ids.map(id=>[id,{AUDIT:{total:0,completed:0},ASSET:{total:0,completed:0}}]));
  for(const item of data||[]){const stat=result[item.employee_id]?.[item.area];if(!stat)continue;stat.total++;if(item.state==="COMPLETED")stat.completed++;}
  return NextResponse.json({success:true,data:result});
 }catch(error){return safeError(error)}
}
