import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/http-error';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const {
      dispatch_id,
      action,
      actor_name,
      actor_role,
      details,
      vehicle_plate,
      driver_name
    } = body;

    if (!dispatch_id || !action || !actor_name) {
      return NextResponse.json(
        { error: 'Campos obrigatorios: dispatch_id, action, actor_name' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('dispatch_audit_logs')
      .insert([
        {
          tenant_id: auth.tenantId,
          dispatch_id,
          action,
          actor_name,
          actor_role: actor_role || 'atendente',
          details: details || {},
          vehicle_plate: vehicle_plate || null,
          driver_name: driver_name || null,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.warn('Aviso ao registrar log de auditoria:', error.message);
      return NextResponse.json({ success: false, warning: error.message }, { status: 200 });
    }

    return NextResponse.json({ success: true, log: data });
  } catch (err: any) {
    return serverError(err);
  }
}, ['superadmin', 'admin', 'manager', 'attendant', 'driver', 'financial']);

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const dispatchId = searchParams.get('dispatch_id');

    let query = supabaseAdmin
      .from('dispatch_audit_logs')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (dispatchId) query = query.eq('dispatch_id', dispatchId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data || [] });
  } catch (err: any) {
    return serverError(err);
  }
}, ['superadmin', 'admin', 'manager', 'attendant', 'driver', 'financial']);
