import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
	const { searchParams } = new URL(request.url);

	const unitId = searchParams.get('unit_id');
	const q = searchParams.get('q') || '';

	let query =  supabaseAdmin
		.from('positions')
		.select(`
			id,
			position_name,
			position_level,
			status,
			unit_positions!inner (
				unit_id,
				status
			)
		`)
		.eq('unit_positions.unit_id', unitId)
		.eq('status', 'active')
		.order('position_name');

	if (q) {
		query = query.ilike(
			'position_name',
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
			label: row.position_name,
			level: row.position_level
		}))
	);
}