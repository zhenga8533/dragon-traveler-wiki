import { Badge } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useGradientAccent } from '../../hooks';
import { getCharacterRoutePathByName } from '../../utils/character-route';
import CharacterPortrait from './CharacterPortrait';

export interface CharacterTagProps {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  link?: boolean;
  routePath?: string;
}

export default function CharacterTag({
  name,
  color,
  size = 'md',
  link = true,
  routePath,
}: CharacterTagProps) {
  const { accent } = useGradientAccent();

  const badge = (
    <Badge
      variant="light"
      color={color ?? accent.primary}
      size={size}
      leftSection={<CharacterPortrait name={name} size={14} borderWidth={0} />}
    >
      {name}
    </Badge>
  );

  if (!link) {
    return badge;
  }

  return (
    <Link
      to={routePath ?? getCharacterRoutePathByName(name)}
      style={{ textDecoration: 'none', display: 'inline-flex' }}
    >
      {badge}
    </Link>
  );
}
