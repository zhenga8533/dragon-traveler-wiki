import { useMemo } from 'react';
import { Badge } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useGradientAccent } from '@/hooks';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import {
  getCharacterRoutePath,
  getCharacterRoutePathByName,
} from '@/features/characters/utils/character-route';
import CharacterPortrait from './CharacterPortrait';

interface CharacterTagBaseProps {
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  link?: boolean;
  routePath?: string;
}

export type CharacterTagProps = CharacterTagBaseProps &
  (
    | { slug: string; name?: string }
    | { slug?: undefined; name: string }
  );

export default function CharacterTag({
  name,
  slug,
  color,
  size = 'md',
  link = true,
  routePath,
}: CharacterTagProps) {
  const { accent } = useGradientAccent();
  const { data: characters } = useCharacters();

  const resolvedCharacter = useMemo(
    () => (slug ? characters.find((c) => c.slug === slug) : undefined),
    [slug, characters]
  );

  // Prefer the live data name over a hardcoded prop, so renamed characters
  // stay correct without needing every reference site updated in lockstep.
  const displayName = resolvedCharacter?.name ?? name ?? slug ?? '';

  const resolvedRoutePath = useMemo(() => {
    if (routePath) return routePath;
    if (resolvedCharacter) return getCharacterRoutePath(resolvedCharacter);
    if (slug) return `/characters/${slug}`;
    return getCharacterRoutePathByName(name ?? '');
  }, [routePath, resolvedCharacter, slug, name]);

  const badge = (
    <Badge
      variant="light"
      color={color ?? accent.primary}
      size={size}
      style={{ cursor: link ? 'pointer' : undefined }}
      leftSection={<CharacterPortrait name={displayName} alt="" size={14} borderWidth={0} routePath={resolvedRoutePath} />}
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
