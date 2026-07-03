import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const body = await req.json();
  const { category_id } = body as { category_id: string };

  if (!category_id) {
    return NextResponse.json({ success: false, error: 'category_id is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('rm_category_items')
    .insert([{ category_id, topic: '', weight: 0 }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, topic, weight } = body as {
    id: string;
    topic?: string;
    weight?: number;
  };

  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  if (topic !== undefined) updateData.topic = topic;
  if (weight !== undefined) updateData.weight = weight;

  const { data, error } = await supabaseAdmin
    .from('rm_category_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('rm_category_items')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}