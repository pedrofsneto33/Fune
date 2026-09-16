"use client";

// 13c-1: form de itens da OS — extraído de /ordens/nova (l.385-468) para
// reuso no wizard /vendas/nova. Componente controlado, sem estado próprio.
export interface FormInventoryItem {
  id: string;
  item_name: string;
  stock_quantity: number;
}

export interface OrdemItem {
  inventory_id: string;
  quantity: number;
  unit_price: number;
}

export type OrdemItemField = "inventory_id" | "quantity" | "unit_price";

export const itemsSubtotal = (it: OrdemItem) =>
  (it.quantity || 0) * (it.unit_price || 0);

export const itemsTotal = (items: OrdemItem[]) =>
  items.reduce((sum, it) => sum + itemsSubtotal(it), 0);

export default function ItemsForm({
  items,
  inventoryList,
  onAdd,
  onRemove,
  onChange,
  disabled,
}: {
  items: OrdemItem[];
  inventoryList: FormInventoryItem[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, field: OrdemItemField, val: string | number) => void;
  disabled?: boolean;
}) {
  return (
    <section className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3 flex items-center justify-between">
        Itens (opcional)
        <button
          onClick={onAdd}
          disabled={disabled}
          className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-xs font-semibold hover:bg-emerald-900/60 transition disabled:opacity-50"
        >
          + Adicionar item
        </button>
      </h2>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">Nenhum item adicionado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-600 dark:text-slate-500 uppercase">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2 w-20">Qtde</th>
                <th className="py-2 w-32">Preço unit.</th>
                <th className="py-2 w-28">Subtotal</th>
                <th className="py-2 w-16 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-2">
                    <select
                      value={it.inventory_id}
                      onChange={(e) => onChange(idx, "inventory_id", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-sm text-slate-200"
                    >
                      <option value="">Selecione...</option>
                      {inventoryList.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.item_name} (estoque: {inv.stock_quantity})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => onChange(idx, "quantity", Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-right text-slate-200"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={it.unit_price}
                      onChange={(e) => onChange(idx, "unit_price", Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-right text-slate-200"
                    />
                  </td>
                  <td className="py-2 text-emerald-300 font-semibold">
                    {itemsSubtotal(it).toFixed(2)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => onRemove(idx)}
                      className="px-2 py-1 bg-rose-950 text-rose-300 border border-rose-800 rounded text-xs hover:bg-rose-900/60 transition"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {items.length > 0 && (
        <div className="mt-3 text-right">
          <span className="text-xs text-slate-500">Total:</span>
          <span className="font-bold text-emerald-400 ml-2">
            {itemsTotal(items).toFixed(2)}
          </span>
        </div>
      )}
    </section>
  );
}