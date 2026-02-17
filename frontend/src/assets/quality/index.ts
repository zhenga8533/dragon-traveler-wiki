import type { Quality } from '../../types/character';

import n from './n.png';
import r from './r.png';
import sr from './sr.png';
import ssr from './ssr.png';
import ssrEx from './ssr_ex.png';
import ssrPlus from './ssr_plus.png';
import ur from './ur.png';

export const QUALITY_ICON_MAP: Record<Quality, string> = {
  UR: ur,
  'SSR EX': ssrEx,
  'SSR+': ssrPlus,
  SSR: ssr,
  SR: sr,
  R: r,
  N: n,
};
