interface CharacterLifecycleChange {
  timestamp: number;
  type?: 'removed' | 'readded';
}

interface CharacterLifecycleHistory {
  added?: number;
  changes?: CharacterLifecycleChange[];
}

export function getNewestActiveCharacterKeys(
  history: Record<string, CharacterLifecycleHistory>,
  activeSlugs: Iterable<string>
): Set<string> {
  const active = new Set(activeSlugs);
  const introductions = new Map<string, number>();

  for (const [slug, value] of Object.entries(history)) {
    if (!active.has(slug) || !value.added) continue;

    let isActive = true;
    let introducedAt = value.added;
    const lifecycleChanges = [...(value.changes ?? [])]
      .filter((change) => change.type)
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const change of lifecycleChanges) {
      if (change.type === 'removed') {
        isActive = false;
      } else if (change.type === 'readded') {
        isActive = true;
        introducedAt = change.timestamp;
      }
    }

    if (isActive) introductions.set(slug, introducedAt);
  }

  const newestTimestamp = Math.max(0, ...introductions.values());
  if (newestTimestamp === 0) return new Set();

  return new Set(
    [...introductions]
      .filter(([, timestamp]) => timestamp === newestTimestamp)
      .map(([slug]) => slug)
  );
}
