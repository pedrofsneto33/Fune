import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { serverError } from "@/lib/http-error";

export const GET = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // --- Contagens básicas (paralelas) ---
      const [
        { count: holdersCount },
        { count: depsCount },
        { count: burialsCount },
        { count: totalMissions },
        { data: activeContracts },
        { data: allContracts },
        { data: overduePayments },
      ] = await Promise.all([
        supabaseAdmin.from("holders").select("*", { count: "exact", head: true }).eq("tenant_id", auth.tenantId),
        supabaseAdmin.from("dependents").select("*", { count: "exact", head: true }).eq("tenant_id", auth.tenantId),
        supabaseAdmin.from("chapel_burials").select("*", { count: "exact", head: true }).eq("tenant_id", auth.tenantId),
        supabaseAdmin.from("service_orders").select("*", { count: "exact", head: true }).eq("tenant_id", auth.tenantId),
        supabaseAdmin.from("contracts").select("plans(monthly_fee)").eq("tenant_id", auth.tenantId).eq("status", "active"),
        supabaseAdmin.from("contracts").select("id, status").eq("tenant_id", auth.tenantId),
        supabaseAdmin.from("payments").select("amount").eq("tenant_id", auth.tenantId).or(`status.eq.overdue,status.eq.pending`).lt("due_date", today.toISOString()),
      ]);

      const totalLives = (holdersCount || 0) + (depsCount || 0);

      // MRR (Monthly Recurring Revenue): soma das mensalidades dos contratos ativos
      const monthlyRevenue = (activeContracts || []).reduce(
        (sum: number, c: any) => sum + (Number(c?.plans?.monthly_fee) || 0),
        0,
      );

      // Inadimplência real: payments vencidos (status=overdue OU status=pending com due_date < hoje)
      const overdueAmount = (overduePayments || []).reduce(
        (sum: number, p: any) => sum + (Number(p?.amount) || 0),
        0,
      );
      const overdueCount = overduePayments?.length || 0;

      // Taxa de inadimplência (F-21): payments vencidos / payments vencíveis.
      // Antes media contratos inativos (cancelamento != inadimplência).
      const { count: duePaymentsCount } = await supabaseAdmin
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", auth.tenantId)
        .lt("due_date", today.toISOString());
      const defaultRate = (duePaymentsCount || 0) > 0
        ? ((overdueCount / (duePaymentsCount as number)) * 100).toFixed(1) + "%"
        : "0%";

      return NextResponse.json({
        totalLives: totalLives || 0,
        activeContracts: activeContracts?.length || 0,
        monthlyRevenue: monthlyRevenue || 0,
        projectedRevenue: monthlyRevenue || 0, // MRR projetado = MRR real (contratos ativos)
        overdueAmount,
        overdueCount,
        burialsThisMonth: burialsCount || 0,
        totalMissions: totalMissions || 0,
        defaultRate,
      });
    } catch (err: any) {
      return serverError(err);
    }
  },
  ["superadmin", "admin", "manager", "financial"],
);
