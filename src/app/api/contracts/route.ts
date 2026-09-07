import { NextRequest, NextResponse } from 'next/server';
import { isWithinGracePeriod } from '@/lib/eligibility';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidUUID } from '@/lib/validation';
export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin
    .from('contracts')
    .select('*, holders(*), plans(*)')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
});

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  const body = await req.json();
  const { holder_id, plan_id, status = 'active', start_date, seller_name } = body;

  if (!holder_id || !plan_id) {
    return NextResponse.json({ error: 'holder_id e plan_id são obrigatórios.' }, { status: 400 });
  }

  // Validar que o holder pertence ao tenant
  const { data: h, error: hErr } = await supabaseAdmin
    .from('holders')
    .select('id')
    .eq('id', holder_id)
    .eq('tenant_id', auth.tenantId)
    .single();

  if (hErr || !h) {
    return NextResponse.json({ error: 'Titular não encontrado para este tenant.' }, { status: 404 });
  }

  // Validar que o plan pertence ao tenant
  const { data: p, error: pErr } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('id', plan_id)
    .eq('tenant_id', auth.tenantId)
    .single();

  if (pErr || !p) {
    return NextResponse.json({ error: 'Plano não encontrado para este tenant.' }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from('contracts')
    .insert([{
      tenant_id: auth.tenantId,
      holder_id,
      plan_id,
      status,
      start_date: start_date || new Date().toISOString().split('T')[0],
      seller_name: seller_name ? String(seller_name).trim() : null,
    }])
    .select('*, holders(*), plans(*)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}, ['superadmin', 'admin', 'manager', 'attendant']);

export const DELETE = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !isValidUUID(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    // 1) Buscar contrato para checar carência e vendedor
    const { data: contract } = await supabaseAdmin
      .from("contracts")
      .select("id, seller_name, start_date")
      .eq("id", id)
      .eq("tenant_id", auth.tenantId)
      .single();
    if (!contract) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });

    // 2) Estorno: se cancelamento em carência, reverte comissão inicial pendente
    if (contract.seller_name && isWithinGracePeriod(contract.start_date)) {
      // Encontra a comissão inicial (mais antiga, calculada com rate initial) deste contrato
      const { data: initialComm } = await supabaseAdmin
        .from("commissions")
        .select("id, status")
        .eq("contract_id", id)
        .eq("tenant_id", auth.tenantId)
        .eq("status", "pendente")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      if (initialComm) {
        await supabaseAdmin
          .from("commissions")
          .update({ status: "estornado" })
          .eq("id", initialComm.id)
          .eq("tenant_id", auth.tenantId);
      }
      // Se já estava pago, NÃO mexe (decisão financeira/RH, não silenciosa)
    }

    // 3) Deletar contrato (contratos tem ON DELETE RESTRICT em holder_id: remove contratos primeiro)
    const { error } = await supabaseAdmin
      .from("contracts")
      .delete()
      .eq("id", id)
      .eq("tenant_id", auth.tenantId);
    if (error) return NextResponse.json({ error: "Erro ao excluir contrato" }, { status: 500 });

    return NextResponse.json({ success: true, message: "Contrato excluído com sucesso" });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}, ["superadmin", "admin", "manager"]);