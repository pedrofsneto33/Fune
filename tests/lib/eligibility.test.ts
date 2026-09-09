import { isHolderActive, isContractActive, isBillingEligible } from '@/lib/eligibility';

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
