import { useMemo } from 'react';
import { Badge } from '@mantine/core';
import { Link } from 'react-router';
import { useGradientAccent } from '@/hooks';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import {
  buildCharacterByIdentityMap,
  getCharacterRoutePath,
} from '@/features/characters/utils/character-route';
import CharacterPortrait from './CharacterPortrait';

export interface CharacterTagProps {
  /** Character slug (e.g. "medusa_ssr") — the canonical key in characters.json. */
  slug: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  link?: boolean;
}

export default function CharacterTag({
  slug,
  color,
  size = 'md',
  link = true,
}: CharacterTagProps) {
  const { accent } = useGradientAccent();
  const { data: characters } = useCharacters();

  const resolvedCharacter = useMemo(
    () => buildCharacterByIdentityMap(characters).get(slug),
    [slug, characters],
  );

  // Prefer the live data name, so renamed characters stay correct without
  // needing every reference site updated in lockstep.
  const displayName = resolvedCharacter?.name ?? slug;

  const resolvedRoutePath = resolvedCharacter
    ? getCharacterRoutePath(resolvedCharacter)
    : `/characters/${slug}`;

  const badge = (
    <Badge
      variant="light"
      color={color ?? accent.primary}
      size={size}
      style={{ cursor: link ? 'pointer' : undefined }}
      leftSection={
        <CharacterPortrait
          name={displayName}
          alt=""
          size={14}
          borderWidth={0}
          routePath={resolvedRoutePath}
        />
      }
    >
      {displayName}
    </Badge>
  );

  if (!link) {
    return badge;
  }

  return (
    <Link
      to={resolvedRoutePath}
      style={{ textDecoration: 'none', display: 'inline-flex' }}
    >
      {badge}
    </Link>
  );
}
