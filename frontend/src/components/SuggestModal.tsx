import { useState, useEffect } from 'react';
import {
  Modal,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IoAddCircleOutline, IoOpenOutline } from 'react-icons/io5';
import { GITHUB_REPO_URL } from '../constants';

interface SuggestModalProps {
  buttonLabel: string;
  modalTitle: string;
  jsonTemplate: object;
  issueLabel: string;
  issueTitle: string;
}

function buildIssueUrl(params: { title: string; body: string; labels: string }): string {
  return `${GITHUB_REPO_URL}/issues/new?${new URLSearchParams(params).toString()}`;
}

export default function SuggestModal({
  buttonLabel,
  modalTitle,
  jsonTemplate,
  issueLabel,
  issueTitle,
}: SuggestModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [json, setJson] = useState('');

  useEffect(() => {
    if (opened) {
      setJson(JSON.stringify(jsonTemplate, null, 2));
    }
  }, [opened, jsonTemplate]);

  const handleCopyAndOpen = () => {
    navigator.clipboard.writeText(json).then(() => {
      notifications.show({
        title: 'Copied to clipboard',
        message: 'JSON copied! Paste it into the GitHub issue body.',
        color: 'teal',
      });
      const url = buildIssueUrl({
        title: issueTitle,
        body: '**Paste your JSON below:**\n\n```json\n\n```\n',
        labels: issueLabel,
      });
      window.open(url, '_blank');
      close();
    });
  };

  return (
    <>
      <Button
        variant="light"
        size="xs"
        leftSection={<IoAddCircleOutline size={16} />}
        onClick={open}
      >
        {buttonLabel}
      </Button>

      <Modal opened={opened} onClose={close} title={modalTitle} size="lg" centered>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Fill out the JSON below, then copy it and paste into the GitHub issue.
          </Text>

          <Textarea
            value={json}
            onChange={(e) => setJson(e.currentTarget.value)}
            autosize
            minRows={8}
            maxRows={20}
            styles={{
              input: {
                fontFamily: 'monospace',
                fontSize: '0.85rem',
              },
            }}
          />

          <Group justify="flex-end">
            <Button
              leftSection={<IoOpenOutline size={16} />}
              onClick={handleCopyAndOpen}
            >
              Copy & Open Issue
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
