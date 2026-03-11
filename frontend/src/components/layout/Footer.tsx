import {
  Anchor,
  Box,
  Collapse,
  Container,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { useContext, useState } from 'react';
import {
  IoBulb,
  IoChevronDown,
  IoChevronUp,
  IoLogoGithub,
  IoWarning,
} from 'react-icons/io5';
import { GITHUB_REPO_URL } from '@/constants/github';
import { IMAGE_SIZE } from '@/constants/ui';
import { getGlassStyles } from '@/constants/glass';
import { ICON_TEXT_FLEX_STYLE } from '@/constants/styles';
import { UiOpacityContext } from '@/contexts';
import { useDarkMode, useGradientAccent } from '@/hooks';

const DATA_SOURCE_URL = 'https://www.gamekee.com/lhlr/';

const LEGAL_DISCLAIMER =
  'This is an unofficial, fan-run wiki and is not affiliated with or endorsed by GameTree. Dragon Traveler names, assets, and related intellectual property belong to GameTree.';

export default function Footer() {
  const [showLegal, setShowLegal] = useState(false);
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();
  const { surfaceOpacity } = useContext(UiOpacityContext);
  const glassStyles = getGlassStyles(isDark, true, surfaceOpacity);
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      label: 'GitHub',
      href: GITHUB_REPO_URL,
      icon: <IoLogoGithub size={IMAGE_SIZE.ICON_LG} aria-hidden="true" />,
    },
    {
      label: 'Report Issue',
      href: `${GITHUB_REPO_URL}/issues/new?labels=bug`,
      icon: <IoWarning size={IMAGE_SIZE.ICON_LG} aria-hidden="true" />,
    },
    {
      label: 'Suggest',
      href: `${GITHUB_REPO_URL}/issues/new?labels=enhancement`,
      icon: <IoBulb size={IMAGE_SIZE.ICON_LG} aria-hidden="true" />,
    },
  ];

  return (
    <Box
      component="footer"
      mt="lg"
      pt="lg"
      pb="md"
      style={{
        ...glassStyles,
        border: 'none',
        borderTop: glassStyles.border,
      }}
    >
      <Container size="lg">
        <Stack gap="sm" align="center">
          <Group justify="center" gap="md" wrap="wrap">
            {footerLinks.map((link) => (
              <Anchor
                key={link.label}
                href={link.href}
                aria-label={link.label}
                c={`${accent.primary}.${isDark ? 3 : 7}`}
                underline="hover"
                size="sm"
                target="_blank"
                rel="noopener noreferrer"
                style={ICON_TEXT_FLEX_STYLE}
              >
                {link.icon}
                <Text span fw={500}>
                  {link.label}
                </Text>
              </Anchor>
            ))}

            <Text size="sm" c="dimmed" ta="center">
              © {currentYear} Dragon Traveler Wiki
            </Text>
          </Group>

          <Group gap={6} justify="center" wrap="wrap">
            <Text size="xs" c="dimmed" fs="italic">
              Unofficial fan project
            </Text>

            <Text size="xs" c="dimmed" aria-hidden="true">
              •
            </Text>

            <Anchor
              component="button"
              type="button"
              onClick={() => setShowLegal((value) => !value)}
              aria-expanded={showLegal}
              aria-controls="footer-legal"
              c={`${accent.primary}.${isDark ? 3 : 7}`}
              size="xs"
              fw={600}
              style={ICON_TEXT_FLEX_STYLE}
            >
              {showLegal ? <IoChevronUp /> : <IoChevronDown />}
              Legal & Sources
            </Anchor>
          </Group>

          <Collapse in={showLegal} id="footer-legal">
            <Stack gap={2} align="center" pt={6}>
              <Text size="xs" c="dimmed" ta="center" maw={600}>
                {LEGAL_DISCLAIMER}
              </Text>
              <Text size="xs" c="dimmed">
                Data source:{' '}
                <Anchor
                  href={DATA_SOURCE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  c={`${accent.primary}.${isDark ? 3 : 7}`}
                >
                  GameKee Wiki
                </Anchor>
              </Text>
            </Stack>
          </Collapse>
        </Stack>
      </Container>
    </Box>
  );
}
