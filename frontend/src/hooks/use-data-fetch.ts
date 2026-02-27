import { useEffect, useState } from 'react';

export interface DataFetchResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

const dataCache = new Map<string, unknown>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function getDataUrl(path: string): string {
  return import.meta.env.BASE_URL + path;
}

async function fetchJsonCached(path: string): Promise<unknown> {
  if (dataCache.has(path)) {
    return dataCache.get(path);
  }

  const existingRequest = inFlightRequests.get(path);
  if (existingRequest) {
    return existingRequest;
  }

  const request = fetch(getDataUrl(path))
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then((json) => {
      dataCache.set(path, json);
      return json;
    })
    .finally(() => {
      inFlightRequests.delete(path);
    });

  inFlightRequests.set(path, request);
  return request;
}

export function useDataFetch<T>(path: string, initial: T): DataFetchResult<T> {
  const hasCachedValue = dataCache.has(path);
  const [data, setData] = useState<T>(() =>
    hasCachedValue ? (dataCache.get(path) as T) : initial
  );
  const [loading, setLoading] = useState(() => !hasCachedValue);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const hasCached = dataCache.has(path);
    queueMicrotask(() => {
      if (isCancelled) return;
      setLoading(!hasCached);
      setError(null);
    });

    fetchJsonCached(path)
      .then((result) => {
        if (isCancelled) return;
        setData(result as T);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error(`Failed to fetch ${path}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (isCancelled) return;
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [path]);

  return { data, loading, error };
}
