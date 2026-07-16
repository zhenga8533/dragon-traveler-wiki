import { useCallback, useEffect, useRef, useState } from 'react';

export interface DataFetchResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  retry: () => void;
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

/**
 * Fetches a JSON file and optionally validates/transforms the raw data.
 *
 * @param path    - Path relative to the site base URL (e.g. `'data/characters.json'`)
 * @param initial - Value returned while loading or on error
 * @param parse   - Optional transform/validator called on the raw JSON before it is
 *                  stored in state.  Throwing here sets the `error` field instead of
 *                  silently coercing bad data.  Plug in a Zod schema's `.parse` method,
 *                  a valibot `parse` call, or a simple type-guard function.
 *
 * @example
 *   // Zod (install zod separately):
 *   const CharacterSchema = z.object({ name: z.string(), quality: QualitySchema });
 *   useDataFetch('data/characters.json', [], (raw) => z.array(CharacterSchema).parse(raw));
 */
export function useDataFetch<T>(
  path: string,
  initial: T,
  parse?: (raw: unknown) => T
): DataFetchResult<T> {
  const parseRef = useRef(parse);
  const initialRef = useRef(initial);

  const hasCachedValue = dataCache.has(path);
  const [data, setData] = useState<T>(() => {
    if (!hasCachedValue) return initial;
    const raw = dataCache.get(path);
    if (parse) {
      try {
        return parse(raw);
      } catch {
        return initial;
      }
    }
    return raw as T;
  });
  const [loading, setLoading] = useState(() => !hasCachedValue);
  const [error, setError] = useState<Error | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    parseRef.current = parse;
  }, [parse]);

  useEffect(() => {
    initialRef.current = initial;
  }, [initial]);

  useEffect(() => {
    let isCancelled = false;

    const hasCached = dataCache.has(path);
    queueMicrotask(() => {
      if (isCancelled) return;
      if (!hasCached) setData(initialRef.current);
      setLoading(!hasCached);
      setError(null);
    });

    fetchJsonCached(path)
      .then((result) => {
        if (isCancelled) return;
        const currentParse = parseRef.current;
        setData(currentParse ? currentParse(result) : (result as T));
      })
      .catch((err) => {
        if (isCancelled) return;
        dataCache.delete(path);
        setData(initialRef.current);
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
  }, [path, requestVersion]);

  const retry = useCallback(() => {
    dataCache.delete(path);
    setRequestVersion((version) => version + 1);
  }, [path]);

  return { data, loading, error, retry };
}
