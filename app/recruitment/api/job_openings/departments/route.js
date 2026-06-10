import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
	const { searchParams } = new URL(request.url);

	const branchId = searchParams.get('branch_id');
	const q = searchParams.get('q') || '';

	let query =  supabaseAdmin
		.from('departments')
		.select(`
			id,
			department_name,
			status,
			branch_departments!inner (
				department_id
			)
		`)
		.eq('branch_departments.branch_id', branchId)
		.eq('status', 'active')
		.order('department_name');

	if (q) {
		query = query.ilike(
			'department_name',
			`%${q}%`
		);
	}

	const { data, error } = await query;

	if (error) {
		return NextResponse.json(
			{ error: error.message },
			{ status: 500 }
		);
	}

	return NextResponse.json(
		data.map((row) => ({
			id: row.id,
			label: row.department_name
		}))
	);
}