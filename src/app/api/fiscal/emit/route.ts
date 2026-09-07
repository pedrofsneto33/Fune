import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeString, isValidUUID } from '@/lib/validation';
import { getFiscalConfig } from '@/lib/fiscal';
import { focusnfeEmit } from '@/lib/fiscal/focusnfe';

export const dynamic = 'force-dynamic';

// POST /api/fiscal/emit - emite uma NFS-e
export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { service_order_id, taker, service } = body;

    if (!service_order_id || !isValidUUID(service_order_id)) {
      return NextResponse.json({ error: 'service_order_id invalido' }, { status: 400 });
    }
    if (!taker || !taker.document || !taker.name || !taker.documentType) {
      return NextResponse.json({ error: 'Dados do tomador incompletos' }, { status: 400 });
    }
    if (!service || !service.description || !service.amount) {
      return NextResponse.json({ error: 'Dados do servico incompletos' }, { status: 400 });
    }

    // Verifica que a service_order pertence ao tenant
    const { data: so, error: soErr } = await supabaseAdmin
      .from('service_orders')
      .select('id, tenant_id, deceased_name, status, total_amount')
      .eq('id', service_order_id)
      .eq('tenant_id', auth.tenantId)
      .single();
    if (soErr || !so) {
      return NextResponse.json({ error: 'Ordem de servico nao encontrada' }, { status: 404 });
    }

    // Carrega config fiscal
    const config = await getFiscalConfig(auth.tenantId);
    if (!config) {
      return NextResponse.json({
        error: 'Configuracao fiscal nao definida. Acesse Configuracoes da Empresa > Fiscal para configurar.',
      }, { status: 400 });
    }

    // Gera reference unica
    const ref = `os-${service_order_id.substring(0, 8)}-${Date.now()}`;

    // Cria registro na fiscal_invoices (status pending) ANTES de chamar o provedor
    const insertData: any = {
      tenant_id: auth.tenantId,
      service_order_id,
      provider: config.provider,
      provider_environment: config.environment,
      provider_invoice_id: ref,
      nfse_status: 'processing',
      taker_document_type: taker.documentType,
      taker_document: taker.document.replace(/\D/g, ''),
      taker_name: sanitizeString(taker.name, 200),
      taker_email: taker.email || null,
      taker_phone: taker.phone || null,
      taker_zip_code: taker.zipCode || null,
      taker_address: taker.address || null,
      taker_number: taker.number || null,
      taker_complement: taker.complement || null,
      taker_neighborhood: taker.neighborhood || null,
      taker_city: taker.city || null,
      taker_state: taker.state || null,
      service_code: service.code || config.defaultServiceCode,
      service_description: sanitizeString(service.description, 500),
      service_amount: Number(service.amount),
      deduction_amount: Number(service.deductionAmount || 0),
      tax_rate: config.defaultIssRate,
      iss_amount: (Number(service.amount) * config.defaultIssRate) / 100,
      taxable_amount: Number(service.amount) - Number(service.deductionAmount || 0),
      created_by_user_id: auth.userId,
      provider_request_payload: { ref, config: { provider: config.provider, env: config.environment } },
    };
    const { data: fiscalRow, error: insErr } = await supabaseAdmin
      .from('fiscal_invoices')
      .insert(insertData)
      .select()
      .single();
    if (insErr || !fiscalRow) {
      return NextResponse.json({ error: 'Erro ao criar registro: ' + (insErr?.message || '') }, { status: 500 });
    }

    // Chama FocusNFe
    try {
      const resp = await focusnfeEmit(config, { tenantId: auth.tenantId, serviceOrderId: service_order_id, taker, service }, ref);

      // Atualiza registro com retorno
      const statusMap: Record<string, string> = {
        processando: 'processing',
        autorizado: 'authorized',
        erro: 'error',
        cancelado: 'cancelled',
        denegado: 'rejected',
      };
      const newStatus = statusMap[resp.status] || 'processing';
      const { data: updated } = await supabaseAdmin
        .from('fiscal_invoices')
        .update({
          nfse_status: newStatus,
          nfse_number: resp.numero,
          nfse_verification_code: resp.codigo_verificacao,
          pdf_url: resp.url_pdf,
          xml_url: resp.url_xml,
          provider_response_payload: resp,
          issued_at: newStatus === 'authorized' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fiscalRow.id)
        .select()
        .single();

      // Atualiza service_order
      await supabaseAdmin
        .from('service_orders')
        .update({
          nfse_id: newStatus === 'authorized' ? fiscalRow.id : null,
          nfse_status: newStatus,
        })
        .eq('id', service_order_id);

      return NextResponse.json({
        success: true,
        invoice: updated,
        message: newStatus === 'authorized'
          ? `NFS-e autorizada: ${resp.numero}`
          : newStatus === 'processing'
            ? 'NFS-e em processamento, aguarde.'
            : `NFS-e: ${newStatus}. ${resp.mensagem_erro || ''}`,
      });
    } catch (provErr: any) {
      // Marca como error no banco
      await supabaseAdmin
        .from('fiscal_invoices')
        .update({
          nfse_status: 'error',
          provider_error_message: provErr.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fiscalRow.id);
      return NextResponse.json({
        error: 'Erro do provedor: ' + provErr.message,
        invoice_id: fiscalRow.id,
      }, { status: 502 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial', 'attendant']);
