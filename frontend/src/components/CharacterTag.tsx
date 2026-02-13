import { Badge, Image } from '@mantine/core';
import { Link } from 'react-router-dom';
import { getPortrait } from '../assets/character';

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

  return (
    <Badge
      variant="light"
      color={color}
      size={size}
      component={link ? Link : 'span'}
      to={link ? `/characters/${encodeURIComponent(name)}` : undefined}
      leftSection={
        portrait ? (
          <Image src={portrait} alt={name} w={14} h={14} radius="xl" />
        ) : undefined
      }
      styles={
        link
          ? {
              root: {
                textDecoration: 'none',
                cursor: 'pointer',
              },
            }
          : undefined
      }
    >
      {name}
    </Badge>
  );
}
