import {
  Anchor,
  Box,
  Center,
  Group,
  Stack,
  Text,
  useComputedColorScheme,
} from '@mantine/core';
import { useState } from 'react';
import { IoLogoGithub, IoWarning } from 'react-icons/io5';
import { GITHUB_REPO_URL } from '../constants';
import { getGlassStyles } from '../constants/glass';

export default function Footer() {
  const [showLegal, setShowLegal] = useState(false);
  const isDark = useComputedColorScheme('light') === 'dark';
  const glassStyles = getGlassStyles(isDark, true);

  return (
    <Box
      component="footer"
      mt="xl"
      py="lg"
      style={{
        ...glassStyles,
        borderTop: glassStyles.border,
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
      }}
    >
      <Center>
        <Stack gap={6} align="center" style={{ width: '100%' }}>
          <Group gap="lg" wrap="wrap" justify="center">
            <Anchor
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              c="dimmed"
              size="sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <IoLogoGithub size={16} />
              <span>GitHub</span>
            </Anchor>
            <Anchor
              href={`${GITHUB_REPO_URL}/issues/new`}
              target="_blank"
              rel="noopener noreferrer"
              c="dimmed"
              size="sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <IoWarning size={16} />
              <span>Report Issue</span>
            </Anchor>
            <Text size="xs" c="dimmed">
              © {new Date().getFullYear()} Dragon Traveler Wiki
            </Text>
          </Group>

          <Group gap={8} justify="center" align="center" wrap="wrap">
            <Text size="xs" c="dimmed" ta="center">
              Unofficial fan wiki.
            </Text>
            <Anchor
              component="button"
              type="button"
              onClick={() => setShowLegal((v) => !v)}
              c="dimmed"
              size="xs"
              td="underline"
            >
              {showLegal ? 'Hide legal & sources' : 'Legal & sources'}
            </Anchor>
          </Group>

          {showLegal && (
            <Text
              size="xs"
              c="dimmed"
              ta="center"
              style={{ maxWidth: 840, lineHeight: 1.45 }}
            >
              Not affiliated with GameTree. Dragon Traveler assets and IP belong
              to GameTree and their respective owners. CN/TW data source:{' '}
              <Anchor
                href="https://www.gamekee.com/lhlr/"
                target="_blank"
                rel="noopener noreferrer"
                c="dimmed"
              >
                Dragon Traveler GameKee Wiki
              </Anchor>
              .
            </Text>
          )}
        </Stack>
      </Center>
    </Box>
  );
}
