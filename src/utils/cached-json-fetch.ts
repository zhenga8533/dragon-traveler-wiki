const dataCache = new Map<string, unknown>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export function hasCachedJson(path: string): boolean {
  return dataCache.has(path);
}

export function getCachedJson(path: string): unknown {
  return dataCache.get(path);
}

export function clearCachedJson(path: string): void {
  dataCache.delete(path);
}

export async function fetchJsonCached(
  path: string,
  url: string,
): Promise<unknown> {
  if (dataCache.has(path)) {
    return dataCache.get(path);
  }

  const existingRequest = inFlightRequests.get(path);
  if (existingRequest) {
    return existingRequest;
  }

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
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
