import {
  computeStatus,
  needsBanner,
  needsBlock,
  needsReadOnly,
  type SaasGateStatus,
} from '@/lib/saas-gate';

const DAY = 86400000;
const NOW = new Date('2026-09-18T12:00:00Z').getTime();
const daysFromNow = (n: number) => new Date(NOW + n * DAY).toISOString();

describe('saas-gate computeStatus', () => {
  test('null => active', () => {
    expect(computeStatus(null, NOW)).toBe('active');
  });
  test('undefined => active', () => {
    expect(computeStatus(undefined, NOW)).toBe('active');
  });
  test('canceled com vencimento futuro => blocked', () => {
    expect(
      computeStatus({ status: 'canceled', next_due_date: daysFromNow(10), trial_ends_at: null }, NOW),
    ).toBe('blocked');
  });
  test('vencimento em +10d => active', () => {
    expect(
      computeStatus({ status: 'active', next_due_date: daysFromNow(10), trial_ends_at: null }, NOW),
    ).toBe('active');
  });
  test('vencido ha 3d => past_due', () => {
    expect(
      computeStatus({ status: 'active', next_due_date: daysFromNow(-3), trial_ends_at: null }, NOW),
    ).toBe('past_due');
  });
  test('vencido ha 10d => suspended', () => {
    expect(
      computeStatus({ status: 'active', next_due_date: daysFromNow(-10), trial_ends_at: null }, NOW),
    ).toBe('suspended');
  });
  test('vencido ha 20d => blocked', () => {
    expect(
      computeStatus({ status: 'active', next_due_date: daysFromNow(-20), trial_ends_at: null }, NOW),
    ).toBe('blocked');
  });
  test('trial futuro +5d => active', () => {
    expect(
      computeStatus({ status: 'trial', next_due_date: null, trial_ends_at: daysFromNow(5) }, NOW),
    ).toBe('active');
  });
  test('trial vencido ha 3d => past_due', () => {
    expect(
      computeStatus({ status: 'trial', next_due_date: null, trial_ends_at: daysFromNow(-3) }, NOW),
    ).toBe('past_due');
  });
  test('active sem next_due_date => active', () => {
    expect(
      computeStatus({ status: 'active', next_due_date: null, trial_ends_at: null }, NOW),
    ).toBe('active');
  });
  test('data invalida => active', () => {
    expect(
      computeStatus({ status: 'active', next_due_date: 'xxx', trial_ends_at: null }, NOW),
    ).toBe('active');
  });
});

describe('saas-gate helpers', () => {
  const bannerCases: Array<[SaasGateStatus, boolean]> = [
    ['active', false],
    ['past_due', true],
    ['suspended', false],
    ['blocked', false],
  ];
  test.each(bannerCases)('needsBanner(%s) === %s', (s, expected) => {
    expect(needsBanner(s)).toBe(expected);
  });
  const readOnlyCases: Array<[SaasGateStatus, boolean]> = [
    ['active', false],
    ['past_due', false],
    ['suspended', true],
    ['blocked', true],
  ];
  test.each(readOnlyCases)('needsReadOnly(%s) === %s', (s, expected) => {
    expect(needsReadOnly(s)).toBe(expected);
  });
  const blockCases: Array<[SaasGateStatus, boolean]> = [
    ['active', false],
    ['past_due', false],
    ['suspended', false],
    ['blocked', true],
  ];
  test.each(blockCases)('needsBlock(%s) === %s', (s, expected) => {
    expect(needsBlock(s)).toBe(expected);
  });
});
