import { IMAGE_SIZE } from '@/constants/ui';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import type { Character } from '@/features/characters/types';
import {
  buildCharacterByIdentityMap,
  getCharacterRoutePath,
} from '@/features/characters/utils/character-route';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { Group } from '@mantine/core';
import { useMemo } from 'react';

interface EventCharacterAvatarsProps {
  /** Character slugs (e.g. "tamamo_ssr_plus"). */
  characters: string[];
  size?: number;
}

interface EventCharacterAvatarListProps extends EventCharacterAvatarsProps {
  characterByIdentity: Map<string, Character>;
}

export function EventCharacterAvatarList({
  characters,
  characterByIdentity,
  size = IMAGE_SIZE.PORTRAIT_SM,
}: EventCharacterAvatarListProps) {
  if (characters.length === 0) return null;

  return (
    <Group gap="xs" wrap="wrap">
      {characters.map((slug) => {
        const resolved = characterByIdentity.get(slug);
        return (
          <CharacterPortrait
            key={slug}
            name={resolved?.name ?? slug}
            size={size}
            quality={resolved?.quality}
            assetKey={resolved?.slug ?? slug}
            routePath={
              resolved ? getCharacterRoutePath(resolved) : `/characters/${slug}`
            }
            link
            tooltip={resolved?.name ?? slug}
            loading="lazy"
          />
        );
      })}
    </Group>
  );
}

export default function EventCharacterAvatars(
  props: EventCharacterAvatarsProps,
) {
  const { data: characterData } = useCharacters();
  const characterByIdentity = useMemo(
    () => buildCharacterByIdentityMap(characterData),
    [characterData],
  );

  return (
    <EventCharacterAvatarList
      {...props}
      characterByIdentity={characterByIdentity}
    />
  );
}
