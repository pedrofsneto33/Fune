import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface Props {
  params: Promise<{ cpf: string }>;
}

export default async function CarteirinhaPage({ params }: Props) {
  const resolvedParams = await params;
  const rawCpf = decodeURIComponent(resolvedParams.cpf || '').replace(/\D/g, '');

  if (!rawCpf || rawCpf.length !== 11) {
    notFound();
  }

  const formattedCpf = rawCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  const { data: holder, error } = await supabaseAdmin
    .from('holders')
    .select(`
      id,
      full_name,
      cpf,
      contracts (
        status,
        plans ( name )
      ),
      dependents (
        full_name,
        relation
      )
    `)
    .or(`cpf.eq.${rawCpf},cpf.eq.${formattedCpf}`)
    .limit(1)
    .maybeSingle();

  if (error || !holder) {
    notFound();
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold">{holder.full_name}</h2>
        <p className="text-sm text-slate-400">CPF: ***.{rawCpf.substring(3, 6)}.***-**</p>
        <div className="mt-4">
          <span className="text-xs uppercase px-2 py-1 bg-emerald-600 rounded">
            {holder.contracts?.[0]?.status === 'active' ? 'Ativo' : 'Pendente'}
          </span>
        </div>
      </div>
    </div>
  );
}
