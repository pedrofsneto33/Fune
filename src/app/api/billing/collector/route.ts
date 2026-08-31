import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin.from('payments').select('*, contracts(holders(*))').eq('tenant_id', auth.tenantId).eq('payment_method', 'cash');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}, ['superadmin', 'admin', 'financial', 'attendant']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  const { paymentId, receivedAmount } = await req.json();
  const { data, error } = await supabaseAdmin.from('payments').update({ status: 'paid', paid_at: new Date().toISOString(), amount: receivedAmount ? Number(receivedAmount) : undefined }).eq('id', paymentId).eq('tenant_id', auth.tenantId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, payment: data });
}, ['superadmin', 'admin', 'financial', 'attendant']);
