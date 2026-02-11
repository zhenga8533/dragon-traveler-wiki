import {
  Box,
  Group,
  Kbd,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';

interface ShortcutItem {
  keys: string[];
  description: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['/'], description: 'Open search' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['g', 'h'], description: 'Go to home' },
  { keys: ['g', 'c'], description: 'Go to characters' },
  { keys: ['g', 't'], description: 'Go to tier list' },
];

interface KeyboardShortcutsProps {
  onOpenSearch: () => void;
  onNavigate: (path: string) => void;
}

export default function KeyboardShortcuts({
  onOpenSearch,
  onNavigate,
}: KeyboardShortcutsProps) {
  const [opened, { open, close }] = useDisclosure(false);

  useHotkeys([
    ['/', (e) => { e.preventDefault(); onOpenSearch(); }],
    ['shift+/', open], // ? key
    ['g+h', () => onNavigate('/')],
    ['g+c', () => onNavigate('/characters')],
    ['g+t', () => onNavigate('/tier-list')],
  ]);

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={<Title order={4}>Keyboard Shortcuts</Title>}
      centered
      size="sm"
    >
      <Stack gap="sm">
        {SHORTCUTS.map((shortcut, index) => (
          <Group key={index} justify="space-between">
            <Text size="sm">{shortcut.description}</Text>
            <Group gap={4}>
              {shortcut.keys.map((key, keyIndex) => (
                <Box key={keyIndex}>
                  <Kbd size="sm">{key}</Kbd>
                  {keyIndex < shortcut.keys.length - 1 && (
                    <Text component="span" size="xs" c="dimmed" mx={4}>
                      then
                    </Text>
                  )}
                </Box>
              ))}
            </Group>
          </Group>
        ))}
      </Stack>
    </Modal>
  );
}
