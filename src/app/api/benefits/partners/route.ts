import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-key';
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET: Listar parceiros credenciados
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get('tenant_id');

    let query = supabase.from('benefit_partners').select('*').order('name');
    if (tenant_id && tenant_id !== 'all') {
      query = query.eq('tenant_id', tenant_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ partners: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar parceiros do clube de benefícios.' }, { status: 500 });
  }
}

// POST: Cadastrar novo parceiro credenciado
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();

    const {
      tenant_id = 'matriz',
      name,
      category,
      discount_description,
      phone,
      address,
      city = 'Teresina - PI'
    } = body;

    if (!name || !discount_description) {
      return NextResponse.json({ error: 'Nome do parceiro e descrição do desconto são obrigatórios.' }, { status: 400 });
    }

    const { data: partner, error: pErr } = await supabase
      .from('benefit_partners')
      .insert([
        {
          tenant_id,
          name,
          category: category || 'Clínica Médica',
          discount_description,
          phone,
          address,
          city,
          status: 'Ativo'
        }
      ])
      .select()
      .single();

    if (pErr) throw pErr;

    return NextResponse.json({ success: true, partner });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao cadastrar parceiro.' }, { status: 500 });
  }
}