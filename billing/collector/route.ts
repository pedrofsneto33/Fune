import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET: Listar rotas e borderô de recebimentos do cobrador
export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const routesQuery = supabaseAdmin.from('collection_routes').select('*').eq('tenant_id', auth.tenantId).order('name');
    const receiptsQuery = supabaseAdmin
      .from('collection_receipts')
      .select('*, collection_routes(name)')
      .eq('tenant_id', auth.tenantId)
      .order('received_at', { ascending: false });

    const [routesRes, receiptsRes] = await Promise.all([routesQuery, receiptsQuery]);

    if (routesRes.error) throw routesRes.error;

    return NextResponse.json({
      routes: routesRes.data || [],
      receipts: receiptsRes.data || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar rotas de cobrança.' }, { status: 500 });
  }
});

// POST: Registrar baixa presencial em dinheiro pelo cobrador
export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const tenant_id = auth.tenantId;

    const {
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
    const { data: receipt, error: rErr } = await supabaseAdmin
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

    // 2. Dar baixa na mensalidade correspondente (só dentro do próprio tenant)
    if (contract_id) {
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'Pago',
          paid_at: new Date().toISOString(),
          payment_method: `Cobrador Presencial (${payment_method})`
        })
        .eq('contract_id', contract_id)
        .eq('tenant_id', tenant_id)
        .eq('status', 'Pendente')
        .order('due_date', { ascending: true })
        .limit(1);

      await supabaseAdmin
        .from('contracts')
        .update({ status: 'Ativo', last_payment_date: new Date().toISOString() })
        .eq('id', contract_id)
        .eq('tenant_id', tenant_id);
    }

    // 3. Gravar log de auditoria
    await supabaseAdmin.from('dispatch_audit_logs').insert([
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
}, ['superadmin', 'admin', 'manager', 'attendant', 'driver', 'financial']);