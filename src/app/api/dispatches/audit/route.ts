import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-key';
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenant_id,
      dispatch_id,
      action,
      actor_name,
      actor_role,
      details,
      vehicle_plate,
      driver_name
    } = body;

    if (!tenant_id || !dispatch_id || !action || !actor_name) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tenant_id, dispatch_id, action, actor_name' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('dispatch_audit_logs')
      .insert([
        {
          tenant_id,
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
    return NextResponse.json({ error: err.message || 'Erro ao registrar log' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dispatchId = searchParams.get('dispatch_id');
    const tenantId = searchParams.get('tenant_id');

    if (!dispatchId && !tenantId) {
      return NextResponse.json({ error: 'Informe dispatch_id ou tenant_id' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    let query = supabase
      .from('dispatch_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (dispatchId) query = query.eq('dispatch_id', dispatchId);
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao consultar logs' }, { status: 500 });
  }
}