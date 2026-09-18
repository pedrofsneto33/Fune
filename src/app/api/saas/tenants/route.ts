import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/http-error';

export const dynamic = 'force-dynamic';

// ============================================================
// PAINEL ADMIN SaaS — TENANTS + ASSINATURA AGREGADA + MRR
// GET /api/saas/tenants  (somente superadmin global)
// - 2 queries: tenants + saas_subscriptions (nao-canceled)
// - junta em memoria por tenant_id (indice unico parcial garante
//   1 assinatura nao-canceled por tenant)
// - KPIs:
//   * mrr_total: sum(valor) de status active + past_due (trial NAO entra)
//   * ativos: count(status = 'active')
//   * inadimplentes: count(past_due OU grace_until vencido sem status active)
// ============================================================

interface SubRow {
  tenant_id: string;
  plan: string;
  status: string;
  valor: number;
  next_due_date: string | null;
  grace_until: string | null;
}

interface TenantRow {
  id: string;
  name: string | null;
  cnpj: string | null;
  commercial_plan: string | null;
  status: string | null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Inadimplente: marcado como past_due OU estourou o periodo de graca
// sem estar 'active' (ex: suspended). trial sem grace_until nao conta.
function isDelinquent(sub: SubRow, now: number): boolean {
  if (sub.status === 'past_due') return true;
  if (sub.status === 'active') return false;
  if (!sub.grace_until) return false;
  const grace = new Date(sub.grace_until).getTime();
  return Number.isFinite(grace) && grace < now;
}

export const GET = withAuth(async (_req: NextRequest) => {
  try {
    const { data: tenantsData, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, cnpj, commercial_plan, status')
      .order('name', { ascending: true });

    if (tenantsError) {
      return serverError(tenantsError, '[saas/tenants] erro ao listar tenants');
    }

    const { data: subsData, error: subsError } = await supabaseAdmin
      .from('saas_subscriptions')
      .select('tenant_id, plan, status, valor, next_due_date, grace_until')
      .neq('status', 'canceled');

    if (subsError) {
      return serverError(subsError, '[saas/tenants] erro ao listar assinaturas');
    }

    const byTenant = new Map<string, SubRow>();
    for (const s of (subsData || []) as SubRow[]) {
      if (s && s.tenant_id) byTenant.set(s.tenant_id, s);
    }

    const now = Date.now();
    let mrrTotal = 0;
    let ativos = 0;
    let inadimplentes = 0;

    for (const s of byTenant.values()) {
      const valor = Number(s.valor) || 0;
      if (s.status === 'active' || s.status === 'past_due') mrrTotal += valor;
      if (s.status === 'active') ativos += 1;
      if (isDelinquent(s, now)) inadimplentes += 1;
    }

    const list = (tenantsData || []) as TenantRow[];

    return NextResponse.json({
      success: true,
      kpis: {
        mrr_total: round2(mrrTotal),
        ativos,
        inadimplentes,
        total_tenants: list.length,
      },
      tenants: list.map((t) => {
        const s = byTenant.get(t.id);
        return {
          id: t.id,
          name: t.name,
          cnpj: t.cnpj,
          commercial_plan: t.commercial_plan,
          status: t.status,
          subscription: s
            ? {
                plan: s.plan,
                status: s.status,
                valor: Number(s.valor) || 0,
                next_due_date: s.next_due_date,
                grace_until: s.grace_until,
              }
            : null,
        };
      }),
    });
  } catch (err) {
    return serverError(err, '[saas/tenants]');
  }
}, ['superadmin'], { requireGlobal: true });
