import { useEffect, useState } from 'react';

export interface DataFetchResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

export function useDataFetch<T>(path: string, initial: T): DataFetchResult<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    fetch(import.meta.env.BASE_URL + path, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(`Failed to fetch ${path}:`, err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [path]);

  return { data, loading, error };
}
