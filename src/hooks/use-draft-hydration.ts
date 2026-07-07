import { useEffect, useState } from 'react';

interface UseDraftHydrationOptions<T> {
  initialData: T | null | undefined;
  storageKey: string;
  getPastedPatch: (value: unknown) => unknown;
  normalizeFromPartial: (partial: unknown, fallback: T) => T;
  createFallback: () => T;
  load: (data: T) => void;
}

/** Loads `initialData`, else a saved localStorage draft, else starts empty; clears the draft if unparseable. */
export function useDraftHydration<T>({
  initialData,
  storageKey,
  getPastedPatch,
  normalizeFromPartial,
  createFallback,
  load,
}: UseDraftHydrationOptions<T>): boolean {
  const [draftHydrated, setDraftHydrated] = useState(false);

  useEffect(() => {
    if (initialData) {
      queueMicrotask(() => {
        load(initialData);
        setDraftHydrated(true);
      });
      return;
    }

    if (typeof window === 'undefined') {
      queueMicrotask(() => setDraftHydrated(true));
      return;
    }

    const storedDraft = window.localStorage.getItem(storageKey);
    if (storedDraft) {
      try {
        const parsedDraft = JSON.parse(storedDraft) as unknown;
        const partial = getPastedPatch(parsedDraft);
        if (partial) {
          const hydrated = normalizeFromPartial(partial, createFallback());
          queueMicrotask(() => load(hydrated));
        } else {
          window.localStorage.removeItem(storageKey);
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    queueMicrotask(() => setDraftHydrated(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, load, storageKey]);

  return draftHydrated;
}
