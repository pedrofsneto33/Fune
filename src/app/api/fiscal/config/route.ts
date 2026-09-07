import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// PATCH /api/fiscal/config - atualiza configuracao fiscal do tenant
export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const updateData: Record<string, any> = {};

    // Campos permitidos (allowlist - nunca enviar tenant_id)
    const allowed: Record<string, (v: any) => any> = {
      fiscal_provider: (v) => sanitizeString(v, 50) || null,
      fiscal_environment: (v) => v === 'production' ? 'production' : 'sandbox',
      fiscal_api_key: (v) => sanitizeString(v, 500) || null,
      fiscal_company_document: (v) => (v || '').replace(/\D/g, '').substring(0, 18) || null,
      fiscal_company_name: (v) => sanitizeString(v, 200) || null,
      fiscal_company_zip: (v) => (v || '').replace(/\D/g, '').substring(0, 8) || null,
      fiscal_company_address: (v) => sanitizeString(v, 200) || null,
      fiscal_company_number: (v) => sanitizeString(v, 20) || null,
      fiscal_company_neighborhood: (v) => sanitizeString(v, 100) || null,
      fiscal_company_city: (v) => sanitizeString(v, 100) || null,
      fiscal_company_state: (v) => sanitizeString(v, 2)?.toUpperCase() || null,
      fiscal_company_phone: (v) => (v || '').replace(/\D/g, '').substring(0, 20) || null,
      fiscal_company_email: (v) => sanitizeString(v, 200) || null,
      fiscal_company_ibge_code: (v) => (v || '').replace(/\D/g, '').substring(0, 7) || null,
      fiscal_company_tax_regime: (v) => ['simples_nacional','lucro_presumido','lucro_real','mei'].includes(v) ? v : null,
      fiscal_cnae: (v) => (v || '').replace(/\D/g, '').substring(0, 10) || null,
      fiscal_default_service_code: (v) => sanitizeString(v, 20) || null,
      fiscal_default_service_description: (v) => sanitizeString(v, 500) || null,
      fiscal_default_iss_rate: (v) => {
        const n = Number(v);
        return (isNaN(n) || n < 0 || n > 100) ? 5 : n;
      },
      fiscal_auto_emit: (v) => !!v,
    };

    for (const key of Object.keys(allowed)) {
      if (body[key] !== undefined) {
        updateData[key] = allowed[key](body[key]);
      }
    }
    updateData.fiscal_last_test_at = null;
    updateData.fiscal_last_test_status = null;

    const { error } = await supabaseAdmin
      .from('tenants')
      .update(updateData)
      .eq('id', auth.tenantId);
    if (error) {
      return NextResponse.json({ error: 'Erro ao salvar: ' + error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Configuracao fiscal salva.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial']);

// GET /api/fiscal/config - le config fiscal do tenant
export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select(`
        fiscal_provider, fiscal_environment, fiscal_api_key,
        fiscal_company_document, fiscal_company_name, fiscal_company_zip,
        fiscal_company_address, fiscal_company_number, fiscal_company_neighborhood,
        fiscal_company_city, fiscal_company_state, fiscal_company_phone,
        fiscal_company_email, fiscal_company_ibge_code, fiscal_company_tax_regime,
        fiscal_cnae, fiscal_default_service_code, fiscal_default_service_description,
        fiscal_default_iss_rate, fiscal_auto_emit,
        fiscal_last_test_at, fiscal_last_test_status
      `)
      .eq('id', auth.tenantId)
      .single();
    if (error) {
      return NextResponse.json({ error: 'Erro: ' + error.message }, { status: 500 });
    }
    // Mascara a API key no retorno (somente para o GET)
    const masked = data.fiscal_api_key
      ? data.fiscal_api_key.substring(0, 4) + '***' + data.fiscal_api_key.substring(data.fiscal_api_key.length - 4)
      : null;
    return NextResponse.json({ ...data, fiscal_api_key_masked: masked });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial', 'attendant']);
