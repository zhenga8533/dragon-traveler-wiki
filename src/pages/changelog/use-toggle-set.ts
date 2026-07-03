import { useCallback, useState } from 'react';

export function useToggleSet<T>() {
  const [set, setSet] = useState<Set<T>>(new Set());
  const toggle = useCallback((id: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clear = useCallback(() => setSet(new Set()), []);
  return { set, toggle, clear };
}
