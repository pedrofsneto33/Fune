import { isHolderActive, isContractActive, isBillingEligible, isWithinGracePeriod } from '@/lib/eligibility';

describe('REGRA UNICA de cobranca (src/lib/eligibility.ts)', () => {
  describe('isHolderActive', () => {
    it('aceita titular ativo (bilingue, qualquer caixa, com espacos)', () => {
      expect(isHolderActive('ativo')).toBe(true);
      expect(isHolderActive('ATIVO')).toBe(true);
      expect(isHolderActive('active')).toBe(true);
      expect(isHolderActive(' Active ')).toBe(true);
    });

    it('rejeita titular inativo (bilingue)', () => {
      expect(isHolderActive('inativo')).toBe(false);
      expect(isHolderActive('INATIVO')).toBe(false);
      expect(isHolderActive('inactive')).toBe(false);
      expect(isHolderActive(' Inactive ')).toBe(false);
    });

    it('trata nulo/vazio como ativo (dados legados sem status)', () => {
      expect(isHolderActive(null)).toBe(true);
      expect(isHolderActive(undefined)).toBe(true);
      expect(isHolderActive('')).toBe(true);
    });
  });

  describe('isContractActive', () => {
    it('aceita somente contrato explicitamente ativo', () => {
      expect(isContractActive('ativo')).toBe(true);
      expect(isContractActive('active')).toBe(true);
      expect(isContractActive('ACTIVE')).toBe(true);
    });

    it('rejeita qualquer outro status (pending, cancelled, vazio, null)', () => {
      expect(isContractActive('pending')).toBe(false);
      expect(isContractActive('cancelled')).toBe(false);
      expect(isContractActive('cancelado')).toBe(false);
      expect(isContractActive('')).toBe(false);
      expect(isContractActive(null)).toBe(false);
      expect(isContractActive(undefined)).toBe(false);
    });
  });

  describe('isBillingEligible (combinacao titular + contrato)', () => {
    const casos: Array<[string | null, string | null, boolean]> = [
      ['ativo', 'ativo', true],
      ['active', 'active', true],
      ['ATIVO', 'ACTIVE', true],
      ['inativo', 'ativo', false],   // regra unica: titular inativo NUNCA e cobrado
      ['inactive', 'active', false],
      ['ativo', 'pending', false],   // contrato inativo tambem bloqueia
      [null, 'active', true],        // legado sem status de titular = ativo
      ['ativo', null, false],        // sem contrato conhecido = nao elegivel
    ];

    it.each(casos)('holder=%p + contract=%p => %p', (h, c, esperado) => {
      expect(isBillingEligible(h, c)).toBe(esperado);
    });
  });
});

describe('isWithinGracePeriod (janela de estorno de comissao)', () => {
  const DIA_MS = 24 * 60 * 60 * 1000;

  it('retorna true quando o contrato esta dentro da janela (89 dias < 90)', () => {
    expect(isWithinGracePeriod(new Date(Date.now() - 89 * DIA_MS))).toBe(true);
  });

  it('retorna false quando o contrato ja passou da janela (91 dias >= 90)', () => {
    expect(isWithinGracePeriod(new Date(Date.now() - 91 * DIA_MS))).toBe(false);
  });

  it('boundary: exatamente 90 dias completos nao esta mais dentro (90 < 90 = false)', () => {
    expect(isWithinGracePeriod(new Date(Date.now() - 90 * DIA_MS))).toBe(false);
  });

  it('aceita graceDays customizado (10 dias)', () => {
    expect(isWithinGracePeriod(new Date(Date.now() - 5 * DIA_MS), 10)).toBe(true);
    expect(isWithinGracePeriod(new Date(Date.now() - 15 * DIA_MS), 10)).toBe(false);
  });

  it('aceita string ISO de data', () => {
    expect(isWithinGracePeriod(new Date(Date.now() - 10 * DIA_MS).toISOString())).toBe(true);
    expect(isWithinGracePeriod(new Date(Date.now() - 120 * DIA_MS).toISOString())).toBe(false);
  });
});
