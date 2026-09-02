const fs = require('fs');

const content = `
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
`;

fs.appendFileSync('src/app/api/service-orders/route.ts', content);
console.log('Done');
