import { IMAGE_SIZE } from '@/constants/ui';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import {
  buildCharacterNameCounts,
  buildPreferredCharacterByNameMap,
  getCharacterRouteSlug,
} from '@/features/characters/utils/character-route';
import { useCharacters } from '@/hooks';
import { Group } from '@mantine/core';
import { useMemo } from 'react';

interface EventCharacterAvatarsProps {
  characters: string[];
  size?: number;
}

export default function EventCharacterAvatars({
  characters,
  size = IMAGE_SIZE.PORTRAIT_SM,
}: EventCharacterAvatarsProps) {
  const { data: characterData } = useCharacters();
  const preferredByName = useMemo(
    () => buildPreferredCharacterByNameMap(characterData),
    [characterData]
  );
  const nameCounts = useMemo(
    () => buildCharacterNameCounts(characterData),
    [characterData]
  );

  if (characters.length === 0) return null;

  return (
    <Group gap="xs" wrap="wrap">
      {characters.map((char) => {
        const resolved = preferredByName.get(char);
        const assetKey = resolved ? getCharacterRouteSlug(resolved, nameCounts) : undefined;
        return (
          <CharacterPortrait
            key={char}
            name={char}
            size={size}
            quality={resolved?.quality}
            assetKey={assetKey}
            link
            tooltip={char}
            loading="lazy"
          />
        );
      })}
    </Group>
  );
}
