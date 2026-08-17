// app/roadmap/api/settings/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

function normalizeCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('rm_categories')
    .select(`
      id,
      title,
      level,
      department_id,
      division_id,
      unit_id,
      evaluation_type_id,
      rm_evaluation_types (
        id,
        name,
        code
      ),
      rm_category_items (
        id,
        topic,
        weight
      )
    `)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const mapped = (data || []).map((category: any) => ({
    id: category.id,
    title: category.title,
    type: category.rm_evaluation_types?.name || category.rm_evaluation_types?.code || '',
    level: category.level,
    department_id: category.department_id ?? null,
    division_id: category.division_id ?? null,
    unit_id: category.unit_id ?? null,
    items: (category.rm_category_items || []).map((item: any) => ({
      id: item.id,
      topic: item.topic,
      weight: item.weight,
    })),
  }));

  return NextResponse.json({ success: true, data: mapped });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, type, level, department_id, division_id, unit_id } = body as {
    title: string;
    type: string;
    level: string;
    department_id?: string;
    division_id?: string;
    unit_id?: string;
  };

  if (!title || !type || !level) {
    return NextResponse.json(
      { success: false, error: 'title, type, and level are required' },
      { status: 400 }
    );
  }

  const normalizedCode = normalizeCode(type);

  const { data: existingTypes, error: typeError } = await supabaseAdmin
    .from('rm_evaluation_types')
    .select('id, name, code')
    .or(`name.eq.${type},code.eq.${normalizedCode}`)
    .limit(1);

  if (typeError) {
    return NextResponse.json({ success: false, error: typeError.message }, { status: 500 });
  }

  let evaluationTypeId = existingTypes?.[0]?.id;

  if (!evaluationTypeId) {
    const { data: insertedType, error: insertTypeError } = await supabaseAdmin
      .from('rm_evaluation_types')
      .insert([{ name: type, code: normalizedCode }])
      .select()
      .single();

    if (insertTypeError) {
      return NextResponse.json({ success: false, error: insertTypeError.message }, { status: 500 });
    }

    evaluationTypeId = insertedType?.id;
  }

  const { data, error } = await supabaseAdmin
    .from('rm_categories')
    .insert([{
      title,
      level,
      evaluation_type_id: evaluationTypeId,
      department_id: department_id ?? null,
      division_id: division_id ?? null,
      unit_id: unit_id ?? null,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...data,
      type,
      department_id: data.department_id ?? null,
      division_id: data.division_id ?? null,
      unit_id: data.unit_id ?? null,
      items: [],
    },
  });
}