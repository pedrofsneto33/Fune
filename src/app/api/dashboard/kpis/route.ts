import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { serverError } from "@/lib/http-error";

export const GET = withAuth(
  async (req: NextRequest, { auth }) => {
    try {
      const { count: holdersCount } = await supabaseAdmin
        .from("holders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", auth.tenantId);

      const { count: depsCount } = await supabaseAdmin
        .from("dependents")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", auth.tenantId);

      const { count: burialsCount } = await supabaseAdmin
        .from("chapel_burials")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", auth.tenantId);

      const totalLives = (holdersCount || 0) + (depsCount || 0);

      // Receita real: soma das mensalidades dos planos dos contratos ATIVOS
      const { data: activeContracts, error: contractsErr } = await supabaseAdmin
        .from("contracts")
        .select("plans(monthly_fee)")
        .eq("tenant_id", auth.tenantId)
        .eq("status", "active");

      const monthlyRevenue = (activeContracts || []).reduce(
        (sum: number, c: any) => sum + (Number(c?.plans?.monthly_fee) || 0),
        0,
      );

      return NextResponse.json({
        totalLives: totalLives || 0,
        activeContracts: activeContracts?.length || 0,
        monthlyRevenue: monthlyRevenue || 0,
        overdueAmount: 0,
        overdueCount: 0,
        burialsThisMonth: burialsCount || 0,
      });
    } catch (err: any) {
      return serverError(err);
    }
  },
  ["superadmin", "admin", "manager", "financial"],
);
