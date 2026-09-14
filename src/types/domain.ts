export interface ContractPlan {
  id: string;
  name: string;
  monthly_fee: number;
}

export interface Contract {
  id: string;
  status: string;
  start_date: string;
  plan_id?: string;
  plans?: ContractPlan;
  holders?: { full_name?: string; name?: string };
}

export interface Dependent {
  id: string;
  full_name: string;
  relation: string;
}

export interface Holder {
  id: string;
  full_name: string;
  cpf: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  birth_date?: string;
  gender?: string;
  observations?: string;
  status?: string;
  created_at: string;
  contracts?: Contract[];
  dependents?: Dependent[];
}

export type StatusFilter = 'all' | 'ativo' | 'inativo';

// ServiceOrder/Item: shape definido inline em page.tsx (diff zero ate Fase 6).
// Usar `any` no ServiceOrdersTab ate extrair tipo no Fase 6.
export interface Partner {
  id: string;
  partner_name: string;
  category: string;
  discount_percentage: number;
  contact_info: string;
  active?: boolean;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: string;
  status: 'Disponível' | 'Em Missão' | 'Manutenção';
  driver_name: string;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  stock_quantity: number;
  min_threshold: number;
}

export interface Thanatopraxy {
  id: string;
  deceased_name: string;
  technician: string;
  procedure: string;
  burial_id?: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
}

export interface ChapelBooking {
  id: string;
  chapel_name: string;
  deceased_name: string;
  family_contact: string;
  start_time: string;
  end_time: string;
    status: 'reservado' | 'em_velorio' | 'concluido';
}

// Ordens de Serviço integradas (óbito + contrato + veículo + estoque)
export interface ServiceOrderItem {
  id: string;
  quantity: number;
  unit_price?: number;
  inventory?: { id: string; item_name: string; category?: string };
}

export interface ServiceOrder {
  id: string;
  deceased_name: string;
  deceased_type: string;
  deceased_id?: string;
  burial_date: string;
  cemetery_location?: string;
  contract_id?: string;
  vehicle_id?: string;
  status: string;
  total_amount?: number;
  notes?: string;
  contract?: { id: string; status: string; plan: { name: string } };
  burial?: { id: string; deceased_name: string; burial_date: string; status: string; cemetery_location?: string };
  vehicle?: { id: string; plate: string; model: string; status: string };
  items?: ServiceOrderItem[];
}

// ATENCAO: representa um EMPRESTIMO (nome mantido por compatibilidade)
export interface ConvalescenceItem {
  id: string;
  item_id?: string;
  item_name: string;
  holder_name: string;
  loan_date: string;
  expected_return_date?: string;
  status: 'Ativo' | 'Devolvido';
}
