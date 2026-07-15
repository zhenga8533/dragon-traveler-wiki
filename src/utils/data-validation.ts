function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseObjectArray<T>(raw: unknown): T[] {
  if (!Array.isArray(raw) || !raw.every(isRecord)) {
    throw new Error('Expected an array of objects');
  }
  return raw as T[];
}

export function parseObjectRecord<T>(raw: unknown): Record<string, T> {
  if (!isRecord(raw) || !Object.values(raw).every(isRecord)) {
    throw new Error('Expected an object containing object values');
  }
  return raw as Record<string, T>;
}
