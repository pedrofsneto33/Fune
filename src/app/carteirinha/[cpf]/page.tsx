'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  Copy, 
  Check, 
  CreditCard
} from 'lucide-react';

interface AssociateData {
  holderName: string;
  cpf: string;
  phone: string;
  planName: string;
  contractStatus: string;
  lastPaymentStatus: string;
  dueDate: string;
  amount: string;
  dependents: Array<{ id: string; full_name: string; kinship: string }>;
}

export default function CarteirinhaPage() {
  const params = useParams();
  const rawCpf = (params?.cpf as string) || '';
  const cpfQuery = rawCpf.replace(/\D/g, '');

  const [data, setData] = useState<AssociateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!cpfQuery) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Busca direta no Supabase por CPF (com ou sem pontuação)
        const { data: holders, error: hErr } = await supabase
          .from('holders')
          .select('id, full_name, cpf, phone')
          .or(`cpf.eq.${rawCpf},cpf.ilike.%${cpfQuery}%`)
          .limit(1);

        if (hErr || !holders || holders.length === 0) {
          setData(null);
          return;
        }

        const matchedHolder = holders[0];

        // 2. Buscar Contrato e Plano
        const { data: contracts } = await supabase
          .from('contracts')
          .select(`
            id,
            status,
            plans ( name )
          `)
          .eq('holder_id', matchedHolder.id)
          .limit(1);

        const contract = contracts?.[0];

        // 3. Buscar Último Pagamento
        const { data: payments } = await supabase
          .from('payments')
          .select('amount, due_date, status')
          .eq('contract_id', contract?.id)
          .order('due_date', { ascending: false })
          .limit(1);

        const lastPay = payments?.[0];

        // 4. Buscar Dependentes
        const { data: deps } = await supabase
          .from('dependents')
          .select('id, full_name, kinship')
          .eq('holder_id', matchedHolder.id);

        setData({
          holderName: matchedHolder.full_name,
          cpf: matchedHolder.cpf,
          phone: matchedHolder.phone || 'Não informado',
          planName: (contract as any)?.plans?.name || 'Plano Familiar Master',
          contractStatus: contract?.status || 'active',
          lastPaymentStatus: lastPay?.status === 'paid' ? 'Pago' : lastPay?.status === 'overdue' ? 'Atrasado' : 'Pendente',
          dueDate: lastPay?.due_date ? new Date(lastPay.due_date).toLocaleDateString('pt-BR') : '10/09/2026',
          amount: lastPay?.amount ? `R$ ${Number(lastPay.amount).toFixed(2).replace('.', ',')}` : 'R$ 89,90',
          dependents: deps || []
        });
      } catch (err) {
        console.error('Erro ao carregar dados da carteirinha:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [cpfQuery, rawCpf]);

  const pixKey = 'financeiro@saadassistencial.com.br';

  const copyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-zinc-400 text-sm gap-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p>Carregando carteirinha digital...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center text-zinc-300">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Associado não encontrado</h1>
        <p className="text-xs text-zinc-400 max-w-sm mb-6">
          Não identificamos nenhum contrato ativo vinculado ao CPF informado ({rawCpf}).
        </p>
        <a 
          href="https://wa.me/5586999999999" 
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition"
        >
          Falar com o Suporte 24h
        </a>
      </div>
    );
  }

  const isEligible = data.lastPaymentStatus === 'Pago';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        
        {/* Cartão Digital */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 shadow-2xl">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Cabeçalho do Cartão */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Cartão do Associado</span>
              <h2 className="text-lg font-black tracking-tight text-white">SAAD FUNE</h2>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
              isEligible 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {isEligible ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {isEligible ? 'Cobertura Ativa' : 'Regularização Pendente'}
            </div>
          </div>

          {/* Dados do Titular */}
          <div className="mt-4 space-y-3">
            <div>
              <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">Titular</span>
              <p className="text-base font-bold text-white uppercase">{data.holderName}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase text-zinc-500 font-semibold">CPF</span>
                <p className="font-mono text-zinc-300">{data.cpf}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-zinc-500 font-semibold">Plano</span>
                <p className="font-semibold text-zinc-200">{data.planName}</p>
              </div>
            </div>
          </div>

          {/* Lista de Dependentes */}
          {data.dependents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 mb-2">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                Dependentes Cobertos ({data.dependents.length})
              </div>
              <div className="space-y-1">
                {data.dependents.map((dep) => (
                  <div key={dep.id} className="flex justify-between items-center text-xs bg-zinc-950/50 px-2.5 py-1.5 rounded border border-zinc-800/50">
                    <span className="text-zinc-200 font-medium">{dep.full_name}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">{dep.kinship}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card de Fatura & Pagamento */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-200">Mensalidade Atual</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
              isEligible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {data.lastPaymentStatus}
            </span>
          </div>

          <div className="flex justify-between items-baseline border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Vencimento</span>
              <span className="text-xs font-semibold text-zinc-300">{data.dueDate}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase block">Valor</span>
              <span className="text-base font-black text-white">{data.amount}</span>
            </div>
          </div>

          {!isEligible && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] text-zinc-400 block font-medium">Chave PIX para Regularização:</span>
              <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                <input 
                  type="text" 
                  readOnly 
                  value={pixKey} 
                  className="bg-transparent text-xs text-zinc-300 font-mono flex-1 outline-none"
                />
                <button
                  onClick={copyPix}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="text-center space-y-2">
          <p className="text-[11px] text-zinc-500">Central de Plantão Funerário 24 Horas</p>
          <p className="text-sm font-bold text-red-500 font-mono">(86) 99999-9999</p>
        </div>

      </div>
    </div>
  );
}
