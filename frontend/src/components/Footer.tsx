import {
  Anchor,
  Box,
  Center,
  Divider,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { IoLogoGithub, IoWarning } from 'react-icons/io5';

export default function Footer() {
  return (
    <Box component="footer" mt="xl" pt="md">
      <Divider />
      <Center py="lg">
        <Stack gap="md" align="center">
          <Text size="xs" c="dimmed" fs="italic" ta="center">
            This is a fan-made project and is not affiliated with or endorsed by
            GameTree.
          </Text>
          <Group gap="xl" wrap="wrap" justify="center">
            <Anchor
              href="https://github.com/azheng/dragon-traveler-wiki"
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
              href="https://github.com/azheng/dragon-traveler-wiki/issues/new"
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
        </Stack>
      </Center>
    </Box>
  );
}
