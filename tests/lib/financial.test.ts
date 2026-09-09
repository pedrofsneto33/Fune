// Mock ANTES do import: supabaseAdmin.ts lança erro em import sem env vars
jest.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { recordIncome } from '@/lib/financial';

const mockFrom = supabaseAdmin.from as jest.Mock;

describe('recordIncome (fonte unica de receita no Livro Caixa)', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('insere receita com type=income e prefixo de origem na descricao', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    const result = await recordIncome({
      tenantId: 'tenant-1',
      amount: 150,
      category: 'Carne',
      description: 'Carne Fulano - parcela 1/3',
      source: 'payment_carnets',
    });

    expect(result.ok).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('financial_transactions');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-1',
        type: 'income',
        category: 'Carne',
        amount: 150,
        description: '[payment_carnets] Carne Fulano - parcela 1/3',
      }),
    );
  });

  it('vincula payment_id quando fornecido (webhook)', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    await recordIncome({
      tenantId: 't',
      amount: 99.9,
      category: 'plan_subscription',
      description: 'Recebimento',
      paymentId: 'pay-uuid',
      source: 'asaas_webhook',
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ payment_id: 'pay-uuid' }),
    );
  });

  it('rejeita valor zero/negativo SEM tocar no banco', async () => {
    const result = await recordIncome({
      tenantId: 't',
      amount: 0,
      category: 'X',
      description: 'x',
      source: 'manual',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('valor invalido');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejeita tenant ausente SEM tocar no banco', async () => {
    const result = await recordIncome({
      tenantId: '',
      amount: 10,
      category: 'X',
      description: 'x',
      source: 'manual',
    });

    expect(result.ok).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('trunca categoria a 50 chars (VARCHAR(50) do banco)', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    await recordIncome({
      tenantId: 't',
      amount: 10,
      category: 'c'.repeat(80),
      description: 'd',
      source: 'manual',
    });

    const arg = insert.mock.calls[0][0];
    expect(arg.category).toHaveLength(50);
  });

  it('nunca lanca: erro do banco vira { ok: false, error }', async () => {
    const insert = jest.fn().mockResolvedValue({ error: { message: 'boom' } });
    mockFrom.mockReturnValue({ insert });

    const result = await recordIncome({
      tenantId: 't',
      amount: 10,
      category: 'X',
      description: 'x',
      source: 'manual',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('boom');
  });
});
