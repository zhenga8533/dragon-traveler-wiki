import type { Character } from '@/features/characters/types';
import type { ChangesFile } from '@/types/changes';
import { useLocalePath, useLocaleChangesPath } from '@/hooks/use-locale-path';
import { useDataFetch } from '@/hooks/use-data-fetch';

export function useCharacters() {
  const path = useLocalePath('characters.json');
  return useDataFetch<Character[]>(path, []);
}

export function useCharacterChanges() {
  const path = useLocaleChangesPath('characters.json');
  return useDataFetch<ChangesFile>(path, {});
}
