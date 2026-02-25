import type { Code } from '../types/code';

type MaybeCodeStatus = Pick<Code, 'active'> | null | undefined;

export function isCodeActive(code: MaybeCodeStatus): boolean {
  return code?.active !== false;
}

export function isCodeExpired(code: MaybeCodeStatus): boolean {
  return !isCodeActive(code);
}

export function getActiveCodeCount(codes: Code[]): number {
  return codes.filter(isCodeActive).length;
}
