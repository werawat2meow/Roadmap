import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
    try {

      const { data, error } = await supabaseAdmin
        .from('employees')
        .select('id, first_name_th, last_name_th, position_levels ( id, level_code)')
        .eq('status','active');

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }

      const result = data.map((item) => ({
        value: item.id,
        label: `${item.first_name_th ?? ""} - ${item.last_name_th ?? ""} - ${item.position_levels?.level_code ?? ""}`,
      }));

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (err) {
    return NextResponse.json(
      { error: err.message, },
      { status: 500, }
    );
  }
}