import { Button, Group, Modal, Stack, Text } from '@mantine/core';

interface ConfirmActionModalProps {
  opened: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmActionModal({
  opened,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'violet',
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  return (
    <Modal opened={opened} onClose={onCancel} title={title} centered>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {message}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button color={confirmColor} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
