export type RetryableDataSource = readonly [
  error: Error | null | undefined,
  retry: () => void,
];

export function retryFailedDataSources(
  ...sources: RetryableDataSource[]
): void {
  for (const [error, retry] of sources) {
    if (error) retry();
  }
}
