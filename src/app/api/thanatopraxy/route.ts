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

// GET: Listar fichas de tanatopraxia
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get('tenant_id');

    let query = supabase.from('thanatopraxy_records').select('*').order('procedure_date', { ascending: false });
    if (tenant_id && tenant_id !== 'all') {
      query = query.eq('tenant_id', tenant_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ records: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar fichas de tanatopraxia.' }, { status: 500 });
  }
}

// POST: Registrar ficha e auditar procedimento
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();

    const {
      tenant_id = 'matriz',
      dispatch_id,
      contract_id,
      deceased_name,
      death_cause,
      thanatopractor_name,
      thanatopractor_register,
      method,
      body_condition,
      arterial_fluid_ml = 0,
      cavity_fluid_ml = 0,
      other_supplies,
      preservation_validity_hours = 48,
      observations
    } = body;

    if (!deceased_name || !thanatopractor_name || !method) {
      return NextResponse.json(
        { error: 'Falecido, tanatopractor e método são obrigatórios.' },
        { status: 400 }
      );
    }

    // 1. Inserir registro de tanatopraxia
    const { data: record, error: rErr } = await supabase
      .from('thanatopraxy_records')
      .insert([
        {
          tenant_id,
          dispatch_id: dispatch_id || null,
          contract_id: contract_id || null,
          deceased_name,
          death_cause,
          thanatopractor_name,
          thanatopractor_register,
          method,
          body_condition,
          arterial_fluid_ml: Number(arterial_fluid_ml),
          cavity_fluid_ml: Number(cavity_fluid_ml),
          other_supplies,
          preservation_validity_hours: Number(preservation_validity_hours),
          observations,
          procedure_date: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (rErr) throw rErr;

    // 2. Gravar auditoria operacional
    await supabase.from('dispatch_audit_logs').insert([
      {
        tenant_id,
        dispatch_id: dispatch_id || record.id,
        action: 'SOMATOCONSERVACAO_CONCLUIDA',
        actor_name: thanatopractor_name,
        actor_role: 'tanatopractor',
        details: {
          record_id: record.id,
          deceased_name,
          method,
          arterial_fluid_ml,
          cavity_fluid_ml,
          validity_hours: preservation_validity_hours
        },
        created_at: new Date().toISOString()
      }
    ]);

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao registrar tanatopraxia.' }, { status: 500 });
  }
}