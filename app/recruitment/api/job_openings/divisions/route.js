import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
	const { searchParams } = new URL(request.url);

	const departmentId = searchParams.get('department_id');
	const q = searchParams.get('q') || '';

	let query =  supabaseAdmin
		.from('divisions')
		.select(`
			id,
			division_name
		`)
		.eq('department_id', departmentId)
		.eq('status', 'active')
		.order('division_name');

	if (q) {
		query = query.ilike(
			'division_name',
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
			label: row.division_name
		}))
	);
}