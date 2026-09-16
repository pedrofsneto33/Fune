"use client";

// 13c-1: form do responsável avulso (venda de balcão) — extraído de /ordens/nova
// para reuso no wizard /vendas/nova. Componente controlado, sem estado.
export interface ResponsavelValues {
  name: string;
  cpf: string;
  phone: string;
  email: string;
}

export type ResponsavelField = keyof ResponsavelValues;

export default function ResponsavelForm({
  values,
  onChange,
  disabled,
}: {
  values: ResponsavelValues;
  onChange: (field: ResponsavelField, value: string) => void;
  disabled?: boolean;
}) {
  const inputCls =
    "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-sm text-slate-900 dark:text-white";
  const labelCls = "block text-slate-600 dark:text-slate-500 font-semibold mb-1 text-sm";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>Nome</label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Nome completo do responsável"
        />
      </div>
      <div>
        <label className={labelCls}>CPF</label>
        <input
          type="text"
          value={values.cpf}
          onChange={(e) => onChange("cpf", e.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="000.000.000-00"
        />
      </div>
      <div>
        <label className={labelCls}>Telefone</label>
        <input
          type="text"
          value={values.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="(86) 99999-0000"
        />
      </div>
      <div>
        <label className={labelCls}>E-mail</label>
        <input
          type="email"
          value={values.email}
          onChange={(e) => onChange("email", e.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="opcional"
        />
      </div>
    </div>
  );
}