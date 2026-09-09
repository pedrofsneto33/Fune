import { nextLeadStage, isValidLeadStage, isValidLeadSource, isValidPhoneDigits, waLink } from '@/lib/crm';

describe('CRM — fonte única do funil (src/lib/crm.ts)', () => {
  it('fluxo de avanço: novo → contato → demo → proposta → ganho', () => {
    expect(nextLeadStage('novo')).toBe('contato');
    expect(nextLeadStage('contato')).toBe('demo');
    expect(nextLeadStage('demo')).toBe('proposta');
    expect(nextLeadStage('proposta')).toBe('ganho');
  });

  it('terminais não avançam', () => {
    expect(nextLeadStage('ganho')).toBeNull();
    expect(nextLeadStage('perdido')).toBeNull();
  });

  it('validadores de estágio/origem rejeitam valores estranhos', () => {
    expect(isValidLeadStage('novo')).toBe(true);
    expect(isValidLeadStage('hackeado')).toBe(false);
    expect(isValidLeadStage(42)).toBe(false);
    expect(isValidLeadSource('landing')).toBe(true);
    expect(isValidLeadSource('outro')).toBe(false);
  });

  it('telefone BR: 10-13 dígitos após limpeza', () => {
    expect(isValidPhoneDigits('(86) 98811-7925')).toBe(true);
    expect(isValidPhoneDigits('5586988117925')).toBe(true);
    expect(isValidPhoneDigits('123')).toBe(false);
    expect(isValidPhoneDigits('')).toBe(false);
  });

  it('waLink adiciona DDI 55 quando falta', () => {
    expect(waLink('86988117925', 'oi')).toContain('wa.me/5586988117925');
    expect(waLink('5586988117925', 'oi')).toContain('wa.me/5586988117925');
    expect(waLink('86988117925', 'oi')).toContain(encodeURIComponent('oi'));
  });
});
