import { Badge } from '@mantine/core';
import { Link } from 'react-router-dom';
import CharacterPortrait from './CharacterPortrait';

export interface CharacterTagProps {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  link?: boolean;
}

export default function CharacterTag({
  name,
  color = 'blue',
  size = 'md',
  link = true,
}: CharacterTagProps) {
  const badge = (
    <Badge
      variant="light"
      color={color}
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
      to={`/characters/${encodeURIComponent(name)}`}
      style={{ textDecoration: 'none', display: 'inline-flex' }}
    >
      {badge}
    </Link>
  );
}
