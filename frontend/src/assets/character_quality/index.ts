import type { Quality } from '../../types/character';

import n from './n.png';
import r from './r.png';
import srPlus from './sr_plus.png';
import ssr from './ssr.png';
import ssrEx from './ssr_ex.png';
import ssrPlus from './ssr_plus.png';

export const QUALITY_ICON_MAP: Record<Quality, string> = {
  'SSR EX': ssrEx,
  'SSR+': ssrPlus,
  SSR: ssr,
  'SR+': srPlus,
  R: r,
  N: n,
};
