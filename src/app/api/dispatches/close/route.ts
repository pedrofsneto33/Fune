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
      vehicle_id,
      odometer_end,
      fuel_liters_added = 0,
      fuel_cost = 0,
      notes,
      closed_by,
      user_role
    } = body;

    const tenant_id = auth.tenantId;

    if (!dispatch_id || odometer_end === undefined || odometer_end === null) {
      return NextResponse.json(
        { error: 'Parametros obrigatorios ausentes (dispatch_id, odometer_end).' },
        { status: 400 }
      );
    }

    const { data: dispatch, error: dErr } = await supabaseAdmin
      .from('dispatches')
      .select('*')
      .eq('id', dispatch_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (dErr || !dispatch) {
      return NextResponse.json({ error: 'Despacho nao localizado nesta unidade.' }, { status: 404 });
    }

    const odometerStart = Number(dispatch?.odometer_start || 0);
    const odometerEndNum = Number(odometer_end);

    if (odometerStart > 0 && odometerEndNum < odometerStart) {
      return NextResponse.json(
        { error: `Odometro final (${odometerEndNum} km) nao pode ser menor que o inicial (${odometerStart} km).` },
        { status: 400 }
      );
    }

    const kmTraveled = odometerStart > 0 ? odometerEndNum - odometerStart : 0;

    const { data: updatedDispatch, error: updateErr } = await supabaseAdmin
      .from('dispatches')
      .update({
        status: 'Finalizado',
        odometer_end: odometerEndNum,
        km_traveled: kmTraveled,
        fuel_liters_added: Number(fuel_liters_added),
        fuel_cost: Number(fuel_cost),
        closed_at: new Date().toISOString(),
        closure_notes: notes || null
      })
      .eq('id', dispatch_id)
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (updateErr) {
      console.error('[API_ERROR] dispatches/close', updateErr);
      return NextResponse.json(
        { error: 'Erro interno ao fechar despacho.' },
        { status: 500 }
      );
    }

    const targetVehicleId = vehicle_id || dispatch?.vehicle_id;
    if (targetVehicleId) {
      await supabaseAdmin
        .from('vehicles')
        .update({
          odometer: odometerEndNum,
          status: 'Disponivel',
          last_maintenance_check: new Date().toISOString()
        })
        .eq('id', targetVehicleId)
        .eq('tenant_id', tenant_id);
    }

    await supabaseAdmin.from('dispatch_audit_logs').insert([
      {
        tenant_id,
        dispatch_id,
        action: 'FINALIZADO',
        actor_name: closed_by || 'Operador',
        actor_role: user_role || 'atendente',
        vehicle_plate: dispatch?.vehicle_plate || null,
        driver_name: dispatch?.driver_agent || dispatch?.driver_name || null,
        details: {
          odometer_start: odometerStart,
          odometer_end: odometerEndNum,
          km_traveled: kmTraveled,
          fuel_liters_added: Number(fuel_liters_added),
          fuel_cost: Number(fuel_cost),
          closure_notes: notes
        },
        created_at: new Date().toISOString()
      }
    ]);

    return NextResponse.json({
      success: true,
      dispatch: updatedDispatch,
      km_traveled: kmTraveled
    });
  } catch (err: any) {
    return serverError(err);
  }
}, ['superadmin', 'admin', 'manager', 'driver']);
