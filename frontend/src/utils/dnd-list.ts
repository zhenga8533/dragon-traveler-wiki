export function removeItem<T>(items: T[], item: T): T[] {
  return items.filter((entry) => entry !== item);
}

export function insertUniqueBefore<T>(items: T[], item: T, beforeItem: T): T[] {
  if (items.includes(item)) return items;
  const targetIndex = items.indexOf(beforeItem);
  if (targetIndex === -1) return [...items, item];

  const next = [...items];
  next.splice(targetIndex, 0, item);
  return next;
}

export function moveItemBefore<T>(items: T[], item: T, beforeItem: T): T[] {
  if (item === beforeItem) return [...items];

  const fromIndex = items.indexOf(item);
  const targetIndex = items.indexOf(beforeItem);
  if (fromIndex === -1 || targetIndex === -1) return [...items];

  const next = [...items];
  next.splice(fromIndex, 1);
  const insertAt = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
  next.splice(insertAt, 0, item);
  return next;
}

export function cloneRecordArrays<T>(
  source: Record<string, T[]>
): Record<string, T[]> {
  const cloned: Record<string, T[]> = {};
  for (const [key, values] of Object.entries(source)) {
    cloned[key] = [...values];
  }
  return cloned;
}

export function removeItemFromRecordArrays<T>(
  target: Record<string, T[]>,
  item: T
): void {
  for (const key of Object.keys(target)) {
    target[key] = removeItem(target[key], item);
  }
}
