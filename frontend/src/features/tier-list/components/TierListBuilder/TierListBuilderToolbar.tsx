import { useGradientAccent, useIsMobile } from '@/hooks';
import { ActionIcon, Button, CopyButton, Group, Tooltip } from '@mantine/core';
import { memo } from 'react';
import {
  IoCheckmark,
  IoClipboardOutline,
  IoCopy,
  IoDownload,
  IoOpenOutline,
  IoSave,
  IoSwapVertical,
  IoTrash,
} from 'react-icons/io5';

interface TierListBuilderToolbarProps {
  json: string;
  hasAnyPlaced: boolean;
  hasAnyBuilderData: boolean;
  isCapturing: boolean;
  onPasteOpen: () => void;
  onSave: () => void;
  onSort: () => void;
  onExport: () => void;
  onSubmit: () => void;
  onClear: () => void;
}

function TierListBuilderToolbarComponent({
  json,
  hasAnyPlaced,
  hasAnyBuilderData,
  isCapturing,
  onPasteOpen,
  onSave,
  onSort,
  onExport,
  onSubmit,
  onClear,
}: TierListBuilderToolbarProps) {
  const { accent } = useGradientAccent();
  const isMobile = useIsMobile();

  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Group gap="xs" wrap="nowrap" align="center">
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
                size="sm"
                leftSection={
                  copied ? <IoCheckmark size={16} /> : <IoCopy size={16} />
                }
                onClick={copy}
                color={copied ? accent.secondary : accent.primary}
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

        {isMobile ? (
          <Tooltip label="Sort Tiers" withArrow>
            <ActionIcon
              variant="light"
              color={accent.primary}
              onClick={onSort}
              disabled={!hasAnyPlaced}
            >
              <IoSwapVertical size={16} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            variant="light"
            color={accent.primary}
            size="sm"
            leftSection={<IoSwapVertical size={16} />}
            onClick={onSort}
            disabled={!hasAnyPlaced}
          >
            Sort Tiers
          </Button>
        )}
      </Group>

      <Group gap="xs" wrap="nowrap">
        {isMobile ? (
          <Tooltip label="Export as Image" withArrow>
            <ActionIcon
              variant="light"
              color={accent.primary}
              disabled={!hasAnyPlaced}
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
            disabled={!hasAnyPlaced}
          >
            Export Image
          </Button>
        )}

        {isMobile ? (
          <Tooltip label="Submit Suggestion" withArrow>
            <ActionIcon
              variant="light"
              color={accent.primary}
              disabled={!hasAnyPlaced}
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
            disabled={!hasAnyPlaced}
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
      </Group>
    </Group>
  );
}

const TierListBuilderToolbar = memo(TierListBuilderToolbarComponent);

export default TierListBuilderToolbar;
