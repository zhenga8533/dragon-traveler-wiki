import { Badge, Image } from '@mantine/core';
import { Link } from 'react-router-dom';
import { getPortrait } from '../../assets/character';

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
  const portrait = getPortrait(name);

  const badge = (
    <Badge
      variant="light"
      color={color}
      size={size}
      leftSection={
        portrait ? (
          <Image src={portrait} alt={name} w={14} h={14} radius="xl" />
        ) : undefined
      }
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
