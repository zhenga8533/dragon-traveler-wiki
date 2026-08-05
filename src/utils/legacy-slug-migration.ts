const replaceSlugString = (
  value: string,
  aliases: ReadonlyMap<string, string>,
): string => {
  let next = aliases.get(value) ?? value;
  for (const [legacy, canonical] of aliases) {
    if (next.startsWith(`${legacy}::`)) {
      next = `${canonical}${next.slice(legacy.length)}`;
    }
    next = next
      .replaceAll(`/character/${legacy}/`, `/character/${canonical}/`)
      .replaceAll(`/characters/${legacy}`, `/characters/${canonical}`)
      .replaceAll(
        `/noble_phantasm/${legacy}.png`,
        `/noble_phantasm/${canonical}.png`,
      )
      .replaceAll(
        `/noble-phantasms/${legacy}`,
        `/noble-phantasms/${canonical}`,
      );
  }
  return next;
};

export function migrateLegacySlugsInValue(
  value: unknown,
  aliases: ReadonlyMap<string, string>,
): unknown {
  if (typeof value === 'string') return replaceSlugString(value, aliases);
  if (Array.isArray(value)) {
    return value.map((item) => migrateLegacySlugsInValue(item, aliases));
  }
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      replaceSlugString(key, aliases),
      migrateLegacySlugsInValue(item, aliases),
    ]),
  );
}
