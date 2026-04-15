import { useGradientAccent } from '@/hooks';
import {
  Button,
  CopyButton,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { useState } from 'react';
import { IoCheckmark, IoCopy, IoDownload } from 'react-icons/io5';

interface JsonModalCopyProps {
  mode: 'copy';
  value: string;
  filename?: string;
  onApply?: never;
  placeholder?: never;
  applyLabel?: never;
}

interface JsonModalPasteProps {
  mode: 'paste';
  value?: never;
  filename?: never;
  /** Called with the pasted text. Return an error string or null on success. */
  onApply: (text: string) => string | null;
  placeholder?: string;
  applyLabel?: string;
}

type JsonModalProps = (JsonModalCopyProps | JsonModalPasteProps) & {
  title: string;
  description?: string;
  opened: boolean;
  onClose: () => void;
};

export default function JsonModal({
  title,
  description,
  opened,
  onClose,
  mode,
  value,
  filename,
  onApply,
  placeholder,
  applyLabel = 'Apply',
}: JsonModalProps) {
  const { accent } = useGradientAccent();
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');

  const handleClose = () => {
    onClose();
    setPasteText('');
    setPasteError('');
  };

  const handleApply = () => {
    const error = onApply!(pasteText);
    if (error) {
      setPasteError(error);
      return;
    }
    handleClose();
  };

  const handleDownload = () => {
    if (!value || !filename) return;
    const blob = new Blob([value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg" lockScroll={false}>
      <Stack gap="md">
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}

        <Textarea
          value={mode === 'copy' ? value : pasteText}
          readOnly={mode === 'copy'}
          onChange={
            mode === 'paste'
              ? (e) => {
                  setPasteText(e.currentTarget.value);
                  setPasteError('');
                }
              : undefined
          }
          placeholder={placeholder}
          minRows={8}
          maxRows={20}
          autosize
          error={pasteError || undefined}
          styles={{
            input: {
              fontFamily: 'monospace',
              fontSize: 'var(--mantine-font-size-xs)',
            },
          }}
        />

        <Group justify="flex-end" gap="xs">
          {mode === 'copy' ? (
            <>
              {filename && (
                <Button
                  variant="light"
                  color={accent.primary}
                  leftSection={<IoDownload size={14} />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
              )}
              <CopyButton value={value ?? ''}>
                {({ copied, copy }) => (
                  <Button
                    color={copied ? accent.secondary : accent.primary}
                    leftSection={
                      copied ? <IoCheckmark size={14} /> : <IoCopy size={14} />
                    }
                    onClick={copy}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                )}
              </CopyButton>
            </>
          ) : (
            <>
              <Button variant="outline" color={accent.primary} onClick={handleClose}>
                Cancel
              </Button>
              <Button
                color={accent.primary}
                onClick={handleApply}
                disabled={!pasteText.trim()}
              >
                {applyLabel}
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
