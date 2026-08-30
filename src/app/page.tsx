'use client';

import { HeaderQuickSearch } from '@/components/HeaderQuickSearch';
﻿import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  DollarSign,
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
  TrendingUp,
  AlertCircle,
  Filter,
  Download,
  QrCode,
  Activity,
  HeartHandshake,
  Map,
  Church,
  Award,
  Send
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

import { UserRole, hasPermission, isTabAllowed, ROLE_PERMISSIONS } from '@/config/permissions';
import { logDispatchAction } from '@/lib/auditLogger';
import { ModalPlantao } from '@/components/modals/ModalPlantao';
import { ModalNewHolder } from '@/components/modals/ModalNewHolder';
import { ModalExpense } from '@/components/modals/ModalExpense';
import { ModalPix } from '@/components/modals/ModalPix';
import { ModalBoletoBatch } from '@/components/modals/ModalBoletoBatch';
import { ModalWhatsAppBatchBilling } from '@/components/modals/ModalWhatsAppBatchBilling';
import { ModalTanatopraxy } from '@/components/modals/ModalTanatopraxy';
import { ModalChapel } from '@/components/modals/ModalChapel';
import { ModalConvalescence } from '@/components/modals/ModalConvalescence';
import { ModalCollectorRoute } from '@/components/modals/ModalCollectorRoute';
import { ModalDependent } from '@/components/modals/ModalDependent';
import { ModalPixSim } from '@/components/modals/ModalPixSim';
import { TenantSettingsTab } from '@/components/tabs/TenantSettingsTab';
import { useTenant } from '@/contexts/TenantContext';
import { AssociatesTab } from '@/components/dashboard/AssociatesTab';
import { DispatchesTab } from '@/components/dashboard/DispatchesTab';
import { ConvalescenceTab } from '@/components/dashboard/ConvalescenceTab';
import { ThanatopraxyTab } from '@/components/dashboard/ThanatopraxyTab';
import { CollectorRoutesTab } from '@/components/dashboard/CollectorRoutesTab';
import { ChapelBurialsTab } from '@/components/dashboard/ChapelBurialsTab';
import { BenefitsTab } from '@/components/dashboard/BenefitsTab';
import { FleetTab } from '@/components/dashboard/FleetTab';
import { InventoryTab } from '@/components/dashboard/InventoryTab';
import { TenantSwitcher } from '@/components/dashboard/TenantSwitcher';
import { printServiceOrder, printFinancialReport, printCommissionReceipt } from '@/lib/printReports';
import { formatWhatsAppMessage } from '@/lib/whatsapp';
import { generateExecutiveReport, generateEmergencyOS, generatePlantaoReportPDF, EmergencyDispatch } from '@/lib/pdf-report';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

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
  relation: string;
  birth_date?: string;
  cpf?: string;
}

type TabType =
  | 'overview'
  | 'associates'
  | 'dispatches'
  | 'fleet'
  | 'inventory'
  | 'convalescence'
  | 'thanatopraxy'
  | 'routes'
  | 'chapel'
  | 'benefits'
  | 'settings';

export default function Dashboard() {
  const { currentTenant } = useTenant();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');

  // Estados de Dados
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [expenses, setExpenses] = useState<FleetExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Cálculo Dinâmico de MRR
  const totalMrr = payments.reduce((acc, p) => {
    const val = String(p.amount || '').replace(/[^0-9,-]/g, '').replace(',', '.');
    return acc + (parseFloat(val) || 0);
  }, 0);
  const formattedMrr = 'R$ ' + totalMrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros da aba PLANTÃO
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState<'all' | 'em_andamento' | 'concluido'>('all');
  const [dispatchSearchText, setDispatchSearchText] = useState('');

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlantaopen, setIsPlantaopen] = useState(false);
  const [isDependentModalOpen, setIsDependentModalOpen] = useState(false);
  const [isPixSimModalOpen, setIsPixSimModalOpen] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false);
  const [isWhatsAppBatchOpen, setIsWhatsAppBatchOpen] = useState(false);
  const [selectedHolderForBoleto, setSelectedHolderForBoleto] = useState<string | null>(null);
  const [selectedPixRow, setSelectedPixRow] = useState<any | null>(null);
  const [pixPayload, setPixPayload] = useState<{ qrCode: string; copyPaste: string; txid: string } | null>(null);
  const [pixLoading, setPixLoading] = useState(false);

  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Seleções
  const [selectedHolderForDep, setSelectedHolderForDep] = useState<PaymentRow | null>(null);
  const [dependentsList, setDependentsList] = useState<DependentItem[]>([]);

  // Formulários
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
        setIsAuthenticated(true);
        const roleFromMeta = (session?.user?.user_metadata?.role as UserRole) || 'admin';
        setCurrentUserRole(roleFromMeta);
        fetchSupabaseData();
      } catch (e) {
        // session bypass
      }
    }

    checkAuth();
  }, []);

  const fetchSupabaseData = async () => {
    setLoading(true);
    try {
      const { data: contractData } = await supabase
        .from('contracts')
        .select('id, status, created_at, holders(id, full_name, cpf, phone), plans(id, name, monthly_fee)')
        .order('created_at', { ascending: false });

      if (contractData) {
        const formatted: PaymentRow[] = contractData.map((item: any) => ({
          id: item.id,
          holderId: item.holders?.id || '',
          holder: item.holders?.full_name || 'Titular Cadastrado',
          cpf: item.holders?.cpf || '000.000.000-00',
          phone: item.holders?.phone || '86999990000',
          plan: item.plans?.name || 'Plano Padrão',
          amount: item.plans?.monthly_fee ? ('R$ ' + Number(item.plans.monthly_fee).toFixed(2).replace('.', ',')) : 'R$ 0,00',
          dueDate: new Date(item.created_at || Date.now()).toLocaleDateString('pt-BR'),
          method: 'PIX',
          status: item.status === 'active' ? 'Pago' : 'Pendente'
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
  };

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
          description: 'Mensalidade ' + item.plan + ' - ' + item.holder
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
      alert('Erro ao atualizar veículo: ' + err.message);
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
      alert('Erro ao cadastrar veículo: ' + err.message);
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
      const { error } = await supabase
        .from('emergency_dispatches')
        .update({
          status: 'concluido',
          completed_at: new Date().toISOString()
        })
        .eq('id', dispatch.id);

      if (error) throw error;

      if (dispatch.vehicle_id) {
        await supabase
          .from('fleet_vehicles')
          .update({ status: 'disponivel' })
          .eq('id', dispatch.vehicle_id);
      }

      let stockMsg = '';
      try {
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
        console.warn('Aviso estoque:', stockErr);
      }

      alert(`Missão ${dispatch.protocol} finalizada! Veículo liberado.${stockMsg}`);
      await fetchSupabaseData();
    } catch (err: any) {
      alert('Erro ao finalizar missão: ' + err.message);
    }
  };

  const openDependentModal = async (row: PaymentRow) => {
    setSelectedHolderForDep(row);
    setIsDependentModalOpen(true);
    if (!row.holderId) return;

    const { data } = await supabase
      .from('dependents')
      .select('*')
      .eq('holder_id', row.holderId)
      .order('created_at', { ascending: true });

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
          relation: depKinship || 'Outro',
          birth_date: depBirth || null,
          tenant_id: currentTenant?.id || 'a0000000-0000-0000-0000-000000000001'
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

  const handleDeleteDependent = async (dependentId: string) => {
    if (!confirm('Deseja realmente remover este dependente?')) return;
    try {
      const { error } = await supabase
        .from('dependents')
        .delete()
        .eq('id', dependentId);

      if (error) throw error;
      setDependentsList(prev => prev.filter(d => d.id !== dependentId));
    } catch (err: any) {
      alert('Erro ao excluir dependente: ' + err.message);
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
      if (!res.ok) throw new Error(json.error || 'Falha ao processar simulação.');

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
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const { data: holderData, error: holderError } = await supabase
        .from('holders')
        .insert([{ full_name: fullName, cpf, phone, tenant_id: currentTenant?.id || 'a0000000-0000-0000-0000-000000000001' }])
        .select()
        .single();

      if (holderError) throw new Error('Falha ao gravar titular: ' + holderError.message);

      const { data: plansData, error: planError } = await supabase
        .from('plans')
        .select('id, name, monthly_fee')
        .ilike('name', `%${selectedPlan}%`)
        .limit(1);

      if (planError || !plansData || plansData.length === 0) {
        throw new Error('Plano não localizado.');
      }

      const plan = plansData[0];

      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert([{ holder_id: holderData.id, plan_id: plan.id, status: 'active', tenant_id: currentTenant?.id || 'a0000000-0000-0000-0000-000000000001' }])
        .select()
        .single();

      if (contractError) throw new Error('Falha ao vincular contrato: ' + contractError.message);

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

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractForPlantao || !deceasedName) {
      alert('Selecione o contrato e informe o nome do falecido.');
      return;
    }

    setSaving(true);
    try {
      const generatedProtocol = `OS-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
      const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

      const { data: newDispatch, error: dispatchError } = await supabase
        .from('emergency_dispatches')
        .insert([
          {
            protocol: generatedProtocol,
            deceased_name: deceasedName,
            holder_name: selectedContractForPlantao.holder,
            plan_name: selectedContractForPlantao.plan,
            death_location: deathLocation,
            address: address,
            urn_model: urnModel,
            vehicle_id: selectedVehicleId || null,
            vehicle_desc: selectedVehicle ? `${selectedVehicle.model} (${selectedVehicle.plate})` : 'Não informado',
            driver_agent: driverAgent,
            family_contact_name: familyContactName,
            family_contact_phone: familyContactPhone,
            observations: `Contato: ${driverPhone}`,
            status: 'em_andamento',
            tenant_id: currentTenant?.id || 'a0000000-0000-0000-0000-000000000001'
          }
        ])
        .select()
        .single();

      if (dispatchError) throw dispatchError;

      if (selectedVehicleId) {
        await supabase
          .from('fleet_vehicles')
          .update({ status: 'em_uso' })
          .eq('id', selectedVehicleId);
      }

      await logDispatchAction({
        dispatchId: newDispatch.id,
        action: 'DISPATCH_CREATED',
        details: `Missão ${generatedProtocol} iniciada para ${deceasedName}`
      });

      alert(`Missão ${generatedProtocol} gerada com sucesso!`);
      setIsPlantaopen(false);
      setDeceasedName('');
      setAddress('');
      setFamilyContactName('');
      setFamilyContactPhone('');
      await fetchSupabaseData();
    } catch (err: any) {
      alert('Erro ao registrar acionamento: ' + (err.message || 'Falha'));
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    generateExecutiveReport(payments, formattedMrr, payments.length);
  };

  const handleExportPlantaoPDF = () => {
    const formatted: EmergencyDispatch[] = filteredDispatches.map((d) => ({
      protocol: d.protocol,
      deceasedName: d.deceased_name,
      holderName: d.holder_name,
      planName: d.plan_name,
      deathLocation: d.death_location,
      address: d.address,
      urnModel: d.urn_model,
      driverAgent: d.driver_agent,
      familyContact: `${d.family_contact_name} (${d.family_contact_phone})`,
      status: d.status,
      createdAt: d.created_at
    }));
    generatePlantaoReportPDF(formatted);
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

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar Completa */}
      <aside className="w-64 border-r border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div className="overflow-y-auto">
          <div className="p-6 flex items-center gap-3 border-b border-zinc-800/60">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide uppercase text-white">Eternity OS</h1>
          

              <p className="text-[11px] text-zinc-400 font-mono">v2.4 Enterprise ERP</p>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-zinc-800/40">
            <TenantSwitcher />
          </div>

          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Gestão & Finanças</div>
            
            <button
              onClick={() => setCurrentTab('overview')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'overview'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Painel Executivo</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('associates')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'associates'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Associados & Contratos</span>
              </div>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{payments.length}</span>
            </button>

            <div className="pt-2 px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Operações & Plantão</div>

            <button
              onClick={() => setCurrentTab('dispatches')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'dispatches'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Siren className="w-4 h-4 text-red-400" />
                <span>Plantão 24h</span>
              </div>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                {dispatches.filter((d) => d.status === 'em_andamento').length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('thanatopraxy')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'thanatopraxy'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Tanatopraxia</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('chapel')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'chapel'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Church className="w-4 h-4 text-amber-400" />
                <span>Capelas & Sepultamentos</span>
              </div>
            </button>

            <div className="pt-2 px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Logística & Suporte</div>

            <button
              onClick={() => setCurrentTab('fleet')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'fleet'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4" />
                <span>Frota & Logística</span>
              </div>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{vehicles.length}</span>
            </button>

            <button
              onClick={() => setCurrentTab('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'inventory'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4" />
                <span>Estoque & Urnas</span>
              </div>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                {inventory.reduce((acc, i) => acc + (i.quantity || 0), 0)}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('convalescence')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'convalescence'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="w-4 h-4 text-rose-400" />
                <span>Convalescença</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('routes')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'routes'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Map className="w-4 h-4 text-cyan-400" />
                <span>Rotas de Cobrança</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('benefits')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'benefits'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>Clube de Benefícios</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'settings'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              {currentUserRole.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-white capitalize">{currentUserRole}</p>
              <p className="text-[10px] text-zinc-500">Operador Ativo</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-zinc-800/60 px-8 flex items-center justify-between bg-zinc-950/40 backdrop-blur shrink-0 sticky top-0 z-10">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              {currentTab === 'overview' && 'Painel Executivo & Indicadores Estratégicos'}
              {currentTab === 'associates' && 'Gestão de Associados & Carteira de Contratos'}
              {currentTab === 'dispatches' && 'Central de Despachos & Plantão 24h'}
              {currentTab === 'fleet' && 'Controle de Frota & Logística'}
              {currentTab === 'inventory' && 'Almoxarifado & Estoque de Urnas'}
              {currentTab === 'convalescence' && 'Central de Empréstimo de Equipamentos'}
              {currentTab === 'thanatopraxy' && 'Laboratório de Tanatopraxia & Somatoconservação'}
              {currentTab === 'routes' && 'Roteirização de Cobrança em Campo'}
              {currentTab === 'chapel' && 'Salas Velatórias & Agendamento de Sepultamentos'}
              {currentTab === 'benefits' && 'Rede de Convênios & Clube de Vantagens'}
              {currentTab === 'settings' && 'Parâmetros Fiscais & Integrações Asaas'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWhatsAppBatchOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium flex items-center gap-2 transition"
            >
              <Send className="w-3.5 h-3.5 text-green-400" />
              Disparo WhatsApp
            </button>
            <button
              onClick={() => setIsBoletoModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium flex items-center gap-2 transition"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              Carnês em Lote
            </button>
            <button
              onClick={() => setIsPixSimModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium flex items-center gap-2 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              Simular PIX Webhook
            </button>
            <button
              onClick={() => setIsPlantaopen(true)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-red-950/40 transition"
            >
              <Siren className="w-3.5 h-3.5" />
              Acionamento 24h
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Titular
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {currentTab === 'overview' && (
            <>
              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="text-xs font-medium uppercase tracking-wider">MRR Recorrente</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">{formattedMrr}</p>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Receita Mensal Prevista</span>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="text-xs font-medium uppercase tracking-wider">Associados Ativos</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">{payments.length}</p>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Contratos na base</span>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="text-xs font-medium uppercase tracking-wider">Missões em Aberto</span>
                    <Siren className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">
                    {dispatches.filter((d) => d.status === 'em_andamento').length}
                  </p>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Plantão em atendimento</span>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="text-xs font-medium uppercase tracking-wider">Veículos Disponíveis</span>
                    <Truck className="w-4 h-4 text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">
                    {vehicles.filter((v) => v.status === 'disponivel').length}
                  </p>
                  <span className="text-[11px] text-zinc-400 mt-1 block">Total de {vehicles.length} veículos</span>
                </div>
              </div>

              {/* Gráfico de Tendência Financeira */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Fluxo de Receita Recorrente & Previsibilidade</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRecebido" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="recebido" stroke="#10b981" fillOpacity={1} fill="url(#colorRecebido)" name="Recebido Real" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabela de Faturamento e Cobrança Rápida */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-zinc-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gestão de Contratos & Faturas</h3>
                    <p className="text-xs text-zinc-400">Total de {filteredPayments.length} associados localizados</p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Buscar por nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      onClick={handleExportPDF}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-2 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Relatório Executivo
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950/60 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="px-5 py-3">Titular</th>
                        <th className="px-5 py-3">CPF</th>
                        <th className="px-5 py-3">Plano</th>
                        <th className="px-5 py-3">Mensalidade</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Ações Operacionais</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                            Carregando registros do banco de dados...
                          </td>
                        </tr>
                      ) : filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                            Nenhum associado encontrado para os filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                            <td className="px-5 py-3.5 font-medium text-white">{p.holder}</td>
                            <td className="px-5 py-3.5 font-mono text-zinc-400">{p.cpf}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {p.plan}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-emerald-400">{p.amount}</td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  p.status === 'Pago'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right space-x-2">
                              <button
                                onClick={() => handleOpenPixModal(p)}
                                className="px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900 border border-emerald-800/60 transition"
                                title="Gerar PIX"
                              >
                                PIX
                              </button>
                              <button
                                onClick={() => openDependentModal(p)}
                                className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition"
                                title="Ver Dependentes"
                              >
                                Dependentes
                              </button>
                              <button
                                onClick={() => handleOpenCard(p.cpf)}
                                className="px-2.5 py-1 rounded bg-blue-950/60 text-blue-400 hover:bg-blue-900 border border-blue-800/60 transition"
                                title="Carteirinha Digital"
                              >
                                Carteirinha
                              </button>
                              <button
                                onClick={() => handleSendWhatsApp(p)}
                                className="px-2.5 py-1 rounded bg-green-950/60 text-green-400 hover:bg-green-900 border border-green-800/60 transition"
                                title="Cobrança via WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {currentTab === 'associates' && (
            <AssociatesTab
              payments={payments}
              loading={loading}
              onOpenDependentModal={openDependentModal}
              onOpenCard={handleOpenCard}
              onOpenPixModal={handleOpenPixModal}
              onSendWhatsApp={handleSendWhatsApp}
              onMarkAsPaid={handleMarkAsPaid}
            />
          )}

          {currentTab === 'dispatches' && (
            <DispatchesTab
              dispatches={filteredDispatches}
              statusFilter={dispatchStatusFilter}
              setStatusFilter={setDispatchStatusFilter}
              searchText={dispatchSearchText}
              setSearchText={setDispatchSearchText}
              onCompleteDispatch={handleCompleteDispatch}
              onExportPDF={handleExportPlantaoPDF}
              onNewDispatch={() => setIsPlantaopen(true)}
            />
          )}

          {currentTab === 'fleet' && (
            <FleetTab
              vehicles={vehicles}
              expenses={expenses}
              onToggleStatus={handleToggleVehicleStatus}
              onNewVehicle={() => setIsNewVehicleModalOpen(true)}
              onNewExpense={() => setIsExpenseModalOpen(true)}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryTab
              inventory={inventory}
              onRefresh={fetchSupabaseData}
            />
          )}

          {currentTab === 'convalescence' && <ConvalescenceTab />}
          {currentTab === 'thanatopraxy' && <ThanatopraxyTab />}
          {currentTab === 'routes' && <CollectorRoutesTab />}
          {currentTab === 'chapel' && <ChapelBurialsTab />}
          {currentTab === 'benefits' && <BenefitsTab />}
          {currentTab === 'settings' && <TenantSettingsTab />}
        </div>
      </main>

      {/* Modais do Sistema */}
      {isModalOpen && (
        <ModalNewHolder
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateContract}
          fullName={fullName}
          setFullName={setFullName}
          cpf={cpf}
          setCpf={setCpf}
          phone={phone}
          setPhone={setPhone}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          saving={saving}
        />
      )}

      {isPlantaopen && (
        <ModalPlantao
          isOpen={isPlantaopen}
          onClose={() => setIsPlantaopen(false)}
          onSubmit={handleCreateDispatch}
          payments={payments}
          selectedContract={selectedContractForPlantao}
          setSelectedContract={setSelectedContractForPlantao}
          deceasedName={deceasedName}
          setDeceasedName={setDeceasedName}
          deathLocation={deathLocation}
          setDeathLocation={setDeathLocation}
          address={address}
          setAddress={setAddress}
          driverAgent={driverAgent}
          setDriverAgent={setDriverAgent}
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          setSelectedVehicleId={setSelectedVehicleId}
          urnModel={urnModel}
          setUrnModel={setUrnModel}
          familyContactName={familyContactName}
          setFamilyContactName={setFamilyContactName}
          familyContactPhone={familyContactPhone}
          setFamilyContactPhone={setFamilyContactPhone}
          driverPhone={driverPhone}
          setDriverPhone={setDriverPhone}
          saving={saving}
          inventory={inventory}
        />
      )}

      {isDependentModalOpen && selectedHolderForDep && (
        <ModalDependent
          isOpen={isDependentModalOpen}
          onClose={() => setIsDependentModalOpen(false)}
          holder={selectedHolderForDep}
          dependents={dependentsList}
          depName={depName}
          setDepName={setDepName}
          depKinship={depKinship}
          setDepKinship={setDepKinship}
          depBirth={depBirth}
          setDepBirth={setDepBirth}
          onAddDependent={handleAddDependent} onDeleteDependent={handleDeleteDependent} />
      )}

      {isPixModalOpen && (
        <ModalPix
          isOpen={isPixModalOpen}
          onClose={() => setIsPixModalOpen(false)}
          selectedRow={selectedPixRow}
          pixPayload={pixPayload}
          pixLoading={pixLoading}
        />
      )}

      {isPixSimModalOpen && (
        <ModalPixSim
          isOpen={isPixSimModalOpen}
          onClose={() => setIsPixSimModalOpen(false)}
          payments={payments}
          targetPaymentId={simTargetPaymentId}
          setTargetPaymentId={setSimTargetPaymentId}
          onSimulate={handleTriggerWebhookSim}
          loading={simLoading}
        />
      )}

      {isBoletoModalOpen && (
        <ModalBoletoBatch
          isOpen={isBoletoModalOpen}
          onClose={() => setIsBoletoModalOpen(false)}
          holders={payments}
          initialHolderId={selectedHolderForBoleto}
          onSuccess={() => {
            setIsBoletoModalOpen(false);
            fetchSupabaseData();
          }}
        />
      )}

      {isWhatsAppBatchOpen && (
        <ModalWhatsAppBatchBilling
          isOpen={isWhatsAppBatchOpen}
          onClose={() => setIsWhatsAppBatchOpen(false)}
          payments={payments}
        />
      )}

      {isExpenseModalOpen && (
        <ModalExpense
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSubmit={handleCreateExpense}
          vehicles={vehicles}
          vehicleId={expVehicleId}
          setVehicleId={setExpVehicleId}
          expenseType={expType}
          setExpenseType={setExpType}
          amount={expAmount}
          setAmount={setExpAmount}
          currentKm={expKm}
          setCurrentKm={setExpKm}
          liters={expLiters}
          setLiters={setExpLiters}
          establishment={expEstablishment}
          setEstablishment={setExpEstablishment}
          expenseDate={expDate}
          setExpenseDate={setExpDate}
        />
      )}
    </div>
  );
}
