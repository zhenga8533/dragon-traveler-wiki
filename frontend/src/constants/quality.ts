import type { Quality } from '../types';

export const QUALITY_ORDER: Quality[] = [
  'UR',
  'SSR EX',
  'SSR+',
  'SSR',
  'SR',
  'R',
  'N',
  'C',
];

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
