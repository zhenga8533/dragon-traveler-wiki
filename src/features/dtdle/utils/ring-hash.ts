/** Deterministic 32-bit FNV-1a hash. Synchronous so ring lookups never need to await. */
export function fnv1aHash32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export interface RingEntry {
  slug: string;
  hash: number;
}

export function buildRing(slugs: string[]): RingEntry[] {
  return slugs
    .map((slug) => ({ slug, hash: fnv1aHash32(slug) }))
    .sort((a, b) => a.hash - b.hash);
}

/**
 * Consistent-hashing pick: finds the ring entry nearest clockwise from
 * `dateHash`, skipping any slug in `excludedSlugs`. Adding/removing slugs
 * from the ring only disturbs neighboring dates, not the whole mapping.
 */
export function pickFromRing(
  ring: RingEntry[],
  dateHash: number,
  excludedSlugs: ReadonlySet<string>
): string {
  let startIdx = ring.findIndex((entry) => entry.hash >= dateHash);
  if (startIdx === -1) startIdx = 0;

  for (let i = 0; i < ring.length; i++) {
    const candidate = ring[(startIdx + i) % ring.length];
    if (!excludedSlugs.has(candidate.slug)) return candidate.slug;
  }
  return ring[startIdx].slug;
}
