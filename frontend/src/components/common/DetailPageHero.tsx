import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  DETAIL_HERO_WRAPPER_STYLES,
  getDetailHeroGradient,
} from '@/constants/styles';
import { Box, Container, Stack } from '@mantine/core';
import type { ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface DetailPageHeroProps {
  isDark: boolean;
  /** Mantine color name for the primary gradient color */
  qualityColor: string;
  /** Mantine color name for the secondary gradient color (default: 'violet') */
  secondaryColor?: string;
  /** Opacity overrides for gradient in dark/light mode */
  gradientOpacity?: { dark: number; light: number };
  breadcrumbItems: BreadcrumbItem[];
  /** Padding for the inner Container (default: 'xl') */
  py?: string | Record<string, string>;
  children: ReactNode;
}

export default function DetailPageHero({
  isDark,
  qualityColor,
  secondaryColor,
  gradientOpacity,
  breadcrumbItems,
  py = 'xl',
  children,
}: DetailPageHeroProps) {
  return (
    <Box style={DETAIL_HERO_WRAPPER_STYLES}>
      <Box
        style={getDetailHeroGradient(
          isDark,
          qualityColor,
          secondaryColor,
          gradientOpacity
        )}
      />
      <Container size="lg" style={{ position: 'relative', zIndex: 1 }} py={py}>
        <Stack gap="lg">
          <Breadcrumbs items={breadcrumbItems} />
          {children}
        </Stack>
      </Container>
    </Box>
  );
}
