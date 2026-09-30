import {
  isValidCarteirinhaToken,
  canonicalCarteirinhaPath,
  cpfPathSegment,
  maskCpf,
} from '@/lib/carteirinhaToken';

// P0-2: o token opaco e a UNICA credencial da carteirinha publica.
// Estes casos travam o contrato: CPF nunca e aceito como token.
describe('carteirinhaToken', () => {
  const validToken = '3f1a9c2e-7b64-4d2a-9f31-0c5e8d47a1b6';

  it('aceita uuid v4 valido (inclusive com espacos e caixa alta)', () => {
    expect(isValidCarteirinhaToken(validToken)).toBe(true);
    expect(isValidCarteirinhaToken(validToken.toUpperCase())).toBe(true);
    expect(isValidCarteirinhaToken(`  ${validToken}  `)).toBe(true);
  });

  it('rejeita CPF, vazio, injecao e uuid truncado', () => {
    expect(isValidCarteirinhaToken('')).toBe(false);
    expect(isValidCarteirinhaToken('12345678901')).toBe(false);
    expect(isValidCarteirinhaToken('123.456.789-01')).toBe(false);
    expect(isValidCarteirinhaToken("' OR 1=1 --")).toBe(false);
    expect(isValidCarteirinhaToken('3f1a9c2e-7b64-4d2a-9f31-0c5e8d47a1b')).toBe(
      false,
    );
    expect(isValidCarteirinhaToken(null)).toBe(false);
    expect(isValidCarteirinhaToken(undefined)).toBe(false);
  });

  it('monta o path canonico com o CPF do titular + token', () => {
    expect(canonicalCarteirinhaPath('529.982.247-25', validToken)).toBe(
      `/carteirinha/52998224725?t=${validToken}`,
    );
  });

  it('usa "0" quando o CPF do path nao e valido (bootstrap so pelo token)', () => {
    expect(cpfPathSegment('')).toBe('0');
    expect(cpfPathSegment('abc')).toBe('0');
    expect(cpfPathSegment(null)).toBe('0');
    expect(canonicalCarteirinhaPath('', validToken)).toBe(
      `/carteirinha/0?t=${validToken}`,
    );
  });

  it('mascara o CPF para exibicao', () => {
    expect(maskCpf('52998224725')).toBe('***.982.247-**');
    expect(maskCpf('529.982.247-25')).toBe('***.982.247-**');
    expect(maskCpf('123')).toBe('-');
    expect(maskCpf(null)).toBe('-');
  });
});
