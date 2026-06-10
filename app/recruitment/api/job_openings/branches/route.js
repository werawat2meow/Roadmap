import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {

  const { searchParams } = new URL(request.url);

	const q = searchParams.get('q') || '';

  let query = supabaseAdmin
		.from('branches')
		.select('id, branch_name')
		.eq('status', 'active')
		.order('branch_name');

  if (q) {
		query = query.ilike(
			'branch_name',
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
			label: row.branch_name
		}))
	);
	
}