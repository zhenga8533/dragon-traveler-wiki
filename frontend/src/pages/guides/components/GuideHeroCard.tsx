import { GLASS } from '@/constants/glass';
import { BRAND_TITLE_STYLE, getCardHoverProps } from '@/constants/styles';
import { useDarkMode, useGradientAccent } from '@/hooks';
import { Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { type ReactNode } from 'react';

interface GuideHeroCardProps {
  icon: ReactNode;
  /** Mantine color name. Defaults to accent.primary. */
  iconColor?: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export default function GuideHeroCard({
  icon,
  iconColor,
  title,
  subtitle,
  children,
}: GuideHeroCardProps) {
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();

  return (
    <Card
      withBorder
      radius="md"
      p="xl"
      {...getCardHoverProps({
        style: {
          backdropFilter: `blur(${GLASS.BLUR_SUBTLE})`,
          backgroundColor: isDark
            ? 'var(--dt-home-hero-card-dark)'
            : 'var(--dt-home-hero-card-light)',
        },
      })}
    >
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon
            size="xl"
            radius="md"
            variant="light"
            color={iconColor ?? accent.primary}
          >
            {icon}
          </ThemeIcon>
          <Stack gap={2}>
            <Title order={1} style={BRAND_TITLE_STYLE}>
              {title}
            </Title>
            <Text size="sm" c="dimmed">
              {subtitle}
            </Text>
          </Stack>
        </Group>
        {children}
      </Stack>
    </Card>
  );
}
