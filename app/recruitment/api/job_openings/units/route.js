import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
	const { searchParams } = new URL(request.url);

	const divisionId = searchParams.get('division_id');
	const q = searchParams.get('q') || '';

	let query =  supabaseAdmin
		.from('units')
		.select(`
			id,
			unit_name
		`)
		.eq('division_id', divisionId)
		.eq('status', 'active')
		.order('unit_name');

	if (q) {
		query = query.ilike(
			'unit_name',
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
			label: row.unit_name
		}))
	);
}