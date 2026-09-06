import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeString, isValidUUID } from '@/lib/validation';

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('chapel_burials')
      .select('id, deceased_name, burial_date, cemetery_location, status, created_at')
      .eq('tenant_id', auth.tenantId)
      .order('burial_date', { ascending: false })
      .limit(100); // SECURITY: Limit results to prevent DoS

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar registros' }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno ao processar requisição' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant', 'driver']);

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    const { id, deceased_name, cemetery_location, status, burial_date } = body;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    // SECURITY: allowlist de campos — nunca aplicar o body inteiro no update
    const updateData: Record<string, unknown> = {};

    // Sanitize string fields
    if (deceased_name !== undefined) updateData.deceased_name = sanitizeString(deceased_name, 255);
    if (cemetery_location !== undefined) updateData.cemetery_location = sanitizeString(cemetery_location, 255);
    if (status !== undefined) updateData.status = sanitizeString(status, 50);

    // Validate burial_date if provided
    if (burial_date) {
      const parsedDate = new Date(burial_date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Data de sepultamento inválida.' }, { status: 400 });
      }
      updateData.burial_date = parsedDate.toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('chapel_burials')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select('id, deceased_name, burial_date, cemetery_location, status, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno ao processar requisição' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant']);

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json();
    
    // SECURITY: Sanitize inputs
    const deceased_name = sanitizeString(body.deceased_name, 255);
    const cemetery_location = sanitizeString(body.cemetery_location || 'Cemitério Municipal', 255);
    const contract_id = body.contract_id || null;

    if (contract_id && !isValidUUID(contract_id)) {
      return NextResponse.json({ error: 'Contrato inválido.' }, { status: 400 });
    }
    if (contract_id) {
      // SECURITY: o contrato referenciado deve pertencer a este tenant
      const { data: ownedContract } = await supabaseAdmin
        .from('contracts')
        .select('id')
        .eq('id', contract_id)
        .eq('tenant_id', auth.tenantId)
        .maybeSingle();
      if (!ownedContract) {
        return NextResponse.json({ error: 'Contrato não encontrado para esta unidade.' }, { status: 404 });
      }
    }

    // Validation
    if (!deceased_name || deceased_name.length < 2) {
      return NextResponse.json({ error: 'Nome do falecido é obrigatório (mínimo 2 caracteres).' }, { status: 400 });
    }

    // Validate burial_date if provided
    let burial_date = new Date().toISOString();
    if (body.burial_date) {
      const parsedDate = new Date(body.burial_date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Data de sepultamento inválida.' }, { status: 400 });
      }
      burial_date = parsedDate.toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('chapel_burials')
      .insert([{
        tenant_id: auth.tenantId,
        contract_id: contract_id,
        deceased_name: deceased_name,
        burial_date: burial_date,
        cemetery_location: cemetery_location,
        status: 'Agendado',
      }])
      .select('id, deceased_name, burial_date, cemetery_location, status, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao criar registro' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno ao processar requisição' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager', 'attendant', 'driver']);

export const DELETE = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('chapel_burials')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId);

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao excluir registro: ' + error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, message: 'Registro de óóóbito excluído.' });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno ao processar requisição' }, { status: 500 });
  }
}, ['superadmin', 'admin', 'manager']);

