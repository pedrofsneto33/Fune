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

// GET: Listar salas e agendamentos de velório/sepultamento
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get('tenant_id');

    let roomsQuery = supabase.from('wake_rooms').select('*').order('name');
    let burialsQuery = supabase
      .from('burial_records')
      .select('*, wake_rooms(name)')
      .order('wake_start', { ascending: false });

    if (tenant_id && tenant_id !== 'all') {
      roomsQuery = roomsQuery.eq('tenant_id', tenant_id);
      burialsQuery = burialsQuery.eq('tenant_id', tenant_id);
    }

    const [roomsRes, burialsRes] = await Promise.all([roomsQuery, burialsQuery]);
    if (roomsRes.error) throw roomsRes.error;

    return NextResponse.json({
      rooms: roomsRes.data || [],
      burials: burialsRes.data || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar capelas.' }, { status: 500 });
  }
}

// POST: Agendar velório e sepultamento com controle de ocupação
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();

    const {
      tenant_id = 'matriz',
      dispatch_id,
      contract_id,
      deceased_name,
      room_id,
      wake_start,
      wake_end,
      cemetery_name,
      cemetery_plot,
      burial_type = 'Sepultamento Tradicional',
      concession_type = 'Perpétua',
      burial_date,
      observations
    } = body;

    if (!deceased_name || !cemetery_name || !burial_date || !wake_start || !wake_end) {
      return NextResponse.json(
        { error: 'Falecido, cemitério, data de sepultamento e horários de velório são obrigatórios.' },
        { status: 400 }
      );
    }

    // Calcular data elegível para exumação (3 anos após o sepultamento)
    const bDate = new Date(burial_date);
    const exhumationDate = new Date(bDate.setFullYear(bDate.getFullYear() + 3)).toISOString().split('T')[0];

    // Inserir registro de velório e sepultamento
    const { data: burial, error: bErr } = await supabase
      .from('burial_records')
      .insert([
        {
          tenant_id,
          dispatch_id: dispatch_id || null,
          contract_id: contract_id || null,
          deceased_name,
          room_id: room_id || null,
          wake_start,
          wake_end,
          cemetery_name,
          cemetery_plot,
          burial_type,
          concession_type,
          burial_date,
          exhumation_eligible_date: exhumationDate,
          status: 'Agendado',
          observations
        }
      ])
      .select()
      .single();

    if (bErr) throw bErr;

    // Se vinculou a uma sala, atualizar o status dela para Ocupada
    if (room_id) {
      await supabase.from('wake_rooms').update({ status: 'Ocupada' }).eq('id', room_id);
    }

    // Gravar log de auditoria
    await supabase.from('dispatch_audit_logs').insert([
      {
        tenant_id,
        dispatch_id: dispatch_id || burial.id,
        action: 'VELORIO_SEPULTAMENTO_AGENDADO',
        actor_name: 'Central de Cerimonial',
        actor_role: 'cerimonialista',
        details: {
          deceased_name,
          cemetery_name,
          cemetery_plot,
          wake_start,
          wake_end,
          exhumation_eligible_date: exhumationDate
        },
        created_at: new Date().toISOString()
      }
    ]);

    return NextResponse.json({ success: true, burial });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao agendar velório e sepultamento.' }, { status: 500 });
  }
}