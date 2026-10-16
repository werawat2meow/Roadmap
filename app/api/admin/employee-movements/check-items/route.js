import { movementSharedViewGate, movementAreaEditGate } from "@/lib/employeeMovementAuditAccess";
import { NextResponse } from "next/server";
import { db, gate, safeError, authorizedEmployee } from "@/lib/employeeMovements";

const UUID = /^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i;
const validArea = x => ["AUDIT", "ASSET"].includes(x);
const validState = x => ["PENDING", "COMPLETED"].includes(x);
const reply = (error, status=400) => NextResponse.json({ success:false, error }, {status});

export async function GET(req) {
  try {
    const access = await movementSharedViewGate(req);
    if (access.response) return access.response;
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employee_id");
    if (!employeeId || !UUID.test(employeeId)) return reply("employee_id ไม่ถูกต้อง");
    if (!await authorizedEmployee(access.guard, employeeId)) return reply("ไม่พบพนักงานในขอบเขตสิทธิ์",403);
    const {data,error} = await db.from("employee_movement_check_items")
      .select("id,employee_id,area,item_name,state,notes,created_at,updated_at,completed_at")
      .eq("employee_id",employeeId).order("created_at",{ascending:true});
    if (error) throw error;
    return NextResponse.json({success:true,data:data||[]});
  } catch (error) { return safeError(error); }
}

export async function POST(req) {
  try {
    const body=await req.json();
    const access=await movementAreaEditGate(req,body?.area);if(access.response)return access.response;
    const employeeId=body?.employee_id, area=body?.area;
    const itemName=String(body?.item_name||"").trim();
    const notes=String(body?.notes||"").trim();
    if(!UUID.test(employeeId||"")||!validArea(area)||!itemName||itemName.length>150||notes.length>1000)return reply("ข้อมูลรายการตรวจสอบไม่ถูกต้อง");
    if(!await authorizedEmployee(access.guard,employeeId))return reply("ไม่มีสิทธิ์จัดการข้อมูลพนักงานนี้",403);
    const actor=access.actor.user_account_id;
    const {data,error}=await db.from("employee_movement_check_items").insert({
      employee_id:employeeId,area,item_name:itemName,notes:notes||null,
      state:"PENDING",created_by:actor,updated_by:actor
    }).select("id,employee_id,area,item_name,state,notes,created_at,updated_at,completed_at").single();
    if(error)throw error;
    return NextResponse.json({success:true,data});
  } catch(error){return safeError(error);}
}

export async function PATCH(req){
  try{
    const body=await req.json();
    const id=body?.id,state=body?.state, notes=String(body?.notes||"").trim();
    const hasName=Object.prototype.hasOwnProperty.call(body||{},"item_name");
    const itemName=hasName?String(body.item_name||"").trim():null;
    if(!UUID.test(id||"") || (state!==undefined&&!validState(state)) ||
       notes.length>1000 || (hasName&&(!itemName||itemName.length>150)))
      return reply("ข้อมูลรายการไม่ถูกต้อง");
    const {data:old,error:readError}=await db.from("employee_movement_check_items")
      .select("id,employee_id,state,area,item_name,notes").eq("id",id).maybeSingle();
    if(readError)throw readError;
    if(!old)return reply("ไม่พบรายการ",404);
    const access=await movementAreaEditGate(req,old.area);if(access.response)return access.response;
    if(!await authorizedEmployee(access.guard,old.employee_id))return reply("ไม่มีสิทธิ์จัดการข้อมูลพนักงานนี้",403);
    if(state===undefined&&!hasName)return reply("ไม่มีข้อมูลที่ต้องแก้ไข");
    const nextState=state===undefined?old.state:state;
    const update={
      updated_by:access.actor.user_account_id,
      updated_at:new Date().toISOString(),
    };
    if(state!==undefined){
      update.state=nextState;
      update.completed_at=nextState==="COMPLETED"?new Date().toISOString():null;
      update.notes=notes||null;
    }
    // LINE group name editing is permitted exclusively for AUDIT items.
    if(hasName){
      if(old.area!=="AUDIT")return reply("ไม่อนุญาตให้แก้ชื่อรายการทรัพย์สินผ่านหน้านี้",403);
      update.item_name=itemName;
    }
    const {data,error}=await db.from("employee_movement_check_items").update(update)
      .eq("id",id).eq("state",old.state)
      .select("id,employee_id,area,item_name,state,notes,created_at,updated_at,completed_at").maybeSingle();
    if(error)throw error;
    if(!data)return reply("สถานะรายการเปลี่ยนไปแล้ว กรุณารีเฟรช",409);
    return NextResponse.json({success:true,data});
  }catch(error){return safeError(error);}
}
