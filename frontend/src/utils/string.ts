/** Trims whitespace and lowercases a string for case-insensitive comparisons. */
export const normalizeName = (value: string): string =>
  value.trim().toLowerCase();
