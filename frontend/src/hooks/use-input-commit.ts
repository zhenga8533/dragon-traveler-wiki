import { INPUT_COMMIT_DELAY_MS } from '@/constants/ui';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

/**
 * Manages a debounced text input that commits its value to an external state
 * after a delay. Syncs local input state when the external value changes.
 */
export function useInputCommit(
  externalValue: string,
  onCommit: (value: string) => void
): [string, Dispatch<SetStateAction<string>>] {
  const [inputValue, setInputValue] = useState(externalValue);

  useEffect(() => {
    setInputValue(externalValue);
  }, [externalValue]);

  useEffect(() => {
    if (inputValue === externalValue) return;
    const timer = setTimeout(() => {
      onCommit(inputValue);
    }, INPUT_COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [inputValue, externalValue, onCommit]);

  return [inputValue, setInputValue];
}
