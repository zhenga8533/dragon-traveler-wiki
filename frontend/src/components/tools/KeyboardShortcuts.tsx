import { Group, Kbd, Modal, Stack, Text } from '@mantine/core';
import { IoHelpCircleOutline } from 'react-icons/io5';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface KeyboardShortcutsProps {
  opened: boolean;
  onClose: () => void;
}

export default function KeyboardShortcuts({
  opened,
  onClose,
}: KeyboardShortcutsProps) {
  const shortcuts: ShortcutItem[] = [
    { keys: ['/'], description: 'Open search' },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IoHelpCircleOutline size={20} />
          <Text fw={600}>Keyboard Shortcuts</Text>
        </Group>
      }
      centered
      size="sm"
    >
      <Stack gap="sm">
        {shortcuts.map((shortcut, index) => (
          <Group key={index} justify="space-between">
            <Text size="sm">{shortcut.description}</Text>
            <Group gap={4}>
              {shortcut.keys.map((key, keyIndex) => (
                <Kbd key={keyIndex} size="sm">
                  {key}
                </Kbd>
              ))}
            </Group>
          </Group>
        ))}
      </Stack>
    </Modal>
  );
}
