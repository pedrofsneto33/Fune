import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { searchParams } = new URL(req.url);
  const contractId = searchParams.get('contractId') || searchParams.get('contract_id');
  const { data, error } = await supabaseAdmin.from('contracts').select('*, holders(*), plans(*)').eq('id', contractId).eq('tenant_id', auth.tenantId).maybeSingle();
  if (error || !data) return NextResponse.json({ eligible: false, reason: 'Contrato não encontrado.' }, { status: 404 });
  return NextResponse.json({ eligible: data.status === 'active', contract: data });
}, ['superadmin', 'admin', 'manager', 'attendant']);
