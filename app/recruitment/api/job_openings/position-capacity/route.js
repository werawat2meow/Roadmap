import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
	const { searchParams } = new URL(req.url);

	const positionId = searchParams.get("position_id");

	// ดึงข้อมูล unit_positions
	const { data: unitPosition, error: unitError } =
		await supabaseAdmin
			.from("unit_positions")
			.select("headcount_target")
			.eq("position_id", positionId)
			.eq("status", "active")
			.single();

	if (unitError && unitError.code !== "PGRST116") {
		return NextResponse.json(
			{ error: unitError.message },
			{ status: 500 }
		);
	}

	// นับจำนวนพนักงาน
	const { count: employeeCount, error: employeeError } =
		await supabaseAdmin
			.from("employees")
			.select("*", {
				count: "exact",
				head: true,
			})
			.eq("position_id", positionId)
			.eq("status", "active");

	if (employeeError) {
		return NextResponse.json(
			{ error: employeeError.message },
			{ status: 500 }
		);
	}

	return NextResponse.json({
		headcount_target: unitPosition?.headcount_target ?? 0,
		employee_count: employeeCount ?? 0,
	});
}