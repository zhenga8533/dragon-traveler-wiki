import { readStoredJson, writeStoredJson } from '@/utils/saved-storage';
import { useEffect, useState } from 'react';

function isValidBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function useStoredToggle(storageKey: string, defaultValue: boolean) {
  const [value, setValue] = useState(() =>
    readStoredJson(storageKey, defaultValue, isValidBoolean),
  );
  useEffect(() => {
    writeStoredJson(storageKey, value);
  }, [storageKey, value]);
  return [value, setValue] as const;
}
