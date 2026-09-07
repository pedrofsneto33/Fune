import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET /api/fiscal/list - lista NFS-e do tenant
export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    let query = supabaseAdmin
      .from('fiscal_invoices')
      .select(`
        id, service_order_id, provider, provider_environment,
        nfse_number, nfse_status, nfse_verification_code,
        taker_document, taker_name, taker_document_type,
        service_description, service_amount, tax_rate, iss_amount,
        pdf_url, xml_url, issued_at, cancelled_at, created_at
      `)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('nfse_status', status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Erro ao listar: ' + error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, invoices: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'financial', 'attendant']);
