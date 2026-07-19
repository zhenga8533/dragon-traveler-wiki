import { STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useNoblePhantasms } from '@/features/wiki/hooks/use-wiki-data';
import { migrateLegacySlugsInValue } from '@/utils/legacy-slug-migration';
import { useEffect, useMemo } from 'react';

const SESSION_KEY = 'legacy-slugs:migrated';

export default function LegacySlugStorageMigration() {
  const { data: characters } = useCharacters();
  const { data: noblePhantasms } = useNoblePhantasms();
  const aliases = useMemo(
    () =>
      new Map([
        ...characters.flatMap((character) =>
          character.legacy_slug
            ? [[character.legacy_slug, character.slug] as const]
            : []
        ),
        ...noblePhantasms.flatMap((noblePhantasm) =>
          noblePhantasm.legacy_slug
            ? [[noblePhantasm.legacy_slug, noblePhantasm.slug] as const]
            : []
        ),
      ]),
    [characters, noblePhantasms]
  );

  useEffect(() => {
    if (aliases.size === 0) return;
    const signature = JSON.stringify([...aliases].sort());
    if (window.sessionStorage.getItem(SESSION_KEY) === signature) return;

    let changed = false;
    for (const storageKey of Object.values(STORAGE_KEY)) {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) continue;
      let migrated: string;
      try {
        migrated = JSON.stringify(
          migrateLegacySlugsInValue(JSON.parse(raw), aliases)
        );
      } catch {
        migrated = migrateLegacySlugsInValue(raw, aliases) as string;
      }
      if (migrated !== raw) {
        window.localStorage.setItem(storageKey, migrated);
        changed = true;
      }
    }

    window.sessionStorage.setItem(SESSION_KEY, signature);
    if (changed) window.location.reload();
  }, [aliases]);

  return null;
}
