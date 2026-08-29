export interface AuditLogPayload {
  tenant_id: string;
  dispatch_id: string;
  action: 'DESPACHO_INICIADO' | 'VEICULO_DESIGNADO' | 'CHEGADA_LOCAL' | 'RETORNO_BASE' | 'FINALIZADO' | 'CANCELADO';
  actor_name: string;
  actor_role: string;
  vehicle_plate?: string;
  driver_name?: string;
  details?: Record<string, any>;
}

export async function logDispatchAction(payload: AuditLogPayload): Promise<void> {
  try {
    await fetch('/api/dispatches/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Falha silenciosa ao registrar auditoria:', error);
  }
}