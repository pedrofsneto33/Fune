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
  QrCode, 
  HeartHandshake, 
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
  const rawCpf = params?.cpf as string;
  const cpfQuery = decodeURIComponent(rawCpf || '').replace(/\D/g, '');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AssociateData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!cpfQuery) return;
      setLoading(false);

      try {
        // 1. Buscar titular por CPF (compatível com ou sem máscara)
        const { data: holders, error: hErr } = await supabase
          .from('holders')
          .select('id, full_name, cpf, phone')
          .limit(10);

        if (hErr || !holders) return;

        const matchedHolder = holders.find(h => h.cpf.replace(/\D/g, '') === cpfQuery);
        if (!matchedHolder) return;

        // 2. Buscar Contrato
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
          phone: matchedHolder.phone,
          planName: (contract as any)?.plans?.name || 'Plano Familiar',
          contractStatus: contract?.status || 'active',
          lastPaymentStatus: lastPay?.status === 'paid' ? 'Pago' : lastPay?.status === 'overdue' ? 'Atrasado' : 'Pendente',
          dueDate: lastPay ? new Date(lastPay.due_date).toLocaleDateString('pt-BR') : '10/09/2026',
          amount: lastPay ? `R$ ${Number(lastPay.amount).toFixed(2).replace('.', ',')}` : 'R$ 89,90',
          dependents: deps || []
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [cpfQuery]);

  const pixKey = '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540589.905802BR5913ETERNITYOS6008TERESINA62070503***6304ABCD';

  const copyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-zinc-400 text-sm">
        Carregando carteirinha digital...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center text-zinc-300">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
        <h1 className="text-lg font-bold text-white">Associado não localizado</h1>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          Verifique o CPF digitado ou entre em contato com a central da funerária.
        </p>
      </div>
    );
  }

  const isEligible = data.lastPaymentStatus === 'Pago';

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-slate-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        
        {/* CABEÇALHO */}
        <div className="text-center pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">SAAD<span className="text-[#00D1FF]"> FUNE</span></h1>
          <p className="text-xs text-zinc-400">Cartão Digital de Associado & Benefícios</p>
        </div>

        {/* CARTÃO VIRTUAL EM DESTAQUE */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-blue-950/40 border border-zinc-700/80 p-6 shadow-2xl">
          {/* Brilho de fundo */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#00D1FF]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00D1FF]">Plano Assistencial</span>
              <h2 className="text-xl font-bold text-white mt-0.5">{data.planName}</h2>
            </div>
            <CreditCard className="w-6 h-6 text-[#00D1FF]" />
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-zinc-400 uppercase font-semibold">Titular</p>
              <p className="text-base font-bold text-white">{data.holderName}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">CPF</p>
                <p className="font-mono text-zinc-200">{data.cpf}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">Status Cobertura</p>
                <span className={`inline-flex items-center gap-1 font-bold ${
                  isEligible ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" /> {isEligible ? 'Ativo / Elegível' : 'Aguardando Pagto'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Validade: 2026/2027</span>
            <span>Rede de Descontos Ativa</span>
          </div>
        </div>

        {/* LISTA DE DEPENDENTES COBERTOS */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#00D1FF]" /> Dependentes no Contrato ({data.dependents.length})
          </h3>
          
          {data.dependents.length === 0 ? (
            <p className="text-xs text-zinc-500 py-2">Nenhum dependente adicional cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {data.dependents.map((d) => (
                <div key={d.id} className="p-2.5 bg-zinc-800/40 border border-zinc-800 rounded-lg flex justify-between items-center text-xs">
                  <span className="font-medium text-white">{d.full_name}</span>
                  <span className="text-zinc-400 text-[11px] bg-zinc-800 px-2 py-0.5 rounded">{d.kinship}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AUTOATENDIMENTO PIX / MENSALIDADE */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-400" /> Autoatendimento Mensalidade
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              isEligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {data.lastPaymentStatus}
            </span>
          </div>

          <div className="text-xs text-zinc-400 space-y-1 mb-4">
            <div className="flex justify-between">
              <span>Valor da Mensalidade:</span>
              <span className="font-bold text-white">{data.amount}</span>
            </div>
            <div className="flex justify-between">
              <span>Vencimento:</span>
              <span className="text-zinc-200">{data.dueDate}</span>
            </div>
          </div>

          <button
            onClick={copyPix}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
            {copied ? 'Código PIX Copiado!' : 'Copiar Chave PIX Mensalidade'}
          </button>
        </div>

      </div>
    </main>
  );
}