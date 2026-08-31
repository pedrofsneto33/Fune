import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const results: any = {};

  try {
    const { data, error } = await supabaseAdmin.from('tenants').select('id').limit(1);
    results.connection = error ? `ERRO: ${error.message}` : 'OK';
  } catch (e: any) {
    results.connection = `EXCECAO: ${e.message}`;
  }

  return NextResponse.json({
    ...results,
    message: 'Se houver erro acima, execute o SQL manualmente no Supabase Dashboard',
    sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS public.tenants (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, cnpj VARCHAR(18) UNIQUE NOT NULL, status VARCHAR(20) DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.user_roles (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE, role VARCHAR(50) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE (user_id, tenant_id));
CREATE TABLE IF NOT EXISTS public.chapel_burials (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE, deceased_name VARCHAR(255) NOT NULL, burial_date TIMESTAMPTZ NOT NULL, cemetery_location VARCHAR(255), status VARCHAR(50) DEFAULT 'scheduled', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.holders (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE, full_name VARCHAR(255) NOT NULL, cpf VARCHAR(14) NOT NULL, phone VARCHAR(20) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE (tenant_id, cpf));
INSERT INTO public.tenants (name, cnpj) VALUES ('Funeraria Matriz', '00000000000100') ON CONFLICT (cnpj) DO NOTHING;`,
  });
}
