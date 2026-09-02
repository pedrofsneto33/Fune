import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeString, isValidUUID } from '@/lib/validation';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .select(`
        *,
        contract:contracts(id, status, plan:plans(name)),
        burial:chapel_burials(id, deceased_name, burial_date, status, cemetery_location),
        vehicle:vehicles(id, plate, model, status),
        items:service_order_items(id, quantity, unit_price, inventory:inventory(id, item_name, category))
      `)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar serviços' }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const {
      contract_id,
      deceased_name,
      deceased_type,
      deceased_id,
      burial_date,
      cemetery_location,
      vehicle_id,
      items,
      notes,
    } = body;

    if (!deceased_name || !deceased_type || !deceased_id) {
      return NextResponse.json({ error: 'Dados do falecido são obrigatórios' }, { status: 400 });
    }

    if (!['holder', 'dependent', 'free'].includes(deceased_type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    if (contract_id && !isValidUUID(contract_id)) {
      return NextResponse.json({ error: 'Contrato inválido' }, { status: 400 });
    }

    if (vehicle_id && !isValidUUID(vehicle_id)) {
      return NextResponse.json({ error: 'Veículo inválido' }, { status: 400 });
    }

    const { data: serviceOrder, error: soError } = await supabaseAdmin
      .from('service_orders')
      .insert({
        tenant_id: auth.tenantId,
        contract_id: contract_id || null,
        deceased_name: sanitizeString(deceased_name, 255),
        deceased_type,
        deceased_id,
        burial_date: burial_date || null,
        cemetery_location: sanitizeString(cemetery_location || '', 255),
        vehicle_id: vehicle_id || null,
        notes: sanitizeString(notes || '', 1000),
        status: 'pending',
      })
      .select()
      .single();

    if (soError) {
      return NextResponse.json({ error: 'Erro ao criar serviço: ' + soError.message }, { status: 500 });
    }

    const { data: burial, error: burialError } = await supabaseAdmin
      .from('chapel_burials')
      .insert({
        tenant_id: auth.tenantId,
        contract_id: contract_id || null,
        deceased_name: sanitizeString(deceased_name, 255),
        burial_date: burial_date || new Date().toISOString(),
        cemetery_location: sanitizeString(cemetery_location || '', 255),
        status: 'Agendado',
      })
      .select()
      .single();

    if (burialError) {
      await supabaseAdmin.from('service_orders').delete().eq('id', serviceOrder.id);
      return NextResponse.json({ error: 'Erro ao criar registro de óbito' }, { status: 500 });
    }

    await supabaseAdmin
      .from('service_orders')
      .update({ burial_id: burial.id })
      .eq('id', serviceOrder.id);

    if (vehicle_id) {
      await supabaseAdmin
        .from('vehicles')
        .update({ status: 'Em Missão' })
        .eq('id', vehicle_id)
        .eq('tenant_id', auth.tenantId);
    }

    if (items && Array.isArray(items) && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        tenant_id: auth.tenantId,
        service_order_id: serviceOrder.id,
        inventory_id: item.inventory_id,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
      }));

      await supabaseAdmin.from('service_order_items').insert(orderItems);

      for (const item of items) {
        if (item.inventory_id) {
          await supabaseAdmin.rpc('decrement_stock', {
            item_id: item.inventory_id,
            qty: item.quantity || 1,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      service_order: { ...serviceOrder, burial_id: burial.id },
      burial,
    }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant']);

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { id, status, vehicle_id } = body;
    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const updateData: any = {};
    if (status) {
      if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
      }
      updateData.status = status;
    }
    if (vehicle_id) {
      if (!isValidUUID(vehicle_id)) {
        return NextResponse.json({ error: 'Veículo inválido' }, { status: 400 });
      }
      updateData.vehicle_id = vehicle_id;
    }
    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar serviço' }, { status: 500 });
    }
    if (status === 'completed' && data.vehicle_id) {
      await supabaseAdmin.from('vehicles').update({ status: 'Disponível' }).eq('id', data.vehicle_id).eq('tenant_id', auth.tenantId);
    }
    if (vehicle_id) {
      await supabaseAdmin.from('vehicles').update({ status: 'Em Missão' }).eq('id', vehicle_id).eq('tenant_id', auth.tenantId);
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant']);

export const DELETE = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const { data: service } = await supabaseAdmin
      .from('service_orders')
      .select('vehicle_id')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from('service_orders')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId);
    if (error) {
      return NextResponse.json({ error: 'Erro ao cancelar serviço' }, { status: 500 });
    }
    if (service?.vehicle_id) {
      await supabaseAdmin.from('vehicles').update({ status: 'Disponível' }).eq('id', service.vehicle_id).eq('tenant_id', auth.tenantId);
    }
    return NextResponse.json({ success: true, message: 'Serviço cancelado' });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager']);
