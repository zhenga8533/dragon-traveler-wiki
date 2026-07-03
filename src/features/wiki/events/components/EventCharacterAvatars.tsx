import { IMAGE_SIZE } from '@/constants/ui';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import {
  buildCharacterByIdentityMap,
  getCharacterRoutePath,
} from '@/features/characters/utils/character-route';
import { useCharacters } from '@/hooks';
import { Group } from '@mantine/core';
import { useMemo } from 'react';

interface EventCharacterAvatarsProps {
  /** Character slugs (e.g. "tamamo_ssr_plus"). */
  characters: string[];
  size?: number;
}

export default function EventCharacterAvatars({
  characters,
  size = IMAGE_SIZE.PORTRAIT_SM,
}: EventCharacterAvatarsProps) {
  const { data: characterData } = useCharacters();
  const byIdentity = useMemo(
    () => buildCharacterByIdentityMap(characterData),
    [characterData]
  );

  if (characters.length === 0) return null;

  return (
    <Group gap="xs" wrap="wrap">
      {characters.map((slug) => {
        const resolved = byIdentity.get(slug);
        return (
          <CharacterPortrait
            key={slug}
            name={resolved?.name ?? slug}
            size={size}
            quality={resolved?.quality}
            assetKey={slug}
            routePath={resolved ? getCharacterRoutePath(resolved) : `/characters/${slug}`}
            link
            tooltip={resolved?.name ?? slug}
            loading="lazy"
          />
        );
      })}
    </Group>
  );
}
