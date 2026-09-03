import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// Trilha de auditoria — restrita a perfis administrativos, sempre scoped no tenant.
export const GET = withAuth(async (_req: NextRequest, { auth }) => {
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select('id, action, user_email, details, created_at')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return NextResponse.json({ logs: data || [] });
}, ['superadmin', 'admin']);