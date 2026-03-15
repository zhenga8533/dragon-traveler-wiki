import type { Character } from '@/features/characters/types';
import type { ChangesFile } from '@/types/changes';
import { useDataFetch } from '@/hooks/use-data-fetch';

export function useCharacters() {
  return useDataFetch<Character[]>('data/characters.json', []);
}

export function useCharacterChanges() {
  return useDataFetch<ChangesFile>('data/changes/characters.json', {});
}
