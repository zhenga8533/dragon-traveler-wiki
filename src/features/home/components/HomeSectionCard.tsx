import { StaticSurface } from '@/components/ui/Surface';
import { useGradientAccent } from '@/hooks';
import {
  Anchor,
  Group,
  Stack,
  ThemeIcon,
  Title,
  type MantineColor,
} from '@mantine/core';
import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface HomeSectionCardProps {
  title: string;
  icon: ComponentType<{ size?: number }>;
  to?: string;
  linkLabel?: string;
  color?: MantineColor;
  children: ReactNode;
}

export default function HomeSectionCard({
  title,
  icon: Icon,
  to,
  linkLabel,
  color,
  children,
}: HomeSectionCardProps) {
  const { accent } = useGradientAccent();
  const iconColor = color ?? accent.primary;

  return (
    <StaticSurface p="lg" h="100%">
      <Stack gap="md">
        <Group justify="space-between" align="center" gap="sm">
          <Group gap="sm">
            <ThemeIcon variant="light" color={iconColor} size="lg" radius="md">
              <Icon size={20} />
            </ThemeIcon>
            <Title order={2} size="h3">
              {title}
            </Title>
          </Group>
          {to && linkLabel && (
            <Anchor component={Link} to={to} size="xs" c={iconColor}>
              {linkLabel}
            </Anchor>
          )}
        </Group>
        {children}
      </Stack>
    </StaticSurface>
  );
}
