import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeString, isValidUUID } from '@/lib/validation';
import { isHolderActive, isContractActive } from '@/lib/eligibility';

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

    if (contract_id) {

      // SECURITY: o contrato referenciado deve pertencer a este tenant
      // E o titular do contrato deve estar ATIVO (regra única: só associados ativos)
      const { data: ownedContract } = await supabaseAdmin

        .from('contracts')

        .select('id, status, holders(status)')

        .eq('id', contract_id)

        .eq('tenant_id', auth.tenantId)

        .maybeSingle();

      if (!ownedContract) {
        return NextResponse.json({ error: 'Contrato não encontrado para esta unidade.' }, { status: 404 });
      }

      // Contrato precisa estar ativo/bilingue e o titular ativo
      const cStatus = ((ownedContract as any).status ?? '').toLowerCase();
      const hStatus =
        ((ownedContract as any).holders?.status ?? '').toLowerCase();
      // REGRA UNICA centralizada em src/lib/eligibility.ts
      const contractOk = isContractActive(cStatus);
      const holderOk = isHolderActive(hStatus);
      if (!contractOk || !holderOk) {
        return NextResponse.json(
          { error: 'Este contrato não está ativo ou o titular não está ativo. Reative o titular/contrato antes de registrar a ordem de serviço.' },
          { status: 403 },
        );
      }

    }

    // F-12: validação de veículo no escopo CORRETO — além de pertencer ao
    // tenant, o veículo não pode estar em missão em outra ordem de serviço.
    // (Antes esta checagem estava presa dentro de `if (!ownedContract)` e
    // NUNCA rodava quando o contrato existia → duas OS no mesmo veículo.)
    if (vehicle_id) {
      const { data: ownedVehicle } = await supabaseAdmin
        .from('vehicles')
        .select('id, status')
        .eq('id', vehicle_id)
        .eq('tenant_id', auth.tenantId)
        .maybeSingle();

      if (!ownedVehicle) {
        return NextResponse.json({ error: 'Veículo não encontrado para esta unidade.' }, { status: 404 });
      }
      if (ownedVehicle.status === 'Em Missão') {
        return NextResponse.json({ error: 'Este veículo já está em missão em outra ordem de serviço.' }, { status: 409 });
      }
    }

    const { data: serviceOrder, error: soError } = await supabaseAdmin
      .from('service_orders')
      .insert({
        tenant_id: auth.tenantId,
        contract_id: contract_id || null,
        deceased_name: sanitizeString(deceased_name, 255),
        deceased_type,
        deceased_id: sanitizeString(deceased_id, 50),
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

      .eq('id', serviceOrder.id)

      .eq('tenant_id', auth.tenantId);

    if (vehicle_id) {
      await supabaseAdmin
        .from('vehicles')
        .update({ status: 'Em Missão' })
        .eq('id', vehicle_id)
        .eq('tenant_id', auth.tenantId);
    }

    if (items && Array.isArray(items) && items.length > 0) {
      // SECURITY: validar UUID + ownership de cada item de estoque antes de usar
      for (const item of items) {
        if (!item.inventory_id || !isValidUUID(item.inventory_id)) {
          return NextResponse.json({ error: 'Item de estoque inválido.' }, { status: 400 });
        }
        const { data: ownedInventory } = await supabaseAdmin
          .from('inventory')
          .select('id')
          .eq('id', item.inventory_id)
          .eq('tenant_id', auth.tenantId)
          .maybeSingle();
        if (!ownedInventory) {
          return NextResponse.json({ error: 'Item de estoque não encontrado para esta unidade.' }, { status: 404 });
        }
      }
      
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
            p_item_id: item.inventory_id,
            p_tenant_id: auth.tenantId,
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
      // [CORRECAO] Checar se o veículo novo já está em missão em outra ordem
      const { data: newVehicle } = await supabaseAdmin
        .from('vehicles')
        .select('id, status')
        .eq('id', vehicle_id)
        .eq('tenant_id', auth.tenantId)
        .maybeSingle();
      if (!newVehicle) {
        return NextResponse.json({ error: 'Veículo não encontrado para esta unidade.' }, { status: 404 });
      }
      if (newVehicle.status === 'Em Missão') {
        return NextResponse.json({ error: 'Este veículo já está em missão em outra ordem de serviço.' }, { status: 409 });
      }
      updateData.vehicle_id = vehicle_id;
    }

    // Buscar a ordem atual antes de atualizar (precisamos do vehicle_id atual para
    // liberá-lo caso a troca seja efetiva, e do status anterior para a reversão de estoque).
    const { data: currentOrder, error: currentOrderErr } = await supabaseAdmin
      .from('service_orders')
      .select('vehicle_id, status')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle();
    if (currentOrderErr || !currentOrder) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada para esta unidade.' }, { status: 404 });
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
    // [CORRECAO] Reverter estoque se a ordem for cancelada e o serviço nunca
    // chegou a consumir material de fato (só se era pending ou in_progress).
    if (status === 'cancelled' && currentOrder?.status === 'pending' || status === 'cancelled' && currentOrder?.status === 'in_progress') {
      const { data: orderItems } = await supabaseAdmin
        .from('service_order_items')
        .select('inventory_id, quantity')
        .eq('service_order_id', id)
        .eq('tenant_id', auth.tenantId);
      if (orderItems && Array.isArray(orderItems)) {
        for (const item of (orderItems ?? [])) {
          if (item.inventory_id) {
            await supabaseAdmin.rpc('increment_stock', {
              p_item_id: item.inventory_id,
              p_tenant_id: auth.tenantId,
              qty: item.quantity,
            });
          }
        }
      }
    }

    }

    // [CORRECAO] Se a troca de veículo é efetiva (novo diferente do antigo), liberar o antigo
    if (vehicle_id && currentOrder?.vehicle_id && currentOrder?.vehicle_id !== vehicle_id) {
      await supabaseAdmin
        .from('vehicles')
        .update({ status: 'Disponível' })
        .eq('id', currentOrder.vehicle_id)
        .eq('tenant_id', auth.tenantId);
    }
    // Sincroniza o registro de óbito vinculado com o status da OS
    if (status && data?.burial_id) {
      const burialStatusMap: Record<string, string> = {
        pending: 'Agendado',
        in_progress: 'Em traslado',
        completed: 'Concluído',
        cancelled: 'Cancelado',
      };
      const mapped = burialStatusMap[status];
      if (mapped) {
        await supabaseAdmin
          .from('chapel_burials')
          .update({ status: mapped })
          .eq('id', data.burial_id)
          .eq('tenant_id', auth.tenantId);
      }
    }
    // Sincroniza o veículo vinculado: in_progress = Em Missão; pending/completed/cancelled = Disponível
    if (status && data?.vehicle_id) {
      const vehicleStatus = status === 'in_progress' ? 'Em Missão' : 'Disponível';
      await supabaseAdmin
        .from('vehicles')
        .update({ status: vehicleStatus })
        .eq('id', data.vehicle_id)
        .eq('tenant_id', auth.tenantId);
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
