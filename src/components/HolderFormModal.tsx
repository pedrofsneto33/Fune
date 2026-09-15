'use client';

import React, { useEffect, useState } from 'react';
import { X, UserPlus, Pencil } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';
import {
  validateField,
  type FieldErrors,
  type ValidationRule,
} from '@/lib/formValidation';
import type { Holder } from '@/types';

// Fase 6g-6a — formulário de titular (novo + edição) chamando a API server-side:
//   novo    -> POST  /api/holders
//   edição  -> PATCH /api/holders
// Regras de contrato com o backend:
//   * CPF é a chave de identificação/busca -> DESABILITADO na edição (o PATCH
//     não aceita cpf na allowlist; a edição é pelo id do titular).
//   * Plano vive em contracts.plan_id (contrato ATIVO) e não em holders —
//     o PATCH sincroniza o contrato ativo quando o plano muda.
//   * Os campos de perfil (cidade/UF/nascimento/gênero/observações) têm retry
//     defensivo no backend caso a migration ainda não tenha sido rodada.
export interface HolderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  holder?: Holder | null;
  onSaved?: () => void;
}

interface PlanOption {
  id: string;
  name: string;
  monthly_fee?: number;
}

interface SellerOption {
  id: string;
  name: string;
}

interface HolderFormState {
  full_name: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  birth_date: string;
  gender: string;
  observations: string;
  plan_id: string;
  seller_name: string;
}

const EMPTY_FORM: HolderFormState = {
  full_name: '',
  cpf: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  birth_date: '',
  gender: '',
  observations: '',
  plan_id: '',
  seller_name: '',
};

const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Outro', 'Não informar'];

const UF_OPTIONS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

const INPUT_CLASS =
  'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60';

const FIELD_LABELS: Record<keyof HolderFormState, string> = {
  full_name: 'Nome completo',
  cpf: 'CPF',
  phone: 'Telefone',
  email: 'Email',
  address: 'Endereço',
  city: 'Cidade',
  state: 'UF',
  birth_date: 'Data de nascimento',
  gender: 'Gênero',
  observations: 'Observações',
  plan_id: 'Plano',
  seller_name: 'Vendedor',
};

// Validação declarativa (lib/formValidation, mensagens em PT-BR).
// Nenhuma regra usa 'required' nativo do HTML: o submit valida e mostra erro.
const VALIDATIONS: Record<keyof HolderFormState, ValidationRule> = {
  full_name: { required: true, minLength: 2, maxLength: 255 },
  cpf: { required: true, cpf: true },
  phone: { required: true, phone: true },
  email: { email: true, maxLength: 254 },
  address: { maxLength: 500 },
  city: { maxLength: 100 },
  state: { maxLength: 2 },
  birth_date: { date: true },
  gender: { maxLength: 20 },
  observations: { maxLength: 1000 },
  plan_id: { required: true },
  seller_name: { maxLength: 150 },
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
        {label}
      </label>
      {children}
      {error ? <p className="text-[10px] text-rose-400 mt-1">{error}</p> : null}
    </div>
  );
}

function validateHolderForm(
  values: HolderFormState,
  isEdit: boolean,
): FieldErrors {
  const errors: FieldErrors = {};

  (Object.keys(VALIDATIONS) as Array<keyof HolderFormState>).forEach(
    (field) => {
      // CPF é imutável na edição (backend nem o aceita no PATCH).
      if (field === 'cpf' && isEdit) return;
      // Plano só é obrigatório no cadastro; na edição o sync é opcional.
      if (field === 'plan_id' && isEdit) return;

      const error = validateField(
        values[field],
        VALIDATIONS[field],
        FIELD_LABELS[field],
      );
      if (error) errors[field] = error;
    },
  );

  return errors;
}

function buildPayload(
  values: HolderFormState,
  isEdit: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    full_name: values.full_name.trim(),
    phone: values.phone.replace(/\D/g, ''),
    email: values.email.trim() || null,
    address: values.address.trim() || null,
    city: values.city.trim() || null,
    state: values.state.trim().toUpperCase() || null,
    birth_date: values.birth_date || null,
    gender: values.gender || null,
    observations: values.observations.trim() || null,
  };

  // Vazio = não sincroniza plano (o PATCH ignora plan_id inválido/ausente).
  if (values.plan_id) payload.plan_id = values.plan_id;

  // CPF só vai no cadastro (allowlist do PATCH não inclui cpf).
  if (!isEdit) payload.cpf = values.cpf.replace(/\D/g, '');

  // seller_name também é opcional: na edição o GET /api/holders não devolve o
  // vendedor atual do contrato, então só enviamos quando o usuário digitar algo
  // (evita apagar o vendedor do contrato sem querer).
  const sellerName = values.seller_name.trim();
  if (sellerName) payload.seller_name = sellerName;

  return payload;
}

// Estado inicial do formulário. Edição preenche a partir do titular (o plano
// vem do contrato ATIVO, espelhando o sync do PATCH); cadastro começa vazio.
// Usado como inicializador de useState — o pai remonta o modal a cada abertura
// (`key`), então não é preciso useEffect para resetar/preencher.
function initialForm(holder?: Holder | null): HolderFormState {
  if (!holder) return { ...EMPTY_FORM };

  const contract =
    holder.contracts?.find((c) => c.status === 'active') ??
    holder.contracts?.[0];

  return {
    full_name: holder.full_name ?? '',
    cpf: holder.cpf ?? '',
    phone: holder.phone ?? '',
    email: holder.email ?? '',
    address: holder.address ?? '',
    city: holder.city ?? '',
    state: (holder.state ?? '').toUpperCase().slice(0, 2),
    birth_date: (holder.birth_date ?? '').slice(0, 10),
    gender: holder.gender ?? '',
    observations: holder.observations ?? '',
    plan_id: contract?.plan_id ?? '',
    seller_name: '',
  };
}

export function HolderFormModal({
  isOpen,
  onClose,
  holder,
  onSaved,
}: HolderFormModalProps) {
  const isEdit = Boolean(holder?.id);
  // Lazy init (sem useEffect): o estado nasce preenchido/limpo conforme o modo.
  const [form, setForm] = useState<HolderFormState>(() => initialForm(holder));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [saving, setSaving] = useState(false);

  // Opções dos selects: catálogo de planos + vendedores do tenant.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    (async () => {
      try {
        const [plansRes, sellersRes] = await Promise.all([
          authFetch('/api/plans'),
          authFetch('/api/sellers?active=true'),
        ]);
        if (cancelled) return;

        if (plansRes.ok) {
          const data = await plansRes.json();
          setPlans(Array.isArray(data) ? data : []);
        }
        if (sellersRes.ok) {
          const data = await sellersRes.json();
          setSellers(Array.isArray(data) ? data : data?.sellers || []);
        }
      } catch {
        if (!cancelled) notifyError('Erro ao carregar planos e vendedores.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const setField = (field: keyof HolderFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateHolderForm(form, isEdit);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      notifyError('Corrija os campos destacados antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(form, isEdit);
      const res = await authFetch('/api/holders', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: holder?.id, ...payload } : payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.error || 'Erro ao salvar titular.');

      notifySuccess(
        isEdit
          ? 'Titular atualizado com sucesso.'
          : 'Titular cadastrado com sucesso.',
      );
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      notifyError('Erro: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-slate-900 dark:text-white">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <h3 className="font-bold text-sm flex items-center gap-2 text-blue-400">
            {isEdit ? (
              <Pencil className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {isEdit
              ? `Editar Titular — ${holder?.full_name ?? ''}`
              : 'Novo Titular'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar formulário de titular"
            className="text-slate-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome completo *" error={errors.full_name}>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setField('full_name', e.target.value)}
                placeholder="Ex.: Maria Souza"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="CPF *" error={errors.cpf}>
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => setField('cpf', e.target.value)}
                disabled={isEdit}
                placeholder="Somente números (11 dígitos)"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Telefone *" error={errors.phone}>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="E-mail" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="titular@email.com"
                className={INPUT_CLASS}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Endereço" error={errors.address}>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Rua, número, bairro"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>

            <Field label="Cidade" error={errors.city}>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                placeholder="Ex.: São Paulo"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="UF" error={errors.state}>
              <select
                value={form.state}
                onChange={(e) => setField('state', e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">—</option>
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Data de nascimento" error={errors.birth_date}>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => setField('birth_date', e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Gênero" error={errors.gender}>
              <select
                value={form.gender}
                onChange={(e) => setField('gender', e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">—</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Observações" error={errors.observations}>
                <textarea
                  value={form.observations}
                  onChange={(e) => setField('observations', e.target.value)}
                  rows={3}
                  placeholder="Informações relevantes sobre o titular"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>

            <Field label="Plano funerário *" error={errors.plan_id}>
              <select
                value={form.plan_id}
                onChange={(e) => setField('plan_id', e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Selecione um plano…</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                    {plan.monthly_fee !== undefined
                      ? ` — R$ ${Number(plan.monthly_fee).toFixed(2)}`
                      : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Vendedor (comissão)" error={errors.seller_name}>
              <input
                type="text"
                list="holder-seller-options"
                value={form.seller_name}
                onChange={(e) => setField('seller_name', e.target.value)}
                placeholder="Digite ou escolha um vendedor"
                className={INPUT_CLASS}
              />
              <datalist id="holder-seller-options">
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.name} />
                ))}
              </datalist>
            </Field>
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {isEdit
              ? 'O CPF não pode ser alterado (chave de identificação do titular). Trocar o plano atualiza o contrato ativo.'
              : 'O titular é criado junto com o contrato ativo do plano escolhido.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition"
            >
              {saving
                ? 'Salvando...'
                : isEdit
                  ? 'Salvar alterações'
                  : 'Cadastrar titular'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
