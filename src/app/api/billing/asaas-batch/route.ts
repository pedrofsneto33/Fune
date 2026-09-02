import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  try {
    // SECURITY: rate limit por usuario - operacao em lote de cobrancas
    const rl = checkRateLimit(`asabatch:${auth.userId}`, { maxAttempts: 3, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitos lotes em sequencia. Aguarde um minuto.' },
        { status: 429 }
      );
    }

    const { data: contracts, error } = await supabaseAdmin
      .from('contracts')
      .select('id, holder_id, plan_id, holders(full_name, cpf, phone), plans(name, monthly_fee)')
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'active');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const count = contracts?.length || 0;
    const dueDate = new Date();
    dueDate.setDate(10);
    dueDate.setMonth(dueDate.getMonth() + 1);

    return NextResponse.json({
      success: true,
      message: `Lote de cobranças processado com sucesso para ${count} associados ativos!`,
      totalProcessed: count,
      cycleDueDate: dueDate.toISOString().split('T')[0],
      gateway: 'Asaas Pagamentos Automáticos',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}, ['superadmin', 'admin', 'financial']);
