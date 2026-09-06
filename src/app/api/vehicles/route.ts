import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeString, isValidUUID } from "@/lib/validation";

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não identificado" }, { status: 400 });
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
    return NextResponse.json({ error: "Tenant não identificado" }, { status: 400 });
  }
  const body = await req.json();
  const { plate, model, type, driver_name, status } = body;
  if (!plate || !model) {
    return NextResponse.json({ error: "Placa e modelo são obrigatórios" }, { status: 400 });
  }
  const sanitizedPlate = sanitizeString(plate, 20).toUpperCase();
  if (!sanitizedPlate) {
    return NextResponse.json({ error: "Placa inválida." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .insert({
      tenant_id: tenantId,
      plate: sanitizedPlate,
      model: sanitizeString(model, 100),
      type: sanitizeString(type || "Cortejo Funerário", 50),
      driver_name: driver_name ? sanitizeString(driver_name, 100) : null,
      status: sanitizeString(status || "Disponível", 50),
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
    return NextResponse.json({ error: "Tenant não identificado" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id || !isValidUUID(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
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
    return NextResponse.json({ error: "Tenant não identificado" }, { status: 400 });
  }
  const body = await req.json();
  const { id, plate, model, type, driver_name, status } = body;
  if (!id || !isValidUUID(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  // SECURITY: allowlist de campos — nunca aplicar o body inteiro no update
  const updateData: Record<string, unknown> = {};
  if (plate !== undefined) updateData.plate = sanitizeString(plate, 20).toUpperCase();
  if (model !== undefined) updateData.model = sanitizeString(model, 100);
  if (type !== undefined) updateData.type = sanitizeString(type, 50);
  if (driver_name !== undefined) updateData.driver_name = driver_name ? sanitizeString(driver_name, 100) : null;
  if (status !== undefined) updateData.status = sanitizeString(status, 50);
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .update(updateData)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}, ["admin", "superadmin", "manager", "attendant"]);