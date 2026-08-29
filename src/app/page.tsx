'use client';
import { printServiceOrder, printFinancialReport, printCommissionReceipt } from '@/lib/printReports';
type UserRole = 'admin' | 'atendente' | 'motorista';

interface UserSessionProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

const ROLE_PERMISSIONS = {
  admin: {
    canViewFinancialMetrics: true,
    canManageContracts: true,
    canManageFleet: true,
    canManageInventory: true,
    canManageDispatches: true,
    canManageCommissions: true,
    canDeleteRecords: true,
    allowedTabs: ['overview', 'associates', 'dispatches', 'fleet', 'inventory', 'commissions']
  },
  atendente: {
    canViewFinancialMetrics: true,
    canManageContracts: true,
    canManageFleet: false,
    canManageInventory: false,
    canManageDispatches: true,
    canManageCommissions: true,
    canDeleteRecords: false,
    allowedTabs: ['overview', 'associates', 'dispatches', 'commissions']
  },
  motorista: {
    canViewFinancialMetrics: false,
    canManageContracts: false,
    canManageFleet: true,
    canManageInventory: false,
    canManageDispatches: true,
    canManageCommissions: false,
    canDeleteRecords: false,
    allowedTabs: ['dispatches', 'fleet']
  }
};

function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS['admin']): boolean {
  const config = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['atendente'];
  return !!config[permission];
}

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode } from 'lucide-react';
import { 
  LayoutDashboard,
  Users, 
  Siren, 
  Truck, 
  Boxes, 
  Fuel, 
  History, 
  Search, 
  Plus, 
  X, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  UserPlus,
  CreditCard,
  LogOut,
  Lock,
  Zap,
  CheckCircle,
  MessageSquare,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Filter,
  Download
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { formatWhatsAppMessage } from '@/lib/whatsapp';
import { generateExecutiveReport, generateEmergencyOS, generatePlantaoReportPDF, EmergencyDispatch } from '@/lib/pdf-report';
import { supabase } from '@/lib/supabaseClient';

const revenueData = [
  { month: 'Jan', recebido: 42000, previsto: 45000 },
  { month: 'Fev', recebido: 46000, previsto: 47000 },
  { month: 'Mar', recebido: 51000, previsto: 50000 },
  { month: 'Abr', recebido: 49000, previsto: 52000 },
  { month: 'Mai', recebido: 58000, previsto: 55000 },
  { month: 'Jun', recebido: 63000, previsto: 60000 },
];

interface PaymentRow {
  id: string;
  holderId: string;
  holder: string;
  cpf: string;
  phone: string;
  plan: string;
  amount: string;
  dueDate: string;
  method: string;
  status: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
}

interface FleetVehicle {
  id: string;
  model: string;
  plate: string;
  vehicle_type: string;
  current_km: number;
  status: string;
}

interface FleetExpense {
  id: string;
  vehicle_id: string;
  expense_type: string;
  amount: number;
  current_km: number;
  liters?: number;
  establishment: string;
  expense_date: string;
  notes?: string;
}

interface DispatchRecord {
  id: string;
  protocol: string;
  deceased_name: string;
  holder_name: string;
  plan_name: string;
  death_location: string;
  address: string;
  urn_model: string;
  vehicle_id: string;
  vehicle_desc: string;
  driver_agent: string;
  family_contact_name: string;
  family_contact_phone: string;
  observations: string;
  status: string;
  created_at: string;
}

interface DependentItem {
  id: string;
  full_name: string;
  kinship: string;
  birth_date: string;
}

type TabType = 'overview' | 'associates' | 'dispatches' | 'fleet' | 'inventory' | 'commissions';

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('overview');

  // Estados de Dados
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [expenses, setExpenses] = useState<FleetExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros da aba PLANTÃO
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState<'all' | 'em_andamento' | 'concluido'>('all');
  const [dispatchSearchText, setDispatchSearchText] = useState('');
  
  // Modais de Acao
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlantaopen, setIsPlantaopen] = useState(false);
  const [isDependentModalOpen, setIsDependentModalOpen] = useState(false);
  const [isPixSimModalOpen, setIsPixSimModalOpen] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [selectedPixRow, setSelectedPixRow] = useState<any | null>(null);
  const [pixPayload, setPixPayload] = useState<{ qrCode: string; copyPaste: string; txid: string } | null>(null);
  const [pixLoading, setPixLoading] = useState(false);

  const handleOpenPixModal = async (item: any) => {
    setSelectedPixRow(item);
    setIsPixModalOpen(true);
    setPixLoading(true);
    setPixPayload(null);

    try {
      const res = await fetch('/api/billing/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: item.id,
          customerName: item.holder,
          cpf: item.cpf,
          amount: item.amount,
          description: "Mensalidade " + item.plan + " - " + item.holder
        })
      });
      const data = await res.json();
      if (data.success) {
        setPixPayload({
          qrCode: data.qrCodeBase64 || '',
          copyPaste: data.copyPasteCode || '',
          txid: data.txid || ''
        });
      }
    } catch (err) {
      console.error('Erro ao gerar Pix:', err);
    } finally {
      setPixLoading(false);
    }
  };
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Selecoes
  const [selectedHolderForDep, setSelectedHolderForDep] = useState<PaymentRow | null>(null);
  const [dependentsList, setDependentsList] = useState<DependentItem[]>([]);

  // Forms
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('Familiar Ouro');

  const [newModel, setNewModel] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState('Remocao');
  const [newKm, setNewKm] = useState(0);

  const [expVehicleId, setExpVehicleId] = useState('');
  const [expType, setExpType] = useState('Abastecimento');
  const [expAmount, setExpAmount] = useState('');
  const [expKm, setExpKm] = useState('');
  const [expLiters, setExpLiters] = useState('');
  const [expEstablishment, setExpEstablishment] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  const [depName, setDepName] = useState('');
  const [depKinship, setDepKinship] = useState('Conjuge');
  const [depBirth, setDepBirth] = useState('');

  const [selectedContractForPlantao, setSelectedContractForPlantao] = useState<PaymentRow | null>(null);
  const [deceasedName, setDeceasedName] = useState('');
  const [deathLocation, setDeathLocation] = useState('Hospital Regional');
  const [address, setAddress] = useState('');
  const [driverAgent, setDriverAgent] = useState('Agente Marcos (PLANTÃO)');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [urnModel, setUrnModel] = useState('Sextavada Luxo Ouro (Ref. 102)');
  const [familyContactName, setFamilyContactName] = useState('');
  const [familyContactPhone, setFamilyContactPhone] = useState('');
  const [driverPhone, setDriverPhone] = useState('86999990000');

  const [simTargetPaymentId, setSimTargetPaymentId] = useState('');
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    setMounted(true);

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          fetchSupabaseData();
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
      }
    }

    checkAuth();
  }, []);

  const fetchSupabaseData = async () => {
    setLoading(true);
    try {
      // 1. Pagamentos e Contratos
      const { data: payData } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          due_date,
          status,
          payment_method,
          contracts (
            id,
            holder_id,
            holders (
              id,
              full_name,
              cpf,
              phone
            ),
            plans (
              name
            )
          )
        `)
        .order('due_date', { ascending: false });

      if (payData) {
        const formatted: PaymentRow[] = payData.map((item: any) => ({
          id: item.id,
          holderId: item.contracts?.holders?.id || '',
          holder: item.contracts?.holders?.full_name || 'Titular Cadastrado',
          cpf: item.contracts?.holders?.cpf || '000.000.000-00',
          phone: item.contracts?.holders?.phone || '86999990000',
          plan: item.contracts?.plans?.name || 'Plano Padrao',
          amount: `R$ ${Number(item.amount).toFixed(2).replace('.', ',')}`,
          dueDate: new Date(item.due_date).toLocaleDateString('pt-BR'),
          method: (item.payment_method || 'pix').toUpperCase(),
          status: item.status === 'paid' ? 'Pago' : item.status === 'overdue' ? 'Atrasado' : 'Pendente'
        }));
        setPayments(formatted);
      }

      const { data: invData } = await supabase
        .from('inventory_items')
        .select('*')
        .order('quantity', { ascending: true });

      if (invData) setInventory(invData);

      const { data: fleetData } = await supabase
        .from('fleet_vehicles')
        .select('*')
        .order('model', { ascending: true });

      if (fleetData) {
        setVehicles(fleetData);
        if (fleetData.length > 0) {
          if (!selectedVehicleId) setSelectedVehicleId(fleetData[0].id);
          if (!expVehicleId) setExpVehicleId(fleetData[0].id);
        }
      }

      const { data: dispatchData } = await supabase
        .from('emergency_dispatches')
        .select('*')
        .order('created_at', { ascending: false });

      if (dispatchData) setDispatches(dispatchData);

      const { data: expData } = await supabase
        .from('fleet_expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (expData) setExpenses(expData);
    } catch (err) {
      console.error('Erro na busca:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const handleToggleVehicleStatus = async (vehicleId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'disponivel' ? 'manutencao' : 'disponivel';
    try {
      const { error } = await supabase
        .from('fleet_vehicles')
        .update({ status: nextStatus })
        .eq('id', vehicleId);

      if (error) throw error;
      setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, status: nextStatus } : v));
    } catch (err: any) {
      alert('Erro ao atualizar veiculo: ' + err.message);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel || !newPlate) return;

    try {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .insert([{
          model: newModel,
          plate: newPlate.toUpperCase(),
          vehicle_type: newType,
          current_km: Number(newKm) || 0,
          status: 'disponivel'
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setVehicles(prev => [...prev, data]);
        setNewModel('');
        setNewPlate('');
        setNewKm(0);
        setIsNewVehicleModalOpen(false);
      }
    } catch (err: any) {
      alert('Erro ao cadastrar veiculo: ' + err.message);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expVehicleId || !expAmount) return;

    try {
      const val = Number(expAmount.replace(',', '.'));
      const kmNum = Number(expKm) || null;
      const litNum = Number(expLiters.replace(',', '.')) || null;

      const { error } = await supabase
        .from('fleet_expenses')
        .insert([{
          vehicle_id: expVehicleId,
          expense_type: expType,
          amount: val,
          current_km: kmNum,
          liters: litNum,
          establishment: expEstablishment,
          expense_date: expDate
        }]);

      if (error) throw error;

      if (kmNum) {
        const v = vehicles.find(item => item.id === expVehicleId);
        if (v && kmNum > v.current_km) {
          await supabase
            .from('fleet_vehicles')
            .update({ current_km: kmNum })
            .eq('id', expVehicleId);
        }
      }

      alert('Despesa registrada com sucesso!');
      setExpAmount('');
      setExpKm('');
      setExpLiters('');
      setExpEstablishment('');
      setIsExpenseModalOpen(false);
      await fetchSupabaseData();
    } catch (err: any) {
      alert('Erro ao registrar despesa: ' + err.message);
    }
  };

  const handleCompleteDispatch = async (dispatch: DispatchRecord) => {
    try {
      // 1. Atualizar status do despacho
      const { error } = await supabase
        .from('emergency_dispatches')
        .update({
          status: 'concluido',
          completed_at: new Date().toISOString()
        })
        .eq('id', dispatch.id);

      if (error) throw error;

      // 2. Liberar veiculo
      if (dispatch.vehicle_id) {
        await supabase
          .from('fleet_vehicles')
          .update({ status: 'disponivel' })
          .eq('id', dispatch.vehicle_id);
      }

      // 3. Executar Baixa Automatica de Estoque
      let stockMsg = '';
      try {
        // Encontrar item de estoque correspondente a urna se houver
        const matchedStockItem = inventory.find(i => 
          i.name.toLowerCase().includes(dispatch.urn_model?.toLowerCase().slice(0, 8) || '')
        );

        const deductRes = await fetch('/api/stock/dispatch-deduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dispatchId: dispatch.id,
            deceasedName: dispatch.deceased_name,
            coffinId: matchedStockItem ? matchedStockItem.id : undefined,
            itemsUsed: []
          })
        });

        const deductData = await deductRes.json();
        if (deductData.success && deductData.deductions?.length > 0) {
          stockMsg = `\nEstoque atualizado: -1 ${deductData.deductions[0].name}`;
        }
      } catch (stockErr) {
        console.warn('Aviso: Baixa de estoque automatica nao pode ser processada:', stockErr);
      }

      alert(`Missao ${dispatch.protocol} finalizada! Veiculo liberado.${stockMsg}`);
      await fetchSupabaseData();
    } catch (err: any) {
      alert('Erro ao finalizar missao: ' + err.message);
    }
  };

  const openDependentModal = async (row: PaymentRow) => {
    setSelectedHolderForDep(row);
    setIsDependentModalOpen(true);
    if (!row.holderId) return;

    const { data } = await supabase
      .from('dependents')
      .select('*')
      .eq('holder_id', row.holderId);

    setDependentsList(data || []);
  };

  const handleAddDependent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolderForDep?.holderId || !depName) return;

    try {
      const { data, error } = await supabase
        .from('dependents')
        .insert([{
          holder_id: selectedHolderForDep.holderId,
          full_name: depName,
          kinship: depKinship,
          birth_date: depBirth || null
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setDependentsList(prev => [...prev, data]);
        setDepName('');
        setDepBirth('');
      }
    } catch (err: any) {
      alert('Erro ao incluir dependente: ' + err.message);
    }
  };

  const filteredPayments = payments.filter((p) => 
    p.holder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf.includes(searchTerm)
  );

  const filteredDispatches = dispatches.filter((d) => {
    const matchesStatus = dispatchStatusFilter === 'all' || d.status === dispatchStatusFilter;
    const matchesSearch = 
      d.deceased_name.toLowerCase().includes(dispatchSearchText.toLowerCase()) ||
      d.protocol.toLowerCase().includes(dispatchSearchText.toLowerCase()) ||
      d.driver_agent.toLowerCase().includes(dispatchSearchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleMarkAsPaid = async (paymentId: string) => {
    setUpdatingId(paymentId);
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      setPayments((prev) => 
        prev.map((item) => item.id === paymentId ? { ...item, status: 'Pago' } : item)
      );
    } catch (err: any) {
      alert('Erro ao dar baixa: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTriggerWebhookSim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simTargetPaymentId) return;

    setSimLoading(true);
    try {
      const res = await fetch('/api/webhooks/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: simTargetPaymentId,
          transactionId: `E2E${Date.now()}PIX`,
          amount: 89.90
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha ao processar simulacao.');

      alert('Webhook recebido! Fatura baixada automaticamente.');
      setIsPixSimModalOpen(false);
      await fetchSupabaseData();
    } catch (err: any) {
      alert(err.message || 'Erro ao simular webhook.');
    } finally {
      setSimLoading(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !cpf || !phone) {
      alert('Preencha todos os campos obrigatorios.');
      return;
    }

    setSaving(true);
    try {
      const { data: holderData, error: holderError } = await supabase
        .from('holders')
        .insert([{ full_name: fullName, cpf, phone }])
        .select()
        .single();

      if (holderError) throw new Error('Falha ao gravar titular: ' + holderError.message);

      const { data: plansData, error: planError } = await supabase
        .from('plans')
        .select('id, name, monthly_fee')
        .ilike('name', `%${selectedPlan}%`)
        .limit(1);

      if (planError || !plansData || plansData.length === 0) {
        throw new Error('Plano nao localizado.');
      }

      const plan = plansData[0];

      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert([{ holder_id: holderData.id, plan_id: plan.id, status: 'active' }])
        .select()
        .single();

      if (contractError) throw new Error('Falha ao vincular contrato: ' + contractError.message);

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          contract_id: contractData.id,
          amount: plan.monthly_fee,
          due_date: nextMonth.toISOString().split('T')[0],
          status: 'pending',
          payment_method: 'pix'
        }]);

      if (paymentError) throw new Error('Falha ao gerar cobranca: ' + paymentError.message);

      alert('Contrato cadastrado com sucesso!');
      await fetchSupabaseData();
      setFullName('');
      setCpf('');
      setPhone('');
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao processar cadastro.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCard = (cpf: string) => {
    const cleanCpf = cpf.replace(/\D/g, '');
    window.open(`/carteirinha/${cleanCpf}`, '_blank');
  };

  const handleSendWhatsApp = (item: PaymentRow) => {
    const url = formatWhatsAppMessage({
      phone: item.phone,
      customerName: item.holder,
      planName: item.plan,
      amount: item.amount,
      dueDate: item.dueDate,
      pixCode: '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540589.905802BR5913ETERNITYOS6008TERESINA62070503***6304ABCD'
    });
    window.open(url, '_blank');
  };

  const handleExportPDF = () => {
    generateExecutiveReport(payments, 'R$ 63.450', payments.length);
  };

  const handleExportPlantaoPDF = () => {
    const formatted: EmergencyDispatch[] = filteredDispatches.map(d => ({
      protocol: d.protocol,
      deceasedName: d.deceased_name,
      holderName: d.holder_name,
      planName: d.plan_name,
      deathLocation: d.death_location,
      address: d.address,
      urnModel: d.urn_model,
      driverAgent: d.driver_agent,
      vehicle: d.vehicle_desc,
      familyContactName: d.family_contact_name,
      familyContactPhone: d.family_contact_phone,
      status: d.status,
      createdAt: d.created_at
    }));
    generatePlantaoReportPDF(formatted);
  };

  const handleDispatchWhatsAppDriver = async () => {
    const activeVehicle = vehicles.find(v => v.id === selectedVehicleId);
    const vehicleDesc = activeVehicle ? `${activeVehicle.model} (${activeVehicle.plate})` : 'Veiculo de PLANTÃO';
    const protocol = `PLT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await supabase
        .from('emergency_dispatches')
        .insert([{
          protocol,
          deceased_name: deceasedName || 'Nome nao informado',
          holder_name: selectedContractForPlantao?.holder || 'Particular',
          plan_name: selectedContractForPlantao?.plan || 'Particular',
          death_location: deathLocation,
          address: address || 'Endereço em triagem',
          urn_model: urnModel,
          vehicle_id: activeVehicle?.id || null,
          vehicle_desc: vehicleDesc,
          driver_agent: driverAgent,
          family_contact_name: familyContactName || 'Familiar',
          family_contact_phone: familyContactPhone || '',
          observations: `Elegibilidade: ${selectedContractForPlantao?.status === 'Pago' ? 'Cobertura Ativa' : 'Débitos Pendentes'}`,
          status: 'em_andamento'
        }]);

      if (activeVehicle) {
        await supabase
          .from('fleet_vehicles')
          .update({ status: 'em_atendimento' })
          .eq('id', activeVehicle.id);
      }

      await fetchSupabaseData();
      setIsPlantaopen(false);

      const msg = `ÃƒÂ°Ã…Â¸Ã…Â¡ÂÂ¨ *ORDEM DE SERVI¡O - PLANTÃO 24H*\n` +
        `*Protocolo:* ${protocol}\n` +
        `---------------------------------\n` +
        `ÃƒÂ°Ã…Â¸ââ‚¬ËœÂÂ¤ *Falecido:* ${deceasedName || 'A informar'}\n` +
        `ÃƒÂ°Ã…Â¸ââ‚¬Å“ââ‚¬Â¹ *Titular/Plano:* ${selectedContractForPlantao?.holder || 'Particular'} (${selectedContractForPlantao?.plan || 'Padrao'})\n` +
        `ÃƒÂ°Ã…Â¸ââ‚¬Å“ÂÂ *Local do Óbito:* ${deathLocation}\n` +
        `ÃƒÂ°Ã…Â¸ÂÂÂÂ  *Endereço/Retirada:* ${address || 'A confirmar'}\n` +
        `ÃƒÂ¢Ã…Â¡ÂÂ°ÃƒÂ¯ÂÂ¸ÂÂ *Urna Requisitada:* ${urnModel}\n` +
        `ÃƒÂ°Ã…Â¸Ã…Â¡ââ‚¬â€ *VeÃƒÆ’ÂÂ­culo Escalado:* ${vehicleDesc}\n` +
        `ÃƒÂ°Ã…Â¸ââ‚¬Å“Ã…Â¾ *Contato Familiar:* ${familyContactName} (${familyContactPhone})\n` +
        `---------------------------------\n` +
        `*Status:* ACIONAMENTO IMEDIATO`;

      const cleanPhone = driverPhone.replace(/\D/g, '');
      const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    } catch (err: any) {
      alert('Erro ao gravar despacho: ' + err.message);
    }
  };

  const handlePrintOS = () => {
    const activeVehicle = vehicles.find(v => v.id === selectedVehicleId);
    const vehicleDesc = activeVehicle ? `${activeVehicle.model} (${activeVehicle.plate})` : 'Veiculo de PLANTÃO';
    const protocol = `PLT-${Math.floor(100000 + Math.random() * 900000)}`;

    const dispatch: EmergencyDispatch = {
      protocol,
      deceasedName: deceasedName || 'Nome nao informado',
      holderName: selectedContractForPlantao?.holder || 'Particular / Nao Associado',
      planName: selectedContractForPlantao?.plan || 'Particular / Tabela Direta',
      deathLocation,
      address: address || 'Endereço em triagem',
      urnModel,
      driverAgent,
      vehicle: vehicleDesc,
      familyContactName: familyContactName || 'Familiar Responsavel',
      familyContactPhone: familyContactPhone || 'Nao informado',
      observations: `Acionamento via PLANTÃO 24h. Elegibilidade: ${selectedContractForPlantao?.status === 'Pago' ? 'Cobertura 100% Ativa' : 'Averiguar Óbitos'}`
    };
    generateEmergencyOS(dispatch);
  };

  const handleReprintOS = (d: DispatchRecord) => {
    const dispatch: EmergencyDispatch = {
      protocol: d.protocol,
      deceasedName: d.deceased_name,
      holderName: d.holder_name,
      planName: d.plan_name,
      deathLocation: d.death_location,
      address: d.address,
      urnModel: d.urn_model,
      driverAgent: d.driver_agent,
      vehicle: d.vehicle_desc,
      familyContactName: d.family_contact_name,
      familyContactPhone: d.family_contact_phone,
      observations: d.observations
    };
    generateEmergencyOS(dispatch);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-[#00D1FF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 text-xs tracking-wider uppercase font-mono">Iniciando SAAD Fune...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <main className="min-h-screen bg-[#09090b] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[#00D1FF]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SAAD<span className="text-[#00D1FF]"> FUNE</span></h1>
          <p className="text-xs text-zinc-400 mt-2 mb-6">
            Ambiente operacional restrito para GESTÃOres e agentes autorizados.
          </p>
          
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-[#0F62FE] hover:bg-blue-600 text-white font-semibold py-3 rounded-lg text-sm transition shadow-lg shadow-blue-950/40 cursor-pointer"
          >
            Acessar Painel com Login e Senha
          </button>
        </div>
      </main>
    );
  }

  const availableVehiclesCount = vehicles.filter(v => v.status === 'disponivel').length;
  const activeDispatchesCount = dispatches.filter(d => d.status === 'em_andamento').length;
  const totalFleetCost = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col md:flex-row">
      
      {/* SIDEBAR LATERAL FIXA */}
      <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo & Status */}
          <div className="flex items-center justify-between pb-6 border-b border-zinc-800/60 mb-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">SAAD<span className="text-[#00D1FF]"> FUNE</span></h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">ASSISTÊNCIA & GESTÃO</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" title="Sistema Online" />
          </div>

          {/* Navegacao de Modulos */}
          <nav className="space-y-1">
            <button
              onClick={() => setCurrentTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                currentTab === 'overview'
                  ? 'bg-zinc-800/90 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#00D1FF]" />
              Visão Geral
            </button>

            <button
              onClick={() => setCurrentTab('associates')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                currentTab === 'associates'
                  ? 'bg-zinc-800/90 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-blue-400" />
                Associados
              </div>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{payments.length}</span>
            </button>

            <button
              onClick={() => setCurrentTab('dispatches')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                currentTab === 'dispatches'
                  ? 'bg-zinc-800/90 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Siren className="w-4 h-4 text-red-500" />
                PLANTÃO & Óbitos
              </div>
              {activeDispatchesCount > 0 && (
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold">
                  {activeDispatchesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('fleet')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                currentTab === 'fleet'
                  ? 'bg-zinc-800/90 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-amber-400" />
                Frota & Logística
              </div>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                {availableVehiclesCount}/{vehicles.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                currentTab === 'inventory'
                  ? 'bg-zinc-800/90 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Boxes className="w-4 h-4 text-purple-400" />
                Estoque de Urnas
              </div>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{inventory.length}</span>
            </button>
          </nav>
        </div>

        {/* Ferramentas do RodapÃƒÆ’ÂÂ© da Sidebar */}
        <div className="pt-4 border-t border-zinc-800/60 space-y-2">
          <button
            onClick={() => setIsPixSimModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900/40 transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Simulador Webhook PIX
          </button>

          <button
            onClick={handleExportPDF}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            Relatório Gerencial
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Encerrar SessÃƒÆ’ÂÂ£o
          </button>
        </div>
      </aside>

      {/* AREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER LIMPO COM APENAS O BOTAO DE ACAO PRIMARIA */}
        <header className="h-16 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-zinc-950/40 backdrop-blur-sm shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por CPF ou Nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00D1FF] transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSupabaseData}
              title="Recarregar dados"
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* BOTAO PRIMARIO UNICO: EMERGENCIA */}
            <button
              onClick={() => setIsPlantaopen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-red-950/30 transition cursor-pointer"
            >
              <Siren className="w-3.5 h-3.5" />
              Acionamento 24h
            </button>
          </div>
        </header>

        {/* CONTEUDO DINAMICO POR ABA */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">

          {/* 1. Visão Geral */}
          {currentTab === 'overview' && (
            <div className="space-y-6">
              {/* KPIs Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="text-xs font-medium uppercase tracking-wider">MRR Recorrente</span>
                    <DollarSign className="w-4 h-4 text-[#00D1FF]" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">R$ 63.450</p>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                    <TrendingUp className="w-3 h-3" /> +12.4% este mês
                  </span>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="text-xs font-medium uppercase tracking-wider">Associados Ativos</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">{payments.length}</p>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Contratos sincronizados</span>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="text-xs font-medium uppercase tracking-wider">PLANTÕES ATIVOS</span>
                    <Siren className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">{activeDispatchesCount} em missÃƒÆ’ÂÂ£o</p>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Total histórico: {dispatches.length}</span>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="text-xs font-medium uppercase tracking-wider">Frota Operacional</span>
                    <Truck className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">{availableVehiclesCount} disponíveis</p>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Total: {vehicles.length} veículos</span>
                </div>
              </div>

              {/* Grafico de Arrecadação */}
              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Fluxo de Arrecadação</h2>
                    <p className="text-xs text-zinc-400">Comparativo Previsto vs Realizado Últimos 6 meses)</p>
                  </div>
                  <span className="text-xs bg-zinc-800 px-2.5 py-1 rounded text-zinc-300 font-medium">Consolidado</span>
                </div>
                <div className="h-72 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00D1FF" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00D1FF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                        <YAxis stroke="#71717a" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="recebido" stroke="#00D1FF" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. ASSOCIADOS & CONTRATOS */}
          {currentTab === 'associates' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-white">GESTÃO de Associados & Faturas</h2>
                  <p className="text-xs text-zinc-400">Total de {filteredPayments.length} titulares cadastrados</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 bg-[#0F62FE] hover:bg-blue-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Contrato
                </button>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-900/80 text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3">Titular</th>
                      <th className="px-5 py-3">CPF</th>
                      <th className="px-5 py-3">Plano</th>
                      <th className="px-5 py-3">Vencimento</th>
                      <th className="px-5 py-3">Valor</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">AÃƒÆ’ÂÂ§ÃƒÆ’ÂÂµes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-zinc-500">
                          Carregando associados...
                        </td>
                      </tr>
                    ) : filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-zinc-500">
                          Nenhum registro encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-900/40 transition">
                          <td className="px-5 py-3.5 font-medium text-white">{item.holder}</td>
                          <td className="px-5 py-3.5 text-zinc-400 font-mono">{item.cpf}</td>
                          <td className="px-5 py-3.5">{item.plan}</td>
                          <td className="px-5 py-3.5">{item.dueDate}</td>
                          <td className="px-5 py-3.5 font-medium text-zinc-100">{item.amount}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.status === 'Pago'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : item.status === 'Pendente'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {item.status !== 'Pago' && (
                                <button
                                  onClick={() => handleMarkAsPaid(item.id)}
                                  disabled={updatingId === item.id}
                                  title="Dar Baixa Manual"
                                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded text-[11px] font-medium transition cursor-pointer border border-zinc-700"
                                >
                                  {updatingId === item.id ? '...' : 'Baixa'}
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleOpenCard(item.cpf)}
                                title="Carteirinha Digital"
                                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition cursor-pointer"
                              >
                                <CreditCard className="w-4 h-4 text-emerald-400" />
                              </button>

                              <button
                                onClick={() => openDependentModal(item)}
                                title="Dependentes"
                                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition cursor-pointer"
                              >
                                <Users className="w-4 h-4 text-[#00D1FF]" />
                              </button>

                              <button
  onClick={() => handleOpenPixModal(item)}
  title="Gerar CobranÃƒÆ’ÂÂ§a Pix (QR Code)"
  className="p-1 text-emerald-400 hover:text-emerald-300 rounded hover:bg-zinc-800 transition cursor-pointer"
>
  <QrCode className="w-4 h-4" />
</button>
<button
                                onClick={() => handleSendWhatsApp(item)}
                                title="CobranÃƒÆ’ÂÂ§a WhatsApp"
                                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition cursor-pointer"
                              >
                                <MessageSquare className="w-4 h-4 text-blue-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PLANTÃO 24H & HISTORICO DE MISSOES */}
          {currentTab === 'dispatches' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">PLANTÃO 24h & Atendimentos de Óbitos</h2>
                  <p className="text-xs text-zinc-400">{filteredDispatches.length} ocorrÃƒÆ’ÂÂªncias encontradas</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportPlantaoPDF}
                    className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00D1FF]" />
                    Exportar PDF
                  </button>
                  <button
                    onClick={() => setIsPlantaopen(true)}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shadow-md shadow-red-950/40"
                  >
                    <Siren className="w-3.5 h-3.5" />
                    Novo Acionamento
                  </button>
                </div>
              </div>

              {/* Barra de Filtros do PLANTÃO */}
              <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar falecido, protocolo ou agente..."
                    value={dispatchSearchText}
                    onChange={(e) => setDispatchSearchText(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-[11px] text-zinc-400 font-medium">Status:</span>
                  <div className="inline-flex bg-zinc-800 rounded-lg p-0.5 border border-zinc-700 text-xs">
                    <button
                      onClick={() => setDispatchStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-md transition text-[11px] ${dispatchStatusFilter === 'all' ? 'bg-zinc-700 text-white font-semibold' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Todos ({dispatches.length})
                    </button>
                    <button
                      onClick={() => setDispatchStatusFilter('em_andamento')}
                      className={`px-2.5 py-1 rounded-md transition text-[11px] ${dispatchStatusFilter === 'em_andamento' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Em MissÃƒÆ’ÂÂ£o ({activeDispatchesCount})
                    </button>
                    <button
                      onClick={() => setDispatchStatusFilter('concluido')}
                      className={`px-2.5 py-1 rounded-md transition text-[11px] ${dispatchStatusFilter === 'concluido' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-white'}`}
                    >
                      ConcluÃƒÆ’ÂÂ­dos ({dispatches.length - activeDispatchesCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Atendimentos */}
              <div className="space-y-3">
                {filteredDispatches.length === 0 ? (
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 text-center text-xs text-zinc-500">
                    Nenhum atendimento corresponde aos filtros selecionados.
                  </div>
                ) : (
                  filteredDispatches.map((d) => (
                    <div key={d.id} className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#00D1FF] font-bold">{d.protocol}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            d.status === 'em_andamento'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {d.status === 'em_andamento' ? 'Em MissÃƒÆ’ÂÂ£o' : 'ConcluÃƒÆ’ÂÂ­do'}
                          </span>
                          <span className="text-[10px] text-zinc-500">{new Date(d.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        <p className="text-sm font-bold text-white">Falecido: {d.deceased_name}</p>
                        <p className="text-xs text-zinc-400">Titular: {d.holder_name} ({d.plan_name}) ÃƒÂ¢ââ€šÂ¬ÂÂ¢ Urna: {d.urn_model}</p>
                        <p className="text-xs text-zinc-400">Local: {d.death_location} ÃƒÂ¢ââ€šÂ¬ÂÂ¢ VeÃƒÆ’ÂÂ­culo: {d.vehicle_desc} ÃƒÂ¢ââ€šÂ¬ÂÂ¢ Agente: {d.driver_agent}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleReprintOS(d)}
                          className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#00D1FF]" />
                          O.S. (PDF)
                        </button>

                        {d.status === 'em_andamento' && (
                          <button
                            onClick={() => handleCompleteDispatch(d)}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Finalizar MissÃƒÆ’ÂÂ£o
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. Frota & Logística */}
          {currentTab === 'fleet' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-white">GESTÃO da Frota & Despesas</h2>
                  <p className="text-xs text-zinc-400">{vehicles.length} veículos cadastrados ÃƒÂ¢ââ€šÂ¬ÂÂ¢ Custo do mÃƒÆ’ÂÂªs: R$ {totalFleetCost.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Fuel className="w-3.5 h-3.5" />
                    LanÃƒÆ’ÂÂ§ar Despesa
                  </button>
                  <button
                    onClick={() => setIsNewVehicleModalOpen(true)}
                    className="flex items-center gap-1.5 bg-[#0F62FE] hover:bg-blue-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Novo VeÃƒÆ’ÂÂ­culo
                  </button>
                </div>
              </div>

              {/* Lista de veículos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehicles.map((v) => (
                  <div key={v.id} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-white">{v.model}</h3>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">{v.plate} ÃƒÂ¢ââ€šÂ¬ÂÂ¢ {v.vehicle_type}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        v.status === 'disponivel'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : v.status === 'em_atendimento'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {v.status === 'disponivel' ? 'Pronto' : v.status === 'em_atendimento' ? 'Em MissÃƒÆ’ÂÂ£o' : 'ManutenÃƒÆ’ÂÂ§ÃƒÆ’ÂÂ£o'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-zinc-400">OdÃƒÆ’ÂÂ´metro:</span>
                      <span className="font-mono text-white font-bold">{v.current_km.toLocaleString('pt-BR')} km</span>
                    </div>

                    <button
                      onClick={() => handleToggleVehicleStatus(v.id, v.status)}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-1.5 rounded-lg font-medium transition cursor-pointer"
                    >
                      Alternar p/ {v.status === 'disponivel' ? 'ManutenÃƒÆ’ÂÂ§ÃƒÆ’ÂÂ£o' : 'DisponÃƒÆ’ÂÂ­vel'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Historico de Despesas */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">ÃƒÆ’Ã…Â¡ltimas Despesas & Abastecimentos</h3>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {expenses.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-3">Nenhuma despesa de frota lanÃƒÆ’ÂÂ§ada.</p>
                  ) : (
                    expenses.map((e) => {
                      const veh = vehicles.find(v => v.id === e.vehicle_id);
                      return (
                        <div key={e.id} className="p-3 bg-zinc-800/40 border border-zinc-800 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <span className="font-semibold text-white">{e.expense_type}</span>
                            <span className="text-zinc-400 ml-2">({veh?.model || 'VeÃƒÆ’ÂÂ­culo'} ÃƒÂ¢ââ€šÂ¬ÂÂ¢ {veh?.plate})</span>
                            <p className="text-[11px] text-zinc-500 mt-0.5">{e.establishment || 'Local nÃƒÆ’ÂÂ£o informado'} ÃƒÂ¢ââ€šÂ¬ÂÂ¢ {e.expense_date}</p>
                          </div>
                          <span className="font-bold text-amber-400 text-sm">
                            R$ {Number(e.amount).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Estoque de Urnas */}
          {currentTab === 'inventory' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Controle de Estoque de Urnas & Insumos</h2>
                <p className="text-xs text-zinc-400">Monitoramento de saldo crÃƒÆ’ÂÂ­tico para pronto atendimento</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inventory.map((item) => {
                  const isLow = item.quantity <= item.min_quantity;
                  return (
                    <div key={item.id} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-xl flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-white">{item.name}</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">{item.category} ÃƒÂ¢ââ€šÂ¬ÂÂ¢ MÃƒÆ’ÂÂ­nimo exigido: {item.min_quantity} un</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-base font-bold px-3 py-1 rounded-lg ${
                          isLow 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {item.quantity} un
                        </span>
                        <p className="text-[10px] text-zinc-500 mt-1">{isLow ? 'ReposiÃƒÆ’ÂÂ§ÃƒÆ’ÂÂ£o NecessÃƒÆ’ÂÂ¡ria' : 'Estoque Regular'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: PLANTÃO 24H */}
      {isPlantaopen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-red-500/40 w-full max-w-2xl rounded-2xl p-6 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Siren className="w-5 h-5 text-red-500" /> Acionamento PLANTÃO 24h
                </h3>
              </div>
              <button onClick={() => setIsPlantaopen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Vincular Contrato / Associado</label>
                <select 
                  onChange={(e) => {
                    const found = payments.find(p => p.id === e.target.value);
                    setSelectedContractForPlantao(found || null);
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">-- Selecione o Associado ou Atendimento Particular --</option>
                  {payments.map(p => (
                    <option key={p.id} value={p.id}>{p.holder} ({p.plan}) - Status: {p.status}</option>
                  ))}
                </select>

                {selectedContractForPlantao && (
                  <div className={`mt-2 p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    selectedContractForPlantao.status === 'Pago'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span><strong>Elegibilidade:</strong> {selectedContractForPlantao.status === 'Pago' ? 'Carência Ok - Cobertura Liberada' : 'Fatura em Aberto - Averiguar Acordo'}</span>
                    </div>
                    <span className="font-bold">{selectedContractForPlantao.plan}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Nome do Falecido</label>
                  <input 
                    type="text"
                    placeholder="Nome completo"
                    value={deceasedName}
                    onChange={(e) => setDeceasedName(e.target.value)}
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Local do Óbito</label>
                  <input 
                    type="text"
                    placeholder="Hospital / ResidÃƒÆ’ÂÂªncia"
                    value={deathLocation}
                    onChange={(e) => setDeathLocation(e.target.value)}
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Endereço Exato</label>
                <input 
                  type="text"
                  placeholder="Rua, Número, Bairro e Cidade..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Urna Coberta</label>
                  <select 
                    value={urnModel}
                    onChange={(e) => setUrnModel(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Sextavada Luxo Ouro (Ref. 102)">Sextavada Luxo Ouro (Ref. 102)</option>
                    <option value="Standard Prata com Visor (Ref. 80)">Standard Prata com Visor (Ref. 80)</option>
                    <option value="Master Premium Entalhada (Ref. 204)">Master Premium Entalhada (Ref. 204)</option>
                    <option value="Urna Infantil / Especial">Urna Infantil / Especial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">VeÃƒÆ’ÂÂ­culo Escalado</label>
                  <select 
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.model} ({v.plate}) - {v.status === 'disponivel' ? 'Pronto' : 'Em uso/Manut.'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Familiar no Local</label>
                  <input 
                    type="text"
                    placeholder="Nome do parente"
                    value={familyContactName}
                    onChange={(e) => setFamilyContactName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">WhatsApp Familiar</label>
                  <input 
                    type="text"
                    placeholder="86999990000"
                    value={familyContactPhone}
                    onChange={(e) => setFamilyContactPhone(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">WhatsApp Motorista</label>
                  <input 
                    type="text"
                    placeholder="86999990000"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button 
                  type="button" 
                  onClick={() => setIsPlantaopen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Fechar
                </button>
                <button 
                  type="button" 
                  onClick={handlePrintOS}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#00D1FF]" />
                  Imprimir O.S. (PDF)
                </button>
                <button 
                  type="button" 
                  onClick={handleDispatchWhatsAppDriver}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Gravar & Despachar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO CONTRATO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Cadastrar Novo Contrato</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Completo do Titular</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Raimundo Nonato Soares"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">CPF</label>
                  <input 
                    type="text" 
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">WhatsApp</label>
                  <input 
                    type="text" 
                    required
                    placeholder="86999990000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Selecione o Plano</label>
                <select 
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                >
                  <option value="Individual Prata">Individual Prata (R$ 49,90)</option>
                  <option value="Familiar Ouro">Familiar Ouro (R$ 89,90)</option>
                  <option value="Master Premium">Master Premium (R$ 129,90)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-[#0F62FE] hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar no Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LANCAR DESPESA */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Fuel className="w-4 h-4 text-amber-400" /> LanÃƒÆ’ÂÂ§ar Despesa da Frota
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">VeÃƒÆ’ÂÂ­culo</label>
                <select
                  required
                  value={expVehicleId}
                  onChange={(e) => setExpVehicleId(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Tipo</label>
                  <select
                    value={expType}
                    onChange={(e) => setExpType(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Abastecimento (Gasolina)">Abastecimento (Gasolina)</option>
                    <option value="Abastecimento (Diesel)">Abastecimento (Diesel)</option>
                    <option value="Troca de ÃƒÆ’ââ‚¬Å“leo / Filtro">Troca de ÃƒÆ’ââ‚¬Å“leo / Filtro</option>
                    <option value="Pneus / ManutenÃƒÆ’ÂÂ§ÃƒÆ’ÂÂ£o">Pneus / ManutenÃƒÆ’ÂÂ§ÃƒÆ’ÂÂ£o</option>
                    <option value="ReVisão Geral">ReVisão Geral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Valor Total (R$)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 250,00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Km Atual</label>
                  <input
                    type="number"
                    placeholder="Ex: 88550"
                    value={expKm}
                    onChange={(e) => setExpKm(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Estabelecimento</label>
                  <input
                    type="text"
                    placeholder="Ex: Posto Central"
                    value={expEstablishment}
                    onChange={(e) => setExpEstablishment(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO VEICULO */}
      {isNewVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Cadastrar Novo VeÃƒÆ’ÂÂ­culo</h3>
              <button onClick={() => setIsNewVehicleModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Modelo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fiat Fiorino RemoÃƒÆ’ÂÂ§ÃƒÆ’ÂÂ£o"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Placa</label>
                  <input
                    type="text"
                    required
                    placeholder="ABC-1234"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Tipo</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                  >
                    <option value="RemoÃƒÆ’ÂÂ§ÃƒÆ’ÂÂ£o">RemoÃƒÆ’ÂÂ§ÃƒÆ’ÂÂ£o</option>
                    <option value="Cortejo Especial">Cortejo Especial</option>
                    <option value="Apoio Familiar">Apoio Familiar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Km Inicial</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newKm || ''}
                  onChange={(e) => setNewKm(Number(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewVehicleModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#0F62FE] hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                >
                  Salvar VeÃƒÆ’ÂÂ­culo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DEPENDENTES */}
      {isDependentModalOpen && selectedHolderForDep && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00D1FF]" /> Dependentes do Contrato
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Titular: {selectedHolderForDep.holder}</p>
              </div>
              <button onClick={() => setIsDependentModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 max-h-48 overflow-y-auto space-y-2 pr-1">
              {dependentsList.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3 text-center">Nenhum dependente vinculado a este titular.</p>
              ) : (
                dependentsList.map((dep) => (
                  <div key={dep.id} className="p-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-white">{dep.full_name}</p>
                      <span className="text-zinc-400">{dep.kinship} {dep.birth_date ? `ÃƒÂ¢ââ€šÂ¬ÂÂ¢ Nasc: ${dep.birth_date}` : ''}</span>
                    </div>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                      Coberto
                    </span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddDependent} className="pt-4 border-t border-zinc-800 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-300">Incluir Novo Dependente</h4>
              <div>
                <input 
                  type="text" 
                  required
                  placeholder="Nome completo do dependente"
                  value={depName}
                  onChange={(e) => setDepName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={depKinship}
                  onChange={(e) => setDepKinship(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                >
                  <option value="CÃƒÆ’ÂÂ´njuge">CÃƒÆ’ÂÂ´njuge</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Pai/MÃƒÆ’ÂÂ£e">Pai/MÃƒÆ’ÂÂ£e</option>
                  <option value="Sogro(a)">Sogro(a)</option>
                  <option value="Outro Familiar">Outro Familiar</option>
                </select>
                <input 
                  type="date" 
                  value={depBirth}
                  onChange={(e) => setDepBirth(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-[#0F62FE] hover:bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Incluir no Plano
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SIMULADOR PIX */}
      {isPixSimModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-emerald-500/40 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> Simulador Webhook BancÃƒÆ’ÂÂ¡rio (PIX)
              </h3>
              <button onClick={() => setIsPixSimModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriggerWebhookSim} className="space-y-4 mt-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Este simulador dispara uma notificaÃƒÆ’ÂÂ§ÃƒÆ’ÂÂ£o HTTP idÃƒÆ’ÂÂªntica ÃƒÆ’ÂÂ  enviada por gateways para o endpoint <code className="text-[#00D1FF] bg-zinc-800 px-1 py-0.5 rounded">/api/webhooks/pix</code>.
              </p>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Fatura para Baixar</label>
                <select
                  required
                  value={simTargetPaymentId}
                  onChange={(e) => setSimTargetPaymentId(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Escolha uma fatura pendente/atrasada --</option>
                  {payments.filter(p => p.status !== 'Pago').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.holder} - {p.amount} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPixSimModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={simLoading || !simTargetPaymentId}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  {simLoading ? 'Processando...' : 'Disparar PIX'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    
      {/* MODAL_COBRANCA_PIX_ASSOCIADO */}
      {isPixModalOpen && selectedPixRow && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-emerald-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" /> CobranÃƒÆ’ÂÂ§a Pix Imediata
              </h3>
              <button onClick={() => setIsPixModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-zinc-300 space-y-1">
              <p><strong className="text-zinc-400">Titular:</strong> {selectedPixRow.holder}</p>
              <p><strong className="text-zinc-400">Plano:</strong> {selectedPixRow.plan} - R$ {Number(selectedPixRow.amount || 0).toFixed(2)}</p>
              <p><strong className="text-zinc-400">Vencimento:</strong> {selectedPixRow.dueDate}</p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              {pixLoading ? (
                <p className="text-xs text-zinc-400 animate-pulse">Gerando QR Code e chave Pix...</p>
              ) : pixPayload?.qrCode ? (
                <div className="space-y-3 flex flex-col items-center w-full">
                  <img 
  src={pixPayload.qrCode && pixPayload.qrCode.startsWith('data:image') ? pixPayload.qrCode : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload.copyPaste)}`} 
  alt="QR Code Pix" 
  className="w-48 h-48 rounded-lg bg-white p-2 shadow-md" 
/>
                  <div className="w-full">
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 text-center">Pix Copia e Cola</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={pixPayload.copyPaste} 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 font-mono select-all"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(pixPayload.copyPaste);
                          alert('CÃƒÆ’ÂÂ³digo Pix copiado!');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold cursor-pointer"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="flex flex-col items-center space-y-2">
  <img 
    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`00020126580014BR.GOV.BCB.PIX0136pix@eternitysos.com.br520400005303986540${Number(selectedPixRow.amount || 0).toFixed(2)}5802BR5913ETERNITY SOS6008TERESINA62070503***6304`)}`} 
    alt="QR Code Pix PadrÃƒÆ’ÂÂ£o" 
    className="w-48 h-48 rounded-lg bg-white p-2 shadow-md mb-2" 
  />
  <p className="text-xs text-zinc-400">QR Code dinÃƒÆ’ÂÂ¢mico e chave padrÃƒÆ’ÂÂ£o prontos para leitura.</p>
</div>
                  <button 
                    onClick={() => {
                      const payload = "00020126580014BR.GOV.BCB.PIX0136pix@eternitysos.com.br520400005303986540" + Number(selectedPixRow.amount).toFixed(2) + "5802BR5913ETERNITY SOS6008TERESINA62070503***6304";
                      navigator.clipboard.writeText(payload);
                      alert('Chave Copia e Cola copiada!');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Copiar Linha DigitÃƒÆ’ÂÂ¡vel
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsPixModalOpen(false)}
                className="px-4 py-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
</div>
  );
}