// QUALITY_ORDER is the canonical, ordered list of all quality tiers.
// `Quality` is derived from it so that adding a new tier here automatically
// causes TypeScript to flag every Record<Quality, …> that is now incomplete.
export const QUALITY_ORDER = [
  'UR',
  'SSR EX',
  'SSR+',
  'SSR',
  'SR',
  'R',
  'N',
  'C',
] as const;

export type Quality = (typeof QUALITY_ORDER)[number];

export const QUALITY_COLOR: Record<Quality, string> = {
  UR: 'pink',
  'SSR EX': 'red',
  'SSR+': 'orange',
  SSR: 'yellow',
  SR: 'violet',
  R: 'blue',
  N: 'lime',
  C: 'gray',
};

export const QUALITY_BORDER_COLOR: Record<Quality, string> = {
  UR: 'var(--mantine-color-pink-6)',
  'SSR EX': 'var(--mantine-color-red-6)',
  'SSR+': 'var(--mantine-color-orange-5)',
  SSR: 'var(--mantine-color-yellow-5)',
  SR: 'var(--mantine-color-violet-5)',
  R: 'var(--mantine-color-blue-5)',
  N: 'var(--mantine-color-lime-5)',
  C: 'var(--mantine-color-gray-5)',
};
