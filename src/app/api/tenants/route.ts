import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = await verifyApiAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Apenas usuários autenticados podem consultar tenants, sem expor chaves cruciais em texto puro
  const { data, error } = await auth.supabaseAdmin
    .from('tenants')
    .select('id, name, slug, created_at');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tenants: data }, { status: 200 });
}

export async function POST(request: Request) {
  const auth = await verifyApiAuth(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { name, slug, asaas_api_key } = body;

    const { data, error } = await auth.supabaseAdmin
      .from('tenants')
      .insert([{ name, slug, asaas_api_key }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, tenant: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
