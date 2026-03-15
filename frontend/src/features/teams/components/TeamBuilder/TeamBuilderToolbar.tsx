import {
  ActionIcon,
  Badge,
  Button,
  CopyButton,
  Group,
  Tooltip,
} from '@mantine/core';
import { memo } from 'react';
import {
  IoCheckmark,
  IoClipboardOutline,
  IoCopy,
  IoDownload,
  IoOpenOutline,
  IoSave,
  IoTrash,
} from 'react-icons/io5';
import { useGradientAccent, useIsMobile } from '@/hooks';
import { MAX_ROSTER_SIZE } from './utils';

interface TeamBuilderToolbarProps {
  json: string;
  teamSize: number;
  isCapturing: boolean;
  hasAnyBuilderData: boolean;
  onPasteOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onSubmit: () => void;
  onClear: () => void;
}

function TeamBuilderToolbarComponent({
  json,
  teamSize,
  isCapturing,
  hasAnyBuilderData,
  onPasteOpen,
  onSave,
  onExport,
  onSubmit,
  onClear,
}: TeamBuilderToolbarProps) {
  const { accent } = useGradientAccent();
  const isMobile = useIsMobile();

  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Group gap="xs" wrap="nowrap">
        <CopyButton value={json}>
          {({ copied, copy }) =>
            isMobile ? (
              <Tooltip label={copied ? 'Copied!' : 'Copy JSON'} withArrow>
                <ActionIcon
                  variant="light"
                  color={copied ? accent.secondary : accent.primary}
                  onClick={copy}
                >
                  {copied ? <IoCheckmark size={16} /> : <IoCopy size={16} />}
                </ActionIcon>
              </Tooltip>
            ) : (
              <Button
                variant="light"
                color={copied ? accent.secondary : accent.primary}
                size="sm"
                leftSection={
                  copied ? <IoCheckmark size={16} /> : <IoCopy size={16} />
                }
                onClick={copy}
              >
                {copied ? 'Copied' : 'Copy JSON'}
              </Button>
            )
          }
        </CopyButton>
        {isMobile ? (
          <Tooltip label="Paste JSON" withArrow>
            <ActionIcon
              variant="light"
              color={accent.primary}
              onClick={onPasteOpen}
            >
              <IoClipboardOutline size={16} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            variant="light"
            color={accent.primary}
            size="sm"
            leftSection={<IoClipboardOutline size={16} />}
            onClick={onPasteOpen}
          >
            Paste JSON
          </Button>
        )}
        {isMobile ? (
          <Tooltip label="Save to My Saved" withArrow>
            <ActionIcon variant="light" color={accent.primary} onClick={onSave}>
              <IoSave size={16} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            variant="light"
            color={accent.primary}
            size="sm"
            leftSection={<IoSave size={16} />}
            onClick={onSave}
          >
            Save
          </Button>
        )}
      </Group>

      <Group gap="xs" wrap="nowrap">
        {isMobile ? (
          <Tooltip label="Export as Image" withArrow>
            <ActionIcon
              variant="light"
              color={accent.primary}
              disabled={teamSize === 0}
              loading={isCapturing}
              onClick={onExport}
            >
              <IoDownload size={16} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            variant="light"
            color={accent.primary}
            size="sm"
            leftSection={<IoDownload size={16} />}
            onClick={onExport}
            loading={isCapturing}
            disabled={teamSize === 0}
          >
            Export Image
          </Button>
        )}

        {isMobile ? (
          <Tooltip label="Submit Suggestion" withArrow>
            <ActionIcon
              variant="light"
              color={accent.primary}
              disabled={teamSize === 0}
              onClick={onSubmit}
            >
              <IoOpenOutline size={16} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            variant="light"
            color={accent.primary}
            size="sm"
            leftSection={<IoOpenOutline size={16} />}
            onClick={onSubmit}
            disabled={teamSize === 0}
          >
            Submit Suggestion
          </Button>
        )}

        {isMobile ? (
          <Tooltip label="Clear All" withArrow>
            <ActionIcon
              variant="light"
              color="red"
              disabled={!hasAnyBuilderData}
              onClick={onClear}
            >
              <IoTrash size={16} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            variant="light"
            color="red"
            size="sm"
            leftSection={<IoTrash size={16} />}
            onClick={onClear}
            disabled={!hasAnyBuilderData}
          >
            Clear All
          </Button>
        )}

        <Badge variant="light" color={accent.secondary} size="lg" radius="sm">
          {teamSize} / {MAX_ROSTER_SIZE}
        </Badge>
      </Group>
    </Group>
  );
}

const TeamBuilderToolbar = memo(TeamBuilderToolbarComponent);

export default TeamBuilderToolbar;
