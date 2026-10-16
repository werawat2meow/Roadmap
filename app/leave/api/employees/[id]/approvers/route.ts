import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function getName(item: any) {
  return [item.firstNameTh, item.lastNameTh].filter(Boolean).join(" ");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data: mappings, error: mappingError } = await supabaseAdmin
      .from("leave_employee_approvers")
      .select("approverId")
      .eq("employeeId", id);

    if (mappingError) throw mappingError;

    const approverIds = (mappings || [])
      .map((item: any) => item.approverId)
      .filter(Boolean);

    if (approverIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const { data: approvers, error: approverError } = await supabaseAdmin
      .from("leave_approvers")
      .select(`
        id,
        employeeId,
        empNo,
        firstNameTh,
        lastNameTh,
        email
      `)
      .in("id", approverIds)
      .order("empNo", { ascending: true });

    if (approverError) throw approverError;

    return NextResponse.json({
      success: true,
      data: (approvers || []).map((item: any) => ({
        id: item.id,
        employeeId: item.employeeId,
        employeeCode: item.empNo || "",
        name: getName(item),
        email: item.email || "",
      })),
    });
  } catch (error: any) {
    console.error("Load employee approvers failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "โหลดข้อมูลผู้อนุมัติไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}