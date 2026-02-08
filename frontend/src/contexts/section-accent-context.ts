import { createContext } from 'react';
import type { SectionAccent } from '../constants/accents';

export interface SectionAccentContextValue {
  /** Current section's accent color */
  accent: SectionAccent;
  /** Current path */
  path: string;
}

export const SectionAccentContext = createContext<SectionAccentContextValue>({
  accent: 'violet',
  path: '/',
});
