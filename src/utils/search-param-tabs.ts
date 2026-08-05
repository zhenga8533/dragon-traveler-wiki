import { toEntitySlug } from './entity-slug.ts';

export function resolveTabParam(
  rawValue: string | null,
  defaultTab: string,
  validTabs: readonly string[],
): string {
  return rawValue && validTabs.includes(rawValue) ? rawValue : defaultTab;
}

export function setDefaultOmittingSearchParam(
  current: URLSearchParams,
  paramName: string,
  value: string | null,
  defaultValue: string,
): URLSearchParams {
  const next = new URLSearchParams(current);
  const resolvedValue = value ?? defaultValue;
  if (resolvedValue === defaultValue) {
    next.delete(paramName);
  } else {
    next.set(paramName, resolvedValue);
  }
  return next;
}

export function resolveEntityTabName(
  slug: string | null,
  items: readonly { name: string }[],
): string | undefined {
  if (items.length === 0) return undefined;
  const match = slug
    ? items.find((item) => toEntitySlug(item.name) === slug)?.name
    : undefined;
  return match ?? items[0].name;
}

export function setEntitySearchParam(
  current: URLSearchParams,
  paramName: string,
  name: string | null,
): URLSearchParams {
  const next = new URLSearchParams(current);
  if (name) {
    next.set(paramName, toEntitySlug(name));
  } else {
    next.delete(paramName);
  }
  return next;
}
