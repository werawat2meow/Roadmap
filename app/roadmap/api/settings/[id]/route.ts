// app/roadmap/api/settings/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, level, department_id, division_id, unit_id } = body as {
    title?: string;
    level?: string;
    department_id?: string | null;
    division_id?: string | null;
    unit_id?: string | null;
  };

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  if (title !== undefined) updateData.title = title;
  if (level !== undefined) updateData.level = level;
  if (department_id !== undefined) updateData.department_id = department_id;
  if (division_id !== undefined) updateData.division_id = division_id;
  if (unit_id !== undefined) updateData.unit_id = unit_id;

  const { data, error } = await supabaseAdmin
    .from('rm_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('rm_categories')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}