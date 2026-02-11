import { useContext } from 'react';
import { SectionAccentContext } from '../contexts/section-accent-context';

export function useSectionAccent() {
  return useContext(SectionAccentContext);
}
