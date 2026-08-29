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

// GET: Listar rotas e borderô de recebimentos do cobrador
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get('tenant_id');

    let routesQuery = supabase.from('collection_routes').select('*').order('name');
    let receiptsQuery = supabase
      .from('collection_receipts')
      .select('*, collection_routes(name)')
      .order('received_at', { ascending: false });

    if (tenant_id && tenant_id !== 'all') {
      routesQuery = routesQuery.eq('tenant_id', tenant_id);
      receiptsQuery = receiptsQuery.eq('tenant_id', tenant_id);
    }

    const [routesRes, receiptsRes] = await Promise.all([routesQuery, receiptsQuery]);

    if (routesRes.error) throw routesRes.error;

    return NextResponse.json({
      routes: routesRes.data || [],
      receipts: receiptsRes.data || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar rotas de cobrança.' }, { status: 500 });
  }
}

// POST: Registrar baixa presencial em dinheiro pelo cobrador
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();

    const {
      tenant_id = 'matriz',
      route_id,
      collector_name,
      contract_id,
      holder_name,
      amount_collected,
      payment_method = 'Dinheiro',
      notes
    } = body;

    if (!collector_name || !holder_name || !amount_collected) {
      return NextResponse.json(
        { error: 'Cobrador, titular e valor recebido são obrigatórios.' },
        { status: 400 }
      );
    }

    // 1. Inserir recibo do cobrador
    const { data: receipt, error: rErr } = await supabase
      .from('collection_receipts')
      .insert([
        {
          tenant_id,
          route_id: route_id || null,
          collector_name,
          contract_id: contract_id || null,
          holder_name,
          amount_collected: Number(amount_collected),
          payment_method,
          notes,
          status: 'Recebido',
          received_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (rErr) throw rErr;

    // 2. Dar baixa na mensalidade correspondente na tabela payments se contract_id existir
    if (contract_id) {
      await supabase
        .from('payments')
        .update({
          status: 'Pago',
          paid_at: new Date().toISOString(),
          payment_method: `Cobrador Presencial (${payment_method})`
        })
        .eq('contract_id', contract_id)
        .eq('status', 'Pendente')
        .order('due_date', { ascending: true })
        .limit(1);

      await supabase
        .from('contracts')
        .update({ status: 'Ativo', last_payment_date: new Date().toISOString() })
        .eq('id', contract_id);
    }

    // 3. Gravar log de auditoria
    await supabase.from('dispatch_audit_logs').insert([
      {
        tenant_id,
        dispatch_id: contract_id || receipt.id,
        action: 'RECEBIMENTO_COBRADOR_PRESENCIAL',
        actor_name: collector_name,
        actor_role: 'cobrador',
        details: {
          receipt_id: receipt.id,
          holder_name,
          amount: amount_collected,
          payment_method
        },
        created_at: new Date().toISOString()
      }
    ]);

    return NextResponse.json({ success: true, receipt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao registrar baixa do cobrador.' }, { status: 500 });
  }
}