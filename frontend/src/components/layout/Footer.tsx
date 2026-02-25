import {
  Anchor,
  Box,
  Collapse,
  Container,
  Group,
  Stack,
  Text,
  useComputedColorScheme,
} from '@mantine/core';
import { useState } from 'react';
import {
  IoBulb,
  IoChevronDown,
  IoChevronUp,
  IoLogoGithub,
  IoWarning,
} from 'react-icons/io5';
import { GITHUB_REPO_URL } from '../../constants/github';
import { getGlassStyles } from '../../constants/glass';

const DATA_SOURCE_URL = 'https://www.gamekee.com/lhlr/';

const LEGAL_DISCLAIMER =
  'This is an unofficial, fan-run wiki and is not affiliated with or endorsed by GameTree. Dragon Traveler names, assets, and related intellectual property belong to GameTree.';

export default function Footer() {
  const [showLegal, setShowLegal] = useState(false);
  const isDark = useComputedColorScheme('light') === 'dark';
  const glassStyles = getGlassStyles(isDark, true);
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      label: 'GitHub',
      href: GITHUB_REPO_URL,
      icon: <IoLogoGithub size={18} aria-hidden="true" />,
    },
    {
      label: 'Report Issue',
      href: `${GITHUB_REPO_URL}/issues/new?labels=bug`,
      icon: <IoWarning size={18} aria-hidden="true" />,
    },
    {
      label: 'Suggest',
      href: `${GITHUB_REPO_URL}/issues/new?labels=enhancement`,
      icon: <IoBulb size={18} aria-hidden="true" />,
    },
  ];

  const footerLinkStyle = { display: 'flex', alignItems: 'center', gap: '6px' };

  return (
    <Box
      component="footer"
      mt="lg"
      py="lg"
      style={{
        ...glassStyles,
        borderTop: glassStyles.border,
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
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
                c={isDark ? 'gray.4' : 'gray.7'}
                underline="hover"
                size="sm"
                target="_blank"
                rel="noopener noreferrer"
                style={footerLinkStyle}
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
              c="blue.5"
              size="xs"
              fw={600}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
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
                  c="blue.4"
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
