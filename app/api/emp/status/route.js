import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { withApiToken } from '@/lib/integration/assetsEmployeeApi';

export async function GET(req) {
  return withApiToken(req, async () => {
    const { data, error } = await supabaseAdmin.from('employee_statuses')
      .select('id,status_code,status_name,sort_order')
      .eq('status', 'active')
      .order('sort_order', { ascending: true }).order('status_name');
    if (error) throw error;
    return NextResponse.json({
      success: true,
      data: (data || []).map(s => ({
        id: s.id, code: s.status_code, name: s.status_name,
      })),
    });
  });
}
