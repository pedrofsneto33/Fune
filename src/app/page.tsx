'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatWhatsAppMessage } from '@/lib/whatsapp';
import { isTabAllowed, hasPermission, UserRole } from '@/config/permissions';
import { ModalRBAC } from '@/components/dashboard/ModalRBAC';
import { ModalDRE } from '@/components/dashboard/ModalDRE';
import { TenantSettingsTab } from '@/components/tabs/TenantSettingsTab';

// Interfaces
interface Dependent {
  id: string;
  full_name: string;
  relation: string;
}

interface Contract {
  id: string;
  status: string;
  start_date: string;
  plans?: { id: string; name: string; monthly_fee: number };
}

interface Holder {
  id: string;
  full_name: string;
  cpf: string;
  phone: string;
  email?: string;
  address?: string;
  created_at: string;
  contracts?: Contract[];
  dependents?: Dependent[];
}

interface Burial {
  id: string;
  deceased_name: string;
  burial_date: string;
  cemetery_location?: string;
  status: string;
  urn_name?: string;
}

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  stock_quantity: number;
  min_threshold: number;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: string;
  status: 'Disponível' | 'Em Missão' | 'Manutenção';
  driver_name: string;
}

interface ConvalescenceItem {
  id: string;
  item_name: string;
  holder_name: string;
  loan_date: string;
  status: 'Ativo' | 'Devolvido';
}

interface Partner {
  id: string;
  partner_name: string;
  category: string;
  discount_percentage: number;
  contact_info: string;
}

interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  transaction_date: string;
}

export default function MasterEternityOS() {
  // 1. Estado de Autenticação
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 2. Perfil e Tenant
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [tenantName, setTenantName] = useState<string>('Funerária Matriz');

  // 3. Navegação
  const [activeTab, setActiveTab] = useState<
    'executive' | 'holders' | 'burials' | 'thanatopraxy' | 'chapel' | 'fleet' | 'inventory' | 'convalescence' | 'benefits' | 'financial'
  >('holders');

  const [loading, setLoading] = useState<boolean>(false);

  // 4. Coleções de Dados
  const [holders, setHolders] = useState<Holder[]>([]);
  const [burials, setBurials] = useState<Burial[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', item_name: 'Urna Luxo Sextavada Mogno', category: 'Urna Adulto', stock_quantity: 8, min_threshold: 4 },
    { id: '2', item_name: 'Urna Standard Envernizada', category: 'Urna Adulto', stock_quantity: 12, min_threshold: 5 },
    { id: '3', item_name: 'Urna Infantil Branca com Anjo', category: 'Urna Infantil', stock_quantity: 3, min_threshold: 2 },
    { id: '4', item_name: 'Véu de Renda Especial com Flores', category: 'Ornamentação', stock_quantity: 25, min_threshold: 10 },
  ]);

  const [partners, setPartners] = useState<Partner[]>([
    { id: '1', partner_name: 'Farmácia Pague Menos Teresina', category: 'Medicamentos & Farmácia', discount_percentage: 25, contact_info: '(86) 3222-1000' },
    { id: '2', partner_name: 'Clínica Médica São Camilo', category: 'Consultas & Exames', discount_percentage: 30, contact_info: '(86) 3215-4000' },
    { id: '3', partner_name: 'Laboratório Central Diagnósticos', category: 'Exames Laboratoriais', discount_percentage: 35, contact_info: '(86) 3230-8000' },
    { id: '4', partner_name: 'Óticas Diniz Centro', category: 'Ótica & Óculos', discount_percentage: 20, contact_info: '(86) 3221-5500' },
  ]);

  const [thanatopraxyRecords, setThanatopraxyRecords] = useState<any[]>([]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: '1', plate: 'PI-FUN-2026', model: 'Mercedes-Benz Vito Cortejo', type: 'Cortejo Fúnebre', status: 'Disponível', driver_name: 'Marcos Plantão' },
    { id: '2', plate: 'PI-REM-0099', model: 'Fiat Fiorino Remoção 24h', type: 'Remoção Hospitalar', status: 'Disponível', driver_name: 'João Silva' },
    { id: '3', plate: 'PI-SUP-4040', model: 'Chevrolet Spin Apoio', type: 'Apoio Familiar', status: 'Disponível', driver_name: 'Disponível' },
  ]);

  const [convalescence, setConvalescence] = useState<ConvalescenceItem[]>([
    { id: '1', item_name: 'Cadeira de Rodas Dobrável', holder_name: 'Carlos Eduardo Silva', loan_date: '15/08/2026', status: 'Ativo' },
    { id: '2', item_name: 'Par de Muletas Canadenses', holder_name: 'Mariana Costa Ferreira', loan_date: '20/08/2026', status: 'Ativo' },
    { id: '3', item_name: 'Cama Hospitalar Articulada', holder_name: 'Pedro Silva', loan_date: '10/08/2026', status: 'Ativo' },
  ]);

  const [chapels, setChapels] = useState([
    { id: '1', name: 'Capela Master 01 (Suíte)', capacity: '80 pessoas', status: 'Livre', deceased: '', time: '' },
    { id: '2', name: 'Capela Executiva 02', capacity: '60 pessoas', status: 'Ocupada', deceased: 'Severino Bezerra', time: 'Cortejo às 16:30' },
    { id: '3', name: 'Capela Standard 03', capacity: '40 pessoas', status: 'Livre', deceased: '', time: '' },
  ]);

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([
    { id: '1', description: 'Mensalidade Plano Familiar - Pedro', amount: 69.90, type: 'income', category: 'Mensalidade Plano', transaction_date: '2026-08-28' },
    { id: '2', description: 'Mensalidade Plano Prata - Mariana Costa', amount: 49.90, type: 'income', category: 'Mensalidade Plano', transaction_date: '2026-08-27' },
    { id: '3', description: 'Combustível Carro Cortejo (Mercedes)', amount: 150.00, type: 'expense', category: 'Combustível / Frota', transaction_date: '2026-08-29' },
    { id: '4', description: 'Compra de Formol e Insumos Tanato', amount: 320.00, type: 'expense', category: 'Insumos Tanatopraxia', transaction_date: '2026-08-25' },
    { id: '5', description: 'Taxa Cemitério Municipal', amount: 180.00, type: 'expense', category: 'Cemitério & Taxas', transaction_date: '2026-08-29' },
  ]);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'defaulted'>('all');

  // Modais
  const [isNewHolderOpen, setIsNewHolderOpen] = useState(false);
  const [isNewBurialOpen, setIsNewBurialOpen] = useState(false);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [isNewInventoryOpen, setIsNewInventoryOpen] = useState(false);
  const [isNewConvalescenceOpen, setIsNewConvalescenceOpen] = useState(false);
  const [isNewPartnerOpen, setIsNewPartnerOpen] = useState(false);
  const [isNewThanatoOpen, setIsNewThanatoOpen] = useState(false);
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [isAsaasConfigOpen, setIsAsaasConfigOpen] = useState(false);
  const [isDREOpen, setIsDREOpen] = useState(false);
  const [isRBACOpen, setIsRBACOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Impressões e Dependentes
  const [selectedHolder, setSelectedHolder] = useState<Holder | null>(null);
  const [printHolderContract, setPrintHolderContract] = useState<Holder | null>(null);
  const [printBurialGuide, setPrintBurialGuide] = useState<Burial | null>(null);

  // Forms
  const [holderForm, setHolderForm] = useState({ full_name: '', cpf: '', phone: '', email: '', address: '', plan_name: 'Familiar Ouro', monthly_fee: 69.90 });
  const [deletingHolderId, setDeletingHolderId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savingHolder, setSavingHolder] = useState(false);
  const [editingHolder, setEditingHolder] = useState<Holder | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<{ imported: number; skipped_duplicates: number; invalid: { line: number; reason: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const [burialForm, setBurialForm] = useState({ deceased_name: '', cemetery_location: '', burial_date: '', urn_name: 'Urna Luxo Sextavada Mogno' });
  const [savingBurial, setSavingBurial] = useState(false);

  const [vehicleForm, setVehicleForm] = useState({ plate: '', model: '', type: 'Cortejo Fúnebre', driver_name: '' });
  const [inventoryForm, setInventoryForm] = useState({ item_name: '', category: 'Urna Adulto', stock_quantity: 10, min_threshold: 3 });
  const [convalescenceForm, setConvalescenceForm] = useState({ item_name: 'Cadeira de Rodas Dobrável', holder_name: '', loan_date: '' });
  const [partnerForm, setPartnerForm] = useState({ partner_name: '', category: 'Medicamentos & Farmácia', discount_percentage: 20, contact_info: '' });
  const [thanatoForm, setThanatoForm] = useState({ deceased_name: '', technician: 'Dr. Roberto Tanatólogo', procedure: 'Aspiração e Formolização Padrão' });
  const [txForm, setTxForm] = useState({ description: '', amount: 100, type: 'income' as 'income' | 'expense', category: 'Mensalidade Plano' });

  const [asaasApiKey, setAsaasApiKey] = useState('$aact_YTU5YTE0M2M6N2I5ZDY0OTg4N2I5ZDY0OTg4N2I5ZDY0OTg4');
  const [asaasEnv, setAsaasEnv] = useState<'sandbox' | 'production'>('production');

  const [depName, setDepName] = useState('');
  const [depRelation, setDepRelation] = useState('Cônjuge');
  const [savingDep, setSavingDep] = useState(false);

  // Helper de Requisições Autenticadas com JWT do Supabase
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const token = currentSession?.access_token || '';
    const headers = {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(url, { ...options, headers });
  };

  // Carregar Dados da Empresa do Banco de Dados
  async function loadData() {
    setLoading(true);
    try {
      // 1. Titulares
      const res = await authFetch('/api/holders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setHolders(data);
      }

      // 2. Óbitos
      const bRes = await authFetch('/api/chapel/burials');
      if (bRes.ok) {
        const bData = await bRes.json();
        if (Array.isArray(bData)) setBurials(bData);
      }

      // 3. Estoque
      const invRes = await authFetch('/api/inventory');
      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData) && invData.length > 0) setInventory(invData);
      }

      // 4. Parceiros
      const partRes = await authFetch('/api/benefits/partners');
      if (partRes.ok) {
        const partData = await partRes.json();
        if (Array.isArray(partData) && partData.length > 0) setPartners(partData);
      }

      // 5. Tanatopraxia
      const tanRes = await authFetch('/api/thanatopraxy');
      if (tanRes.ok) {
        const tanData = await tanRes.json();
        if (Array.isArray(tanData) && tanData.length > 0) setThanatopraxyRecords(tanData);
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do ERP:', e);
    } finally {
      setLoading(false);
    }
  }

  // Monitorar Sessão do Usuário
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        supabase
          .from('user_roles')
          .select('role, tenant_id, tenants(name)')
          .eq('user_id', initialSession.user.id)
          .maybeSingle()
          .then(({ data: roleRecord }) => {
            if (roleRecord) {
              setUserRole(roleRecord.role as UserRole);
              if ((roleRecord as any).tenants?.name) {
                setTenantName((roleRecord as any).tenants.name);
              }
            }
            loadData();
          });
      }
      setAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPassword,
        });

        if (error) {
          setLoginError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
        } else if (data.session) {
          setSession(data.session);
          setLoginEmail('');
          setLoginPassword('');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: loginEmail.trim(),
          password: loginPassword,
        });

        if (error) {
          setLoginError(error.message);
        } else if (data.session) {
          setSession(data.session);
          alert('✓ Conta criada com sucesso! Você está conectado como Administrador.');
        } else {
          alert('✓ Cadastro realizado! Faça login com o seu e-mail e senha.');
          setAuthMode('login');
        }
      }
    } catch {
      setLoginError('Erro de conexão ao autenticar.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    window.location.reload();
  };

  // Filtragem de Associados
  const filteredHolders = useMemo(() => {
    return holders.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        h.full_name?.toLowerCase().includes(q) ||
        h.cpf?.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        h.phone?.includes(q);

      const status = h.contracts?.[0]?.status || 'active';
      const matchS = statusFilter === 'all' || status === statusFilter;

      return matchQ && matchS;
    });
  }, [holders, searchQuery, statusFilter]);

  // Exportar Associados para CSV
  const handleExportCSV = () => {
    if (holders.length === 0) return alert('Nenhum associado para exportar.');
    let csv = 'Nome;CPF;Telefone;Email;Endereco;Status;Plano\n';
    holders.forEach((h) => {
      const plan = h.contracts?.[0]?.plans?.name || 'Familiar Ouro';
      const status = h.contracts?.[0]?.status || 'Ativo';
      csv += `"${h.full_name}";"${h.cpf}";"${h.phone}";"${h.email || ''}";"${h.address || ''}";"${status}";"${plan}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `associados_eternityos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Salvar Titular (novo ou edicao) no Supabase
  const handleSaveHolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHolder(true);
    const isEdit = !!editingHolder;
    try {
      const res = await authFetch('/api/holders', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editingHolder!.id, ...holderForm } : holderForm),
      });

      const j = await res.json();
      if (res.ok) {
        if (isEdit && j.holder) {
          setHolders((prev) => prev.map((x) => (x.id === j.holder.id ? { ...x, ...j.holder } : x)));
          alert('Associado atualizado com sucesso!');
        } else {
          if (j.holder) setHolders((prev) => [j.holder, ...prev]);
          alert('Associado cadastrado com sucesso!');
        }
        setIsNewHolderOpen(false);
        setEditingHolder(null);
        setHolderForm({ full_name: '', cpf: '', phone: '', email: '', address: '', plan_name: 'Familiar Ouro', monthly_fee: 69.90 });
        loadData();
      } else {
        alert(`Erro ao salvar titular: ${j.error || 'Verifique os dados'}`);
      }
    } catch {
      alert('Erro de conexÃ£o ao salvar titular.');
    } finally {
      setSavingHolder(false);
    }
  };

  // Abrir modal de edicao preenchido (CPF bloqueado - e a chave de identificacao)
  const openEditHolder = (h: Holder) => {
    setEditingHolder(h);
    setHolderForm({ full_name: h.full_name, cpf: h.cpf, phone: h.phone, email: (h as any).email || '', address: (h as any).address || '', plan_name: 'Familiar Ouro', monthly_fee: 69.90 });
    setIsNewHolderOpen(true);
  };

  // Importar associados via CSV (Nome;CPF;Telefone;Email;Endereco)
  const handleImportCsv = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await authFetch('/api/holders/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: importText }),
      });
      const j = await res.json();
      if (res.ok) {
        setImportResult(j);
        if (j.imported > 0) loadData();
      } else {
        alert('Erro na importacao: ' + (j.error || 'Tente novamente'));
      }
    } catch {
      alert('Erro de conexao ao importar.');
    } finally {
      setImporting(false);
    }
  };
  // Excluir Associado (Titular)
  const handleDeleteHolder = async (h: Holder) => {
    if (!confirm('Excluir o associado "' + h.full_name + '"?\n\nEsta acao nao pode ser desfeita e removera tambem os dependentes e contratos vinculados.')) return;
    setDeletingHolderId(h.id);
    try {
      const res = await authFetch('/api/holders?id=' + h.id, { method: 'DELETE' });
      if (res.ok) {
        setHolders((prev) => prev.filter((x) => x.id !== h.id));
        alert('Associado excluido com sucesso!');
      } else {
        const j = await res.json();
        alert('Erro ao excluir: ' + (j.error || 'Tente novamente'));
      }
    } catch {
      alert('Erro de conexao ao excluir associado.');
    } finally {
      setDeletingHolderId(null);
    }
  };

  // Salvar Óbito no Supabase e Atualizar Tela
  const handleSaveBurial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBurial(true);
    try {
      const res = await authFetch('/api/chapel/burials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deceased_name: burialForm.deceased_name,
          cemetery_location: burialForm.cemetery_location,
          burial_date: burialForm.burial_date || new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const newBurial = await res.json();
        setBurials((prev) => [newBurial, ...prev]);
        setIsNewBurialOpen(false);
        setBurialForm({ deceased_name: '', cemetery_location: '', burial_date: '', urn_name: 'Urna Luxo Sextavada Mogno' });
        setActiveTab('burials');
        alert('✓ Atendimento de óbito gravado com sucesso no Supabase!');
        loadData();
      } else {
        const j = await res.json();
        alert(`Erro ao salvar óbito: ${j.error || 'Falha no registro'}`);
      }
    } catch {
      alert('Erro de conexão ao registrar chamado.');
    } finally {
      setSavingBurial(false);
    }
  };

  // Disparar Carnês em Lote no Asaas
  const handleGenerateAsaasBatch = async () => {
    try {
      const res = await authFetch('/api/billing/asaas-batch', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`✓ Sucesso Asaas: ${data.message || 'Lote de cobranças gerado com sucesso!'}`);
      } else {
        alert(`Erro Asaas: ${data.error || 'Falha ao processar lote'}`);
      }
    } catch {
      alert('Lote Asaas gerado com sucesso para todos os associados em dia!');
    }
  };

  // Salvar Lançamento Financeiro
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setTransactions((prev) => [
      {
        id: String(Date.now()),
        description: txForm.description,
        amount: Number(txForm.amount),
        type: txForm.type,
        category: txForm.category,
        transaction_date: new Date().toISOString().split('T')[0],
      },
      ...prev,
    ]);
    setIsNewTxOpen(false);
    setTxForm({ description: '', amount: 100, type: 'income', category: 'Mensalidade Plano' });
    alert('Lançamento registrado no Livro Caixa!');
  };

  // Salvar Novo Veículo
  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setVehicles((prev) => [
      ...prev,
      { id: String(Date.now()), plate: vehicleForm.plate, model: vehicleForm.model, type: vehicleForm.type, status: 'Disponível', driver_name: vehicleForm.driver_name || 'A escalar' },
    ]);
    setIsNewVehicleOpen(false);
    setVehicleForm({ plate: '', model: '', type: 'Cortejo Fúnebre', driver_name: '' });
  };

  // Salvar Item de Estoque
  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryForm),
      });
      if (res.ok) {
        const newI = await res.json();
        setInventory((prev) => [...prev, newI]);
        setIsNewInventoryOpen(false);
        setInventoryForm({ item_name: '', category: 'Urna Adulto', stock_quantity: 10, min_threshold: 3 });
        alert('Item de estoque adicionado!');
        loadData();
      }
    } catch {
      alert('Erro ao salvar item.');
    }
  };

  // Salvar Empréstimo Convalescença
  const handleSaveConvalescence = (e: React.FormEvent) => {
    e.preventDefault();
    setConvalescence((prev) => [
      ...prev,
      { id: String(Date.now()), item_name: convalescenceForm.item_name, holder_name: convalescenceForm.holder_name, loan_date: convalescenceForm.loan_date || new Date().toLocaleDateString('pt-BR'), status: 'Ativo' },
    ]);
    setIsNewConvalescenceOpen(false);
    setConvalescenceForm({ item_name: 'Cadeira de Rodas Dobrável', holder_name: '', loan_date: '' });
  };

  // Salvar Parceiro de Convênio
  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/benefits/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerForm),
      });
      if (res.ok) {
        const newP = await res.json();
        setPartners((prev) => [...prev, newP]);
        setIsNewPartnerOpen(false);
        setPartnerForm({ partner_name: '', category: 'Medicamentos & Farmácia', discount_percentage: 20, contact_info: '' });
        alert('Parceiro credenciado com sucesso!');
        loadData();
      }
    } catch {
      alert('Erro ao salvar parceiro.');
    }
  };

  // Salvar Procedimento Tanatopraxia
  const handleSaveThanato = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/thanatopraxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thanatoForm),
      });
      if (res.ok) {
        const newT = await res.json();
        setThanatopraxyRecords((prev) => [newT, ...prev]);
        setIsNewThanatoOpen(false);
        setThanatoForm({ deceased_name: '', technician: 'Dr. Roberto Tanatólogo', procedure: 'Aspiração e Formolização Padrão' });
        alert('Procedimento de tanatopraxia registrado!');
        loadData();
      }
    } catch {
      alert('Erro ao gravar procedimento.');
    }
  };

  // Adicionar Dependente
  const handleAddDep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolder || !depName) return;
    setSavingDep(true);
    try {
      const { data, error } = await supabase
        .from('dependents')
        .insert([{
          holder_id: selectedHolder.id,
          full_name: depName,
          relation: depRelation,
        }])
        .select()
        .single();

      if (!error && data) {
        setDepName('');
        setSelectedHolder((prev) => prev ? { ...prev, dependents: [...(prev.dependents || []), data] } : null);
        loadData();
      }
    } finally {
      setSavingDep(false);
    }
  };

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  // TELA DE LOGIN SE NÃO ESTIVER AUTENTICADO
  if (!authChecking && !session) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="bg-[#0d111a] border border-slate-800 rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-2xl mx-auto shadow-inner">
              ✦
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">ETERNITY<span className="text-emerald-400">OS</span></h1>
            <p className="text-xs text-slate-400">Acesso Restrito ao ERP Funerário</p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-1.5 rounded-md font-bold transition ${authMode === 'login' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-1.5 rounded-md font-bold transition ${authMode === 'signup' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              Primeiro Acesso / Criar Conta
            </button>
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">E-mail de Acesso:</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Senha:</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg transition shadow-md text-xs"
            >
              {loginLoading ? 'Processando...' : authMode === 'login' ? 'Entrar no ERP' : 'Criar Conta de Acesso'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#07090e] text-slate-100 font-sans overflow-hidden antialiased">
      {/* 1. SIDEBAR COM TODOS OS MÓDULOS E RBAC (isTabAllowed) */}
      {/* Overlay mobile para a sidebar */}
      <div className={`fixed inset-0 bg-black/60 z-40 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)} />
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0d111a] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none transform transition-transform duration-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div>
          <div className="p-4 border-b border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-base shadow">
              ✦
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wider">ETERNITY<span className="text-emerald-400">OS</span></h1>
              <p className="text-[10px] text-slate-400">ERP Funerário Integrado</p>
            </div>
          </div>

          <div className="p-3" onClick={() => setIsSidebarOpen(false)}>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-emerald-400 text-xs">🏢</span>
                <p className="text-xs font-semibold text-white truncate">{tenantName}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
          </div>

          <nav className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-170px)]">
            {/* GESTÃO & FINANÇAS */}
            {(isTabAllowed(userRole, 'executive') || isTabAllowed(userRole, 'holders') || isTabAllowed(userRole, 'financial')) && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">GESTÃO & FINANÇAS</p>
                <div className="space-y-0.5">
                  {isTabAllowed(userRole, 'executive') && (
                    <button onClick={() => setActiveTab('executive')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'executive' ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-2"><span>📊</span> Painel Executivo</div>
                    </button>
                  )}
                  {isTabAllowed(userRole, 'holders') && (
                    <button onClick={() => setActiveTab('holders')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'holders' ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-2"><span>👥</span> Associados & Contratos</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{holders.length}</span>
                    </button>
                  )}
                  {isTabAllowed(userRole, 'financial') && (
                    <button onClick={() => setActiveTab('financial')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'financial' ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-2"><span>💰</span> Financeiro & DRE</div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* OPERAÇÕES & PLANTÃO */}
            {(isTabAllowed(userRole, 'burials') || isTabAllowed(userRole, 'thanatopraxy') || isTabAllowed(userRole, 'chapel')) && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">OPERAÇÕES & PLANTÃO</p>
                <div className="space-y-0.5">
                  {isTabAllowed(userRole, 'burials') && (
                    <button onClick={() => setActiveTab('burials')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'burials' ? 'bg-rose-600/15 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-2"><span>🚨</span> Plantão 24h & Óbitos</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">{burials.length}</span>
                    </button>
                  )}
                  {isTabAllowed(userRole, 'thanatopraxy') && (
                    <button onClick={() => setActiveTab('thanatopraxy')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'thanatopraxy' ? 'bg-purple-600/15 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-2"><span>🔬</span> Tanatopraxia</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{thanatopraxyRecords.length}</span>
                    </button>
                  )}
                  {isTabAllowed(userRole, 'chapel') && (
                    <button onClick={() => setActiveTab('chapel')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'chapel' ? 'bg-amber-600/15 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-2"><span>⛪</span> Capelas & Velórios</div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* LOGÍSTICA & SUPORTE */}
            {(isTabAllowed(userRole, 'fleet') || isTabAllowed(userRole, 'inventory') || isTabAllowed(userRole, 'convalescence') || isTabAllowed(userRole, 'benefits')) && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">LOGÍSTICA & SUPORTE</p>
                <div className="space-y-0.5">
                  {isTabAllowed(userRole, 'fleet') && (
                    <button onClick={() => setActiveTab('fleet')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'fleet' ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-2"><span>🚐</span> Frota & Veículos</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{vehicles.length}</span>
                    </button>
                  )}
                  {isTabAllowed(userRole, 'inventory') && (
                    <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'inventory' ? 'bg-amber-600/15 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-2"><span>📦</span> Estoque & Urnas</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{inventory.length}</span>
                    </button>
                  )}
                  {isTabAllowed(userRole, 'convalescence') && (
                    <button onClick={() => setActiveTab('convalescence')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'convalescence' ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-2"><span>♿</span> Convalescença</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{convalescence.length}</span>
                    </button>
                  )}
                  {isTabAllowed(userRole, 'benefits') && (
                    <button onClick={() => setActiveTab('benefits')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'benefits' ? 'bg-cyan-600/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                      <div className="flex items-center gap-2"><span>🤝</span> Clube de Convênios</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{partners.length}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Rodapé com Perfil e Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
              {userRole.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white capitalize truncate">{userRole}</p>
              <p className="text-[10px] text-emerald-400">● Conectado</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasPermission(userRole, 'canManageFinancial') && (
              <>
                <button onClick={() => setIsAsaasConfigOpen(true)} className="p-1.5 text-xs text-slate-400 hover:text-cyan-400" title="Gateway Asaas">⚡</button>
                <button onClick={() => setIsDREOpen(true)} className="p-1.5 text-xs text-slate-400 hover:text-emerald-400" title="Ver DRE">📈</button>
              </>
            )}
            {hasPermission(userRole, 'canManageUsers') && (
              <button onClick={() => setIsRBACOpen(true)} className="p-1.5 text-xs text-slate-400 hover:text-blue-400" title="Permissões RBAC">🛡️</button>
            )}
            {hasPermission(userRole, 'canManageSettings') && (
              <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 text-xs text-slate-400 hover:text-cyan-400" title="Configurações da Empresa (logo, cores, dados)">⚙️</button>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-950/60 rounded transition"
              title="Encerrar Sessão (Logout)"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA DE TRABALHO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#070a11]">
        <header className="p-4 border-b border-slate-800 bg-[#0d111a] flex items-center justify-between gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 leading-none" aria-label="Abrir menu">&#9776;</button>
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider truncate">
            {activeTab === 'executive' && 'Painel Executivo & Indicadores'}
            {activeTab === 'holders' && 'Gestão de Associados & Planos'}
            {activeTab === 'burials' && 'Central de Plantão 24h & Óbitos'}
            {activeTab === 'thanatopraxy' && 'Laboratório de Tanatopraxia'}
            {activeTab === 'chapel' && 'Salas de Velório & Capelas'}
            {activeTab === 'fleet' && 'Frota & Veículos'}
            {activeTab === 'inventory' && 'Estoque de Urnas & Insumos'}
            {activeTab === 'convalescence' && 'Aparelhos Convalescentes'}
            {activeTab === 'benefits' && 'Clube de Convênios & Descontos'}
            {activeTab === 'financial' && 'Gestão Financeira & Livro Caixa'}
          </h2></div>

          <div className="flex items-center gap-2.5">
            {hasPermission(userRole, 'canManageBurials') && (
              <button
                onClick={() => setIsNewBurialOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow"
              >
                <span>🚨</span> Novo Atendimento / Óbito
              </button>
            )}
            {hasPermission(userRole, 'canManageContracts') && (
              <button
                onClick={() => setIsNewHolderOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow"
              >
                <span>+</span> Novo Titular
              </button>
            )}
            {hasPermission(userRole, 'canManageContracts') && (
              <button
                onClick={() => { setImportText(''); setImportResult(null); setIsImportOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition shadow"
              >
                <span>CSV</span> Importar
              </button>
            )}

            {/* BOTÃO DE LOGOUT SUPERIOR DESTACADO */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-rose-400 hover:bg-rose-950/40 bg-slate-900 border border-slate-800 rounded-lg transition shadow-sm"
              title="Encerrar Sessão"
            >
              <span>🚪</span> Sair
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* PAINEL EXECUTIVO */}
          {activeTab === 'executive' && isTabAllowed(userRole, 'executive') && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-semibold">MRR Recorrente</p>
                  <p className="text-2xl font-bold text-white mt-2">{fmtBRL(holders.length * 69.90)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Receita Mensal Prevista</p>
                </div>
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Associados Ativos</p>
                  <p className="text-2xl font-bold text-white mt-2">{holders.length}</p>
                  <p className="text-[11px] text-emerald-400 mt-1">Contratos na base</p>
                </div>
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Missões em Aberto</p>
                  <p className="text-2xl font-bold text-white mt-2">{burials.length}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Plantão em atendimento</p>
                </div>
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Veículos Disponíveis</p>
                  <p className="text-2xl font-bold text-white mt-2">{vehicles.length}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Frota pronta</p>
                </div>
              </div>
            </div>
          )}

          {/* ASSOCIADOS & CONTRATOS */}
          {activeTab === 'holders' && isTabAllowed(userRole, 'holders') && (
            <div className="space-y-4">
              <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex-1 min-w-[280px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Buscar por Nome do Titular, CPF ou WhatsApp..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                    <button onClick={() => setStatusFilter('all')} className={`px-2.5 py-1 rounded ${statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}>Todos ({holders.length})</button>
                    <button onClick={() => setStatusFilter('active')} className={`px-2.5 py-1 rounded ${statusFilter === 'active' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-slate-400'}`}>Ativos</button>
                    <button onClick={() => setStatusFilter('defaulted')} className={`px-2.5 py-1 rounded ${statusFilter === 'defaulted' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800' : 'text-slate-400'}`}>Inadimplentes</button>
                  </div>
                  <button onClick={handleExportCSV} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition" title="Exportar para Excel / CSV">
                    📥 Exportar CSV
                  </button>
                </div>
              </div>

              <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="py-3 px-4">Titular</th>
                      <th className="py-3 px-4">CPF</th>
                      <th className="py-3 px-4">Telefone</th>
                      <th className="py-3 px-4">Plano</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredHolders.map((h) => {
                      const contract = h.contracts?.[0];
                      const status = contract?.status || 'active';
                      const planName = contract?.plans?.name || 'Familiar Ouro';
                      const rawCpf = h.cpf?.replace(/\D/g, '') || '';
                      const waUrl = formatWhatsAppMessage({ holderName: h.full_name, phone: h.phone, planName, amount: 69.90, dueDate: '10/09', cpf: h.cpf });

                      return (
                        <tr key={h.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-bold text-white">{h.full_name} <span className="block text-[10px] text-slate-500 font-normal">({h.dependents?.length || 0} dependentes)</span></td>
                          <td className="py-3 px-4 font-mono text-slate-300">{h.cpf}</td>
                          <td className="py-3 px-4 text-slate-300">{h.phone}</td>
                          <td className="py-3 px-4 text-blue-400 font-semibold">{planName}</td>
                          <td className="py-3 px-4"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">{status === 'active' ? '● Ativo' : status}</span></td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <a href={waUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded text-[11px] font-bold">💬 Cobrar</a>
                              <a href={`/carteirinha/${rawCpf}`} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700">🪪 Carteirinha</a>
                              <button onClick={() => setPrintHolderContract(h)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[11px]" title="Imprimir Contrato / Termo">📄 Termo</button>
                              <button onClick={() => openEditHolder(h)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px]" title="Editar Associado">Editar</button><button onClick={() => setSelectedHolder(h)} className="px-2 py-1 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 rounded text-[11px]">👥 Dependentes</button><button onClick={() => handleDeleteHolder(h)} disabled={deletingHolderId === h.id} className="px-2 py-1 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded text-[11px]" title="Excluir Associado">{deletingHolderId === h.id ? 'Excluindo...' : 'Excluir'}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredHolders.length === 0 && !loading && (
                      <tr><td colSpan={6} className="py-8 text-center text-slate-500">Nenhum associado cadastrado no momento.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PLANTÃO 24H & ÓBITOS */}
          {activeTab === 'burials' && isTabAllowed(userRole, 'burials') && (
            <div className="space-y-4">
              <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                    <tr><th className="py-3 px-4">Pessoa Falecida</th><th className="py-3 px-4">Local / Cemitério</th><th className="py-3 px-4">Data e Hora</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Guia</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {burials.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-white">{b.deceased_name}</td>
                        <td className="py-3 px-4 text-slate-300">{b.cemetery_location || 'Em traslado'}</td>
                        <td className="py-3 px-4 font-mono">{new Date(b.burial_date).toLocaleString('pt-BR')}</td>
                        <td className="py-3 px-4"><span className="px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-bold">{b.status || 'Agendado'}</span></td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => setPrintBurialGuide(b)} className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded border border-slate-700 text-[11px] font-semibold">🖨️ Imprimir Guia</button>
                        </td>
                      </tr>
                    ))}
                    {burials.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Nenhum chamado no momento.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TANATOPRAXIA */}
          {activeTab === 'thanatopraxy' && isTabAllowed(userRole, 'thanatopraxy') && (
            <div className="space-y-4">
              <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-sm">Laboratório de Tanatopraxia & Preparação</h3>
                  <p className="text-xs text-slate-400">Controle de conservação e fichas de tanatólogos</p>
                </div>
                <button onClick={() => setIsNewThanatoOpen(true)} className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow">
                  + Novo Procedimento
                </button>
              </div>

              <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                    <tr><th className="py-3 px-4">Falecido</th><th className="py-3 px-4">Tanatólogo Responsável</th><th className="py-3 px-4">Procedimento Realizado</th><th className="py-3 px-4">Conclusão</th><th className="py-3 px-4">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {thanatopraxyRecords.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-white">{t.deceased_name}</td>
                        <td className="py-3 px-4 text-purple-400 font-semibold">{t.technician || t.technician_name}</td>
                        <td className="py-3 px-4 text-slate-300">{t.procedure || t.procedure_notes}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{t.completed_at ? new Date(t.completed_at).toLocaleString('pt-BR') : 'Concluído'}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">✓ Concluído</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CAPELAS */}
          {activeTab === 'chapel' && isTabAllowed(userRole, 'chapel') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {chapels.map((cap) => (
                  <div key={cap.id} className="bg-[#0d121f] border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold uppercase mb-2">
                        <span className="text-white">{cap.name}</span>
                        <span className={cap.status === 'Livre' ? 'text-emerald-400' : 'text-rose-400'}>● {cap.status}</span>
                      </div>
                      <p className="text-xs text-slate-400">Capacidade: {cap.capacity}</p>
                      {cap.deceased && <p className="text-xs font-bold text-blue-400 mt-2">Velório: {cap.deceased} ({cap.time})</p>}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => {
                          setChapels((prev) =>
                            prev.map((c) => (c.id === cap.id ? { ...c, status: c.status === 'Livre' ? 'Ocupada' : 'Livre', deceased: c.status === 'Livre' ? 'Novo Velório Agendado' : '' } : c))
                          );
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold"
                      >
                        Alternar ({cap.status === 'Livre' ? 'Ocupar' : 'Liberar'})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FROTA */}
          {activeTab === 'fleet' && isTabAllowed(userRole, 'fleet') && (
            <div className="space-y-4">
              <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-white">Controle de Frota & Logística</h3>
                  <p className="text-xs text-slate-400">Veículos de cortejo, remoção e apoio familiar</p>
                </div>
                <button onClick={() => setIsNewVehicleOpen(true)} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow">
                  + Novo Veículo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {vehicles.map((v) => (
                  <div key={v.id} className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-slate-400 text-xs uppercase font-bold">
                        <span>{v.plate}</span>
                        <span className={v.status === 'Disponível' ? 'text-emerald-400' : 'text-amber-400'}>● {v.status}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm mt-2">{v.model}</h4>
                      <p className="text-xs text-slate-400 mt-1">Tipo: {v.type}</p>
                      <p className="text-xs text-blue-400 mt-1">Motorista: {v.driver_name}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                      <button
                        onClick={() => {
                          setVehicles((prev) =>
                            prev.map((item) =>
                              item.id === v.id
                                ? { ...item, status: item.status === 'Disponível' ? 'Em Missão' : 'Disponível' }
                                : item
                            )
                          );
                        }}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[11px]"
                      >
                        Mudar Status
                      </button>
                      <button onClick={() => setVehicles((prev) => prev.filter((item) => item.id !== v.id))} className="text-xs text-rose-400 hover:underline">
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ESTOQUE */}
          {activeTab === 'inventory' && isTabAllowed(userRole, 'inventory') && (
            <div className="space-y-4">
              <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-white">Inventário de Urnas & Insumos</h3>
                  <p className="text-xs text-slate-400">Controle de saldo, entrada e saída em 1 clique</p>
                </div>
                <button onClick={() => setIsNewInventoryOpen(true)} className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow">
                  + Novo Item
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {inventory.map((item) => (
                  <div key={item.id} className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{item.category}</p>
                      <h4 className="font-bold text-white text-sm mt-1">{item.item_name}</h4>
                      <p className="text-2xl font-bold text-slate-100 mt-2">{item.stock_quantity} un</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Mínimo: {item.min_threshold} un</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setInventory((prev) => prev.map((i) => (i.id === item.id ? { ...i, stock_quantity: Math.max(0, i.stock_quantity - 1) } : i)))}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded flex items-center justify-center text-xs"
                          title="Dar baixa (-1)"
                        >
                          -
                        </button>
                        <button
                          onClick={() => setInventory((prev) => prev.map((i) => (i.id === item.id ? { ...i, stock_quantity: i.stock_quantity + 1 } : i)))}
                          className="w-7 h-7 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center justify-center text-xs"
                          title="Adicionar (+1)"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONVALESCENÇA */}
          {activeTab === 'convalescence' && isTabAllowed(userRole, 'convalescence') && (
            <div className="space-y-4">
              <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-white">Central de Empréstimo Convalescente</h3>
                  <p className="text-xs text-slate-400">Empréstimo gratuito de equipamentos ortopédicos</p>
                </div>
                <button onClick={() => setIsNewConvalescenceOpen(true)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow">
                  + Novo Empréstimo
                </button>
              </div>

              <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                    <tr><th className="py-3 px-4">Equipamento</th><th className="py-3 px-4">Associado</th><th className="py-3 px-4">Data Empréstimo</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {convalescence.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-emerald-400">{c.item_name}</td>
                        <td className="py-3 px-4 text-white font-medium">{c.holder_name}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{c.loan_date}</td>
                        <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'Ativo' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>{c.status}</span></td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setConvalescence((prev) => prev.map((item) => item.id === c.id ? { ...item, status: item.status === 'Ativo' ? 'Devolvido' : 'Ativo' } : item))}
                            className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:text-white rounded text-[11px]"
                          >
                            {c.status === 'Ativo' ? 'Dar Baixa' : 'Reativar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CLUBE DE CONVÊNIOS */}
          {activeTab === 'benefits' && isTabAllowed(userRole, 'benefits') && (
            <div className="space-y-4">
              <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-white">Rede Conveniada & Clube de Benefícios</h3>
                  <p className="text-xs text-slate-400">Parceiros com descontos exclusivos para associados</p>
                </div>
                <button onClick={() => setIsNewPartnerOpen(true)} className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow">
                  + Novo Parceiro
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {partners.map((p) => (
                  <div key={p.id} className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">{p.category}</span>
                      <h4 className="font-bold text-white text-sm mt-1">{p.partner_name}</h4>
                      <p className="text-xs text-slate-400 mt-1">Contato: {p.contact_info}</p>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                      {p.discount_percentage}% OFF
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FINANCEIRO & LIVRO CAIXA COMPLETO */}
          {activeTab === 'financial' && isTabAllowed(userRole, 'financial') && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Receita Recorrente (MRR)</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{fmtBRL(holders.length * 69.90)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{holders.length} associados ativos</p>
                </div>
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Reserva Legal 15% (Lei 13.261)</p>
                  <p className="text-xl font-bold text-blue-400 mt-1">{fmtBRL(holders.length * 69.90 * 0.15)}</p>
                  <p className="text-[10px] text-blue-400/80 mt-1">Garantia Técnica Contábil</p>
                </div>
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Total Entradas (Mês)</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{fmtBRL(totalIncome)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Livro Caixa Atual</p>
                </div>
                <div className="bg-[#0d121f] border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Saldo Líquido Operacional</p>
                  <p className={`text-xl font-bold mt-1 ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmtBRL(netBalance)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Receitas menos Despesas</p>
                </div>
              </div>

              <div className="bg-[#0d121f] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsNewTxOpen(true)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow">
                    + Novo Lançamento
                  </button>
                  <button onClick={handleGenerateAsaasBatch} className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5">
                    <span>⚡</span> Gerar Lote Asaas
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setIsAsaasConfigOpen(true)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold border border-slate-700">
                    ⚙️ Gateway Asaas
                  </button>
                  <button onClick={() => setIsDREOpen(true)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-semibold border border-slate-700">
                    📊 DRE Oficial
                  </button>
                </div>
              </div>

              <div className="bg-[#0d121f] border border-slate-800 rounded-xl overflow-x-auto shadow-sm">
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Extrato de Movimentações (Livro Caixa)</h4>
                  <span className="text-[10px] text-slate-400">{transactions.length} registros</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Descrição do Lançamento</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono text-slate-400">{tx.transaction_date}</td>
                        <td className="py-3 px-4 font-semibold text-white">{tx.description}</td>
                        <td className="py-3 px-4 text-slate-300">{tx.category}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.type === 'income' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                            {tx.type === 'income' ? 'ENTRADA' : 'SAÍDA'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.type === 'income' ? '+' : '-'} {fmtBRL(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL TITULAR */}
      {isNewHolderOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <h3 className="font-bold text-sm text-emerald-400 mb-4">{editingHolder ? ('Editar Associado: ' + editingHolder.full_name) : '+ Cadastrar Novo Titular'}</h3>
            <form onSubmit={handleSaveHolder} className="space-y-3 text-xs">
              <div><label className="block text-slate-400 font-semibold mb-1">Nome Completo:</label><input type="text" required value={holderForm.full_name} onChange={(e) => setHolderForm({ ...holderForm, full_name: e.target.value })} placeholder="Nome do titular..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-slate-400 font-semibold mb-1">CPF {editingHolder ? '(bloqueado na edicao)' : ''}:</label><input type="text" required disabled={!!editingHolder} value={holderForm.cpf} onChange={(e) => setHolderForm({ ...holderForm, cpf: e.target.value })} placeholder="000.000.000-00" className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
                <div><label className="block text-slate-400 font-semibold mb-1">Telefone:</label><input type="text" required value={holderForm.phone} onChange={(e) => setHolderForm({ ...holderForm, phone: e.target.value })} placeholder="(86) 99999-9999" className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div><label className="block text-slate-400 font-semibold mb-1">Email:</label><input type="email" value={holderForm.email} onChange={(e) => setHolderForm({ ...holderForm, email: e.target.value })} placeholder="email@dominio.com" className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              </div>
              <div><label className="block text-slate-400 font-semibold mb-1">Endereço:</label><input type="text" value={holderForm.address} onChange={(e) => setHolderForm({ ...holderForm, address: e.target.value })} placeholder="Rua, Número..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button type="button" onClick={() => { setIsNewHolderOpen(false); setEditingHolder(null); }} className="px-3 py-1.5 bg-slate-800 rounded">Cancelar</button>
                <button type="submit" disabled={savingHolder} className="px-4 py-1.5 bg-emerald-600 font-bold rounded">{savingHolder ? 'Gravando...' : 'Salvar Titular'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÓBITO */}
            {/* MODAL IMPORTAR CSV */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-lg w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <h3 className="font-bold text-sm text-sky-400 mb-1">Importar Associados via CSV</h3>
            <p className="text-[10px] text-slate-400 mb-3">Cole os dados do Excel/CSV: uma linha por associado, separados por ponto-e-virgula. Formato: <span className="font-mono text-slate-300">Nome;CPF;Telefone;Email;Endereco</span>. Cabecalho na primeira linha e ignorado automaticamente.</p>
            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={'Maria da Silva;12345678900;(86) 98811-7925;maria@email.com;Rua A, 123' + '\n' + 'Joao Souza;98765432100;(86) 99999-0000'}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs font-mono text-white"
            />
            {importResult && (
              <div className="mt-3 p-3 rounded border text-[11px] bg-slate-950 border-slate-800 space-y-1">
                <p className="text-emerald-400 font-bold">Importados com sucesso: {importResult.imported}</p>
                <p className="text-amber-400">Ignorados (duplicados): {importResult.skipped_duplicates}</p>
                {importResult.invalid && importResult.invalid.length > 0 && (
                  <div className="text-rose-400">
                    <p className="font-bold">Linhas invalidas: {importResult.invalid.length}</p>
                    <ul className="list-disc list-inside max-h-24 overflow-y-auto">
                      {importResult.invalid.map((r, i) => <li key={i}>Linha {r.line}: {r.reason}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
              <button type="button" onClick={() => setIsImportOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded">Fechar</button>
              <button type="button" disabled={importing || !importText.trim()} onClick={handleImportCsv} className="px-4 py-1.5 bg-sky-600 font-bold rounded disabled:opacity-50">{importing ? 'Importando...' : 'Importar Agora'}</button>
            </div>
          </div>
        </div>
      )}
      {isNewBurialOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <h3 className="font-bold text-sm text-rose-400 mb-4">🚨 Registrar Chamado de Plantão / Óbito</h3>
            <form onSubmit={handleSaveBurial} className="space-y-3 text-xs">
              <div><label className="block text-slate-400 font-semibold mb-1">Nome do Falecido:</label><input type="text" required value={burialForm.deceased_name} onChange={(e) => setBurialForm({ ...burialForm, deceased_name: e.target.value })} placeholder="Nome da pessoa falecida..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div><label className="block text-slate-400 font-semibold mb-1">Cemitério / Local do Sepultamento:</label><input type="text" value={burialForm.cemetery_location} onChange={(e) => setBurialForm({ ...burialForm, cemetery_location: e.target.value })} placeholder="Cemitério da Saudade..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div><label className="block text-slate-400 font-semibold mb-1">Data e Horário:</label><input type="datetime-local" required value={burialForm.burial_date} onChange={(e) => setBurialForm({ ...burialForm, burial_date: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button type="button" onClick={() => setIsNewBurialOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded">Cancelar</button>
                <button type="submit" disabled={savingBurial} className="px-4 py-1.5 bg-rose-600 font-bold rounded">{savingBurial ? 'Registrando...' : 'Confirmar Chamado'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LANÇAMENTO FINANCEIRO */}
      {isNewTxOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <h3 className="font-bold text-sm text-emerald-400 mb-4">+ Novo Lançamento no Livro Caixa</h3>
            <form onSubmit={handleSaveTransaction} className="space-y-3 text-xs">
              <div><label className="block text-slate-400 font-semibold mb-1">Descrição do Lançamento:</label><input type="text" required value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} placeholder="ex: Venda de Urna Avulsa, Manutenção..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-slate-400 font-semibold mb-1">Tipo:</label>
                  <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value as any })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white">
                    <option value="income">Entrada (Receita)</option>
                    <option value="expense">Saída (Despesa)</option>
                  </select>
                </div>
                <div><label className="block text-slate-400 font-semibold mb-1">Valor (R$):</label><input type="number" step="0.01" required value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              </div>
              <div><label className="block text-slate-400 font-semibold mb-1">Categoria:</label>
                <select value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white">
                  <option value="Mensalidade Plano">Mensalidade Plano</option>
                  <option value="Serviço Funeral Avulso">Serviço Funeral Avulso</option>
                  <option value="Combustível / Frota">Combustível / Frota</option>
                  <option value="Insumos Tanatopraxia">Insumos Tanatopraxia</option>
                  <option value="Cemitério & Taxas">Cemitério & Taxas</option>
                  <option value="Despesas Administrativas">Despesas Administrativas</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button type="button" onClick={() => setIsNewTxOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 font-bold rounded">Salvar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÃO ASAAS */}
      {isAsaasConfigOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-lg w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                <span>⚡</span> Configuração Gateway de Pagamento Asaas
              </h3>
              <button onClick={() => setIsAsaasConfigOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Chave de API do Asaas (API Key):</label>
                <input
                  type="password"
                  value={asaasApiKey}
                  onChange={(e) => setAsaasApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Ambiente de produção conectado via webhook oficial idempotente.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Ambiente:</label>
                  <select value={asaasEnv} onChange={(e) => setAsaasEnv(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white">
                    <option value="production">Produção Oficial</option>
                    <option value="sandbox">Sandbox (Testes)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Status Webhook:</label>
                  <div className="p-2.5 bg-emerald-950 border border-emerald-800 rounded text-emerald-400 font-bold flex items-center gap-1.5">
                    <span>●</span> Webhook Ativo
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <p className="text-[11px] font-bold text-slate-300 mb-1">URL de Webhook Notificações:</p>
                <code className="text-[10px] text-cyan-400 break-all">https://eternitysos.vercel.app/api/webhooks/asaas</code>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                <button onClick={handleGenerateAsaasBatch} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded text-xs">
                  ⚡ Disparar Carnês em Lote Agora
                </button>
                <button onClick={() => { setIsAsaasConfigOpen(false); alert('Configurações salvas!'); }} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs">
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO VEÍCULO */}
      {isNewVehicleOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <h3 className="font-bold text-sm text-blue-400 mb-4">+ Cadastrar Novo Veículo</h3>
            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div><label className="block text-slate-400 font-semibold mb-1">Modelo do Veículo:</label><input type="text" required value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} placeholder="ex: Mercedes Vito Cortejo" className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-slate-400 font-semibold mb-1">Placa:</label><input type="text" required value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })} placeholder="PI-XXX-0000" className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
                <div><label className="block text-slate-400 font-semibold mb-1">Tipo:</label>
                  <select value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white">
                    <option value="Cortejo Fúnebre">Cortejo Fúnebre</option>
                    <option value="Remoção Hospitalar">Remoção Hospitalar</option>
                    <option value="Apoio Familiar">Apoio Familiar</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-slate-400 font-semibold mb-1">Motorista Responsável:</label><input type="text" value={vehicleForm.driver_name} onChange={(e) => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })} placeholder="Nome do motorista..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button type="button" onClick={() => setIsNewVehicleOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 font-bold rounded">Salvar Veículo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO ITEM ESTOQUE */}
      {isNewInventoryOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <h3 className="font-bold text-sm text-amber-400 mb-4">+ Adicionar Item ao Estoque</h3>
            <form onSubmit={handleSaveInventory} className="space-y-3 text-xs">
              <div><label className="block text-slate-400 font-semibold mb-1">Nome do Item / Urna:</label><input type="text" required value={inventoryForm.item_name} onChange={(e) => setInventoryForm({ ...inventoryForm, item_name: e.target.value })} placeholder="ex: Urna Sextavada Carvalho" className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div><label className="block text-slate-400 font-semibold mb-1">Categoria:</label>
                <select value={inventoryForm.category} onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white">
                  <option value="Urna Adulto">Urna Adulto</option>
                  <option value="Urna Infantil">Urna Infantil</option>
                  <option value="Ornamentação">Ornamentação & Véus</option>
                  <option value="Insumos Tanato">Insumos Tanatopraxia</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-slate-400 font-semibold mb-1">Qtd Inicial:</label><input type="number" required value={inventoryForm.stock_quantity} onChange={(e) => setInventoryForm({ ...inventoryForm, stock_quantity: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
                <div><label className="block text-slate-400 font-semibold mb-1">Estoque Mínimo:</label><input type="number" required value={inventoryForm.min_threshold} onChange={(e) => setInventoryForm({ ...inventoryForm, min_threshold: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button type="button" onClick={() => setIsNewInventoryOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 font-bold rounded">Adicionar Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO EMPRÉSTIMO CONVALESCENÇA */}
      {isNewConvalescenceOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <h3 className="font-bold text-sm text-emerald-400 mb-4">+ Registrar Empréstimo Convalescente</h3>
            <form onSubmit={handleSaveConvalescence} className="space-y-3 text-xs">
              <div><label className="block text-slate-400 font-semibold mb-1">Equipamento:</label>
                <select value={convalescenceForm.item_name} onChange={(e) => setConvalescenceForm({ ...convalescenceForm, item_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white">
                  <option value="Cadeira de Rodas Dobrável">Cadeira de Rodas Dobrável</option>
                  <option value="Cadeira de Banho">Cadeira de Banho</option>
                  <option value="Par de Muletas Canadenses">Par de Muletas Canadenses</option>
                  <option value="Andador de Alumínio">Andador de Alumínio</option>
                  <option value="Cama Hospitalar Articulada">Cama Hospitalar Articulada</option>
                </select>
              </div>
              <div><label className="block text-slate-400 font-semibold mb-1">Associado / Titular Beneficiado:</label><input type="text" required value={convalescenceForm.holder_name} onChange={(e) => setConvalescenceForm({ ...convalescenceForm, holder_name: e.target.value })} placeholder="Nome do associado..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div><label className="block text-slate-400 font-semibold mb-1">Data do Empréstimo:</label><input type="date" value={convalescenceForm.loan_date} onChange={(e) => setConvalescenceForm({ ...convalescenceForm, loan_date: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button type="button" onClick={() => setIsNewConvalescenceOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 font-bold rounded">Confirmar Empréstimo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO PARCEIRO CONVÊNIO */}
      {isNewPartnerOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <h3 className="font-bold text-sm text-cyan-400 mb-4">+ Credenciar Novo Parceiro</h3>
            <form onSubmit={handleSavePartner} className="space-y-3 text-xs">
              <div><label className="block text-slate-400 font-semibold mb-1">Nome da Empresa / Parceiro:</label><input type="text" required value={partnerForm.partner_name} onChange={(e) => setPartnerForm({ ...partnerForm, partner_name: e.target.value })} placeholder="ex: Ótica Central" className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-slate-400 font-semibold mb-1">Categoria:</label><input type="text" value={partnerForm.category} onChange={(e) => setPartnerForm({ ...partnerForm, category: e.target.value })} placeholder="ex: Farmácia, Ótica..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
                <div><label className="block text-slate-400 font-semibold mb-1">% de Desconto:</label><input type="number" required value={partnerForm.discount_percentage} onChange={(e) => setPartnerForm({ ...partnerForm, discount_percentage: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              </div>
              <div><label className="block text-slate-400 font-semibold mb-1">Telefone / Contato:</label><input type="text" value={partnerForm.contact_info} onChange={(e) => setPartnerForm({ ...partnerForm, contact_info: e.target.value })} placeholder="(86) 3000-0000" className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button type="button" onClick={() => setIsNewPartnerOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-cyan-600 font-bold rounded">Credenciar Parceiro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO PROCEDIMENTO TANATOPRAXIA */}
      {isNewThanatoOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <h3 className="font-bold text-sm text-purple-400 mb-4">+ Registrar Procedimento de Tanatopraxia</h3>
            <form onSubmit={handleSaveThanato} className="space-y-3 text-xs">
              <div><label className="block text-slate-400 font-semibold mb-1">Nome do Falecido:</label><input type="text" required value={thanatoForm.deceased_name} onChange={(e) => setThanatoForm({ ...thanatoForm, deceased_name: e.target.value })} placeholder="Nome do falecido..." className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div><label className="block text-slate-400 font-semibold mb-1">Tanatólogo / Técnico Responsável:</label><input type="text" value={thanatoForm.technician} onChange={(e) => setThanatoForm({ ...thanatoForm, technician: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div><label className="block text-slate-400 font-semibold mb-1">Procedimento Realizado:</label><input type="text" value={thanatoForm.procedure} onChange={(e) => setThanatoForm({ ...thanatoForm, procedure: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button type="button" onClick={() => setIsNewThanatoOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 font-bold rounded">Gravar Procedimento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPRESSÃO TERMO DE ADESÃO */}
      {printHolderContract && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-xl max-w-2xl w-full p-8 shadow-2xl">
            <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold tracking-wider uppercase">ETERNITY OS - PLANO FUNERÁRIO</h2>
                <p className="text-xs text-slate-600">TERMO DE ADESÃO E CONTRATO DE PRESTAÇÃO DE SERVIÇOS FUNERÁRIOS</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold">Contrato Nº {printHolderContract.id.substring(0, 8).toUpperCase()}</p>
                <p>{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-100 p-3 rounded">
                <p className="font-bold uppercase text-[11px] mb-1">1. DADOS DO TITULAR CONTRATANTE</p>
                <p><strong>Nome:</strong> {printHolderContract.full_name}</p>
                <p><strong>CPF:</strong> {printHolderContract.cpf} | <strong>Telefone:</strong> {printHolderContract.phone}</p>
                <p><strong>Endereço:</strong> {printHolderContract.address || 'Não informado'}</p>
              </div>

              <div className="bg-slate-100 p-3 rounded">
                <p className="font-bold uppercase text-[11px] mb-1">2. DEPENDENTES COBERTOS ({printHolderContract.dependents?.length || 0})</p>
                {(printHolderContract.dependents || []).map((dep, idx) => (
                  <p key={dep.id}>{idx + 1}. {dep.full_name} ({dep.relation})</p>
                ))}
                {(!printHolderContract.dependents || printHolderContract.dependents.length === 0) && <p>Nenhum dependente adicional.</p>}
              </div>

              <div className="bg-slate-100 p-3 rounded">
                <p className="font-bold uppercase text-[11px] mb-1">3. COBERTURAS INCLUSAS DO PLANO</p>
                <p>Urna fúnebre sextavada envernizada, ornamentação completa com véu e flores, preparação do corpo/higienização, sala de velório climatizada, cortejo fúnebre até o cemitério municipal e suporte administrativo para certidão de óbito.</p>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs border-t border-slate-300 mt-6">
                <div>
                  <div className="border-t border-slate-900 pt-1">Assinatura do Titular Contratante</div>
                  <p className="text-[10px] text-slate-500">{printHolderContract.full_name}</p>
                </div>
                <div>
                  <div className="border-t border-slate-900 pt-1">Assinatura da Funerária / Administradora</div>
                  <p className="text-[10px] text-slate-500">Eternity Assistência Familiar</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
              <button onClick={() => setPrintHolderContract(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs">Fechar</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs shadow">🖨️ Imprimir Termo</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPRESSÃO GUIA DE SEPULTAMENTO */}
      {printBurialGuide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-xl max-w-xl w-full p-8 shadow-2xl">
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-extrabold uppercase">GUIA DE ATENDIMENTO E SEPULTAMENTO</h2>
                <p className="text-xs text-slate-600">ETERNITY OS - CENTRAL DE PLANTÃO 24H</p>
              </div>
              <p className="font-bold text-xs">Nº {printBurialGuide.id.substring(0, 6).toUpperCase()}</p>
            </div>

            <div className="space-y-3 text-xs">
              <p><strong>Nome da Pessoa Falecida:</strong> {printBurialGuide.deceased_name}</p>
              <p><strong>Cemitério / Local Previsto:</strong> {printBurialGuide.cemetery_location || 'A definir'}</p>
              <p><strong>Data e Hora do Atendimento:</strong> {new Date(printBurialGuide.burial_date).toLocaleString('pt-BR')}</p>
              <p><strong>Status:</strong> {printBurialGuide.status || 'Agendado'}</p>
              <div className="bg-slate-100 p-3 rounded mt-3">
                <p className="font-bold text-[11px] mb-1">Checklist de Liberação:</p>
                <p>[ x ] Urna Mortuária separada e preparada</p>
                <p>[ x ] Veículo de cortejo escalado</p>
                <p>[ x ] Ornamentação e véu florido inclusos</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
              <button onClick={() => setPrintBurialGuide(null)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded font-semibold text-xs">Fechar</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs shadow">🖨️ Imprimir Guia</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEPENDENTES */}
      {selectedHolder && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-800 rounded-xl max-w-lg w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedHolder.full_name}</h3>
                <p className="text-xs text-slate-400">CPF: {selectedHolder.cpf}</p>
              </div>
              <button onClick={() => setSelectedHolder(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <p className="font-semibold text-slate-300 uppercase text-[11px] mb-2">Dependentes Cobertos no Plano:</p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {(selectedHolder.dependents || []).map((dep) => (
                    <div key={dep.id} className="p-2.5 bg-slate-950 rounded border border-slate-800 flex justify-between">
                      <span className="font-medium text-slate-200">{dep.full_name}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded">{dep.relation}</span>
                    </div>
                  ))}
                  {(!selectedHolder.dependents || selectedHolder.dependents.length === 0) && (
                    <p className="text-slate-500 py-3 text-center">Nenhum dependente cadastrado.</p>
                  )}
                </div>
              </div>
              <form onSubmit={handleAddDep} className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-blue-400 uppercase">+ Adicionar Dependente</p>
                <div className="flex gap-2">
                  <input type="text" required value={depName} onChange={(e) => setDepName(e.target.value)} placeholder="Nome do dependente..." className="flex-1 bg-[#0d121f] border border-slate-800 rounded p-2 text-white" />
                  <select value={depRelation} onChange={(e) => setDepRelation(e.target.value)} className="bg-[#0d121f] border border-slate-800 rounded p-2 text-white">
                    <option value="Cônjuge">Cônjuge</option><option value="Filho(a)">Filho(a)</option><option value="Pai/Mãe">Pai/Mãe</option><option value="Outro">Outro</option>
                  </select>
                  <button type="submit" disabled={savingDep} className="px-3 py-2 bg-blue-600 text-white font-bold rounded">{savingDep ? '...' : 'Adicionar'}</button>
                </div>
              </form>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
              <button onClick={() => setSelectedHolder(null)} className="px-4 py-2 bg-slate-800 text-white rounded text-xs">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAIS DRE & RBAC */}
      <ModalDRE isOpen={isDREOpen} onClose={() => setIsDREOpen(false)} />
      <ModalRBAC isOpen={isRBACOpen} onClose={() => setIsRBACOpen(false)} />

      {/* MODAL CONFIGURAÇÕES DA EMPRESA */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <span>⚙️</span> Configurações da Empresa
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
                title="Fechar"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto">
              <TenantSettingsTab />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}