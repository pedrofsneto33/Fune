import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select('id, name, trade_name, cnpj, phone_emergency, municipal_license_number, issuance_city, technical_manager, status, created_at')
      .order('trade_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, tenants: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, trade_name, cnpj, phone_emergency, municipal_license_number, issuance_city, technical_manager } = body;

    if (!name || !trade_name || !cnpj) {
      return NextResponse.json({ error: 'Razão Social, Nome Fantasia e CNPJ são obrigatórios.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .insert([{
        name,
        trade_name,
        cnpj,
        phone_emergency: phone_emergency || '(86) 99999-9999',
        municipal_license_number: municipal_license_number || '',
        issuance_city: issuance_city || '',
        technical_manager: technical_manager || '',
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, tenant: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}