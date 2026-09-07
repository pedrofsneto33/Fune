import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/http-error';
import { isValidUUID } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { data: commissions, error } = await supabaseAdmin
      .from('commissions')
      .select('id, seller_name, amount, status, created_at, tenant_id, contracts(id, holders(name))')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, commissions: commissions || [] });
  } catch (err: any) {
    return serverError(err);
  }
}, ['superadmin', 'admin', 'manager', 'financial']);

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !isValidUUID(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    if (!["pendente", "pago", "estornado"].includes(status)) {
      return NextResponse.json({ error: "Status inválido (use: pendente, pago, estornado)" }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("commissions")
      .update({ status })
      .eq("id", id)
      .eq("tenant_id", auth.tenantId)
      .select("id, seller_name, amount, status")
      .single();
    if (error) {
      if ((error as any).code === "PGRST116") return NextResponse.json({ error: "Comissão não encontrada" }, { status: 404 });
      return NextResponse.json({ error: "Erro ao atualizar comissão" }, { status: 500 });
    }
    return NextResponse.json({ success: true, commission: data });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}, ["superadmin", "admin", "financial"]);