import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidUUID, sanitizeString } from '@/lib/validation';
import { getFiscalConfig } from '@/lib/fiscal';
import { focusnfeCancel } from '@/lib/fiscal/focusnfe';

export const dynamic = 'force-dynamic';

// POST /api/fiscal/cancel - cancela uma NFS-e ja autorizada
export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { invoice_id, reason } = body;

    if (!invoice_id || !isValidUUID(invoice_id)) {
      return NextResponse.json({ error: 'invoice_id invalido' }, { status: 400 });
    }
    const sanitizedReason = sanitizeString(reason, 500);
    if (!sanitizedReason || sanitizedReason.trim().length < 15) {
      return NextResponse.json({ error: 'Justificativa deve ter no minimo 15 caracteres' }, { status: 400 });
    }

    // Carrega invoice
    const { data: invoice, error: invErr } = await supabaseAdmin
      .from('fiscal_invoices')
      .select('*')
      .eq('id', invoice_id)
      .eq('tenant_id', auth.tenantId)
      .single();
    if (invErr || !invoice) {
      return NextResponse.json({ error: 'NFS-e nao encontrada' }, { status: 404 });
    }
    if (invoice.nfse_status === 'cancelled') {
      return NextResponse.json({ error: 'NFS-e ja foi cancelada' }, { status: 400 });
    }
    if (invoice.nfse_status !== 'authorized') {
      return NextResponse.json({
        error: 'So e possivel cancelar NFS-e autorizada (status atual: ' + invoice.nfse_status + ')',
      }, { status: 400 });
    }

    const config = await getFiscalConfig(auth.tenantId);
    if (!config) {
      return NextResponse.json({ error: 'Configuracao fiscal nao definida' }, { status: 400 });
    }
    if (!invoice.provider_invoice_id) {
      return NextResponse.json({ error: 'NFS-e sem reference do provedor' }, { status: 400 });
    }

    try {
      const resp = await focusnfeCancel(config, invoice.provider_invoice_id, sanitizedReason);
      await supabaseAdmin
        .from('fiscal_invoices')
        .update({
          nfse_status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by_user_id: auth.userId,
          cancellation_reason: sanitizedReason,
          cancellation_nfse_number: resp.numero,
          provider_response_payload: resp,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice_id);

      // Atualiza service_order
      if (invoice.service_order_id) {
        await supabaseAdmin
          .from('service_orders')
          .update({ nfse_status: 'cancelled' })
          .eq('id', invoice.service_order_id);
      }
      return NextResponse.json({ success: true, message: 'NFS-e cancelada' });
    } catch (provErr: any) {
      await supabaseAdmin
        .from('fiscal_invoices')
        .update({
          provider_error_message: provErr.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice_id);
      return NextResponse.json({ error: 'Erro do provedor: ' + provErr.message }, { status: 502 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial']);
