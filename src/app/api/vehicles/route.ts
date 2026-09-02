import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant nao identificado" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
});

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant nao identificado" }, { status: 400 });
  }
  const body = await req.json();
  const { plate, model, type, driver_name, status } = body;
  if (!plate || !model) {
    return NextResponse.json({ error: "Placa e modelo sao obrigatorios" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .insert({
      tenant_id: tenantId,
      plate: plate.toUpperCase(),
      model,
      type: type || "Cortejo Funerario",
      driver_name: driver_name || null,
      status: status || "Disponivel",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Placa ja cadastrada" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}, ["admin", "superadmin"]);

export const DELETE = withAuth(async (req: NextRequest, { auth }) => {
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant nao identificado" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID e obrigatorio" }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("vehicles")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}, ["admin", "superadmin"]);

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant nao identificado" }, { status: 400 });
  }
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: "ID e obrigatorio" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}, ["admin", "superadmin"]);