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

export interface Partner {
  id: string;
  partner_name: string;
  category: string;
  discount_percentage: number;
  contact_info: string;
  active?: boolean;
}
