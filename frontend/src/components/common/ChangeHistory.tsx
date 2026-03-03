import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import {
  IoAddCircleOutline,
  IoCalendarOutline,
  IoRemoveCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5';
import type { ChangeRecord, EntityChangeHistory } from '../../types/changes';
import CollapsibleSectionCard from './CollapsibleSectionCard';

const PAGE_SIZE = 5;

interface LabeledHistory {
  label: string;
  history: EntityChangeHistory;
}

interface ChangeHistoryProps {
  history: EntityChangeHistory | undefined;
  extraHistories?: LabeledHistory[];
}

interface MergedRecord {
  label: string | null;
  record: ChangeRecord;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatExactDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(none)';
  if (typeof value === 'string')
    return value.length > 100 ? value.slice(0, 100) + '…' : value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value))
    return value
      .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
      .join(', ');
  return JSON.stringify(value);
}

function LifecycleEvent({
  record,
  label,
}: {
  record: ChangeRecord;
  label: string | null;
}) {
  const isRemoved = record.type === 'removed';
  const color = isRemoved ? 'red' : 'teal';
  const Icon = isRemoved ? IoRemoveCircleOutline : IoAddCircleOutline;
  const text = isRemoved ? 'Removed' : 'Re-added';

  return (
    <Tooltip label={formatExactDate(record.timestamp)} withArrow>
      <Group gap={6} w="fit-content">
        <Icon size={14} color={`var(--mantine-color-${color}-6)`} />
        <Text size="sm" fw={600} c={`${color}.6`}>
          {text}
        </Text>
        <Text size="xs" c="dimmed">
          on {formatTimestamp(record.timestamp)}
        </Text>
        {label && (
          <Badge variant="light" color="violet" size="xs">
            {label}
          </Badge>
        )}
      </Group>
    </Tooltip>
  );
}

function FieldChangeEntry({ entry }: { entry: MergedRecord }) {
  const fields = Object.keys(entry.record.fields ?? {});
  if (fields.length === 0) return null;

  return (
    <Stack gap="xs">
      <Tooltip label={formatExactDate(entry.record.timestamp)} withArrow>
        <Group gap={6} w="fit-content">
          <IoTimeOutline size={13} color="var(--mantine-color-dimmed)" />
          <Text size="sm" fw={600}>
            {formatTimestamp(entry.record.timestamp)}
          </Text>
          {entry.label && (
            <Badge variant="light" color="violet" size="xs">
              {entry.label}
            </Badge>
          )}
          <Text size="xs" c="dimmed">
            — {fields.length} field
            {fields.length !== 1 ? 's' : ''}
          </Text>
        </Group>
      </Tooltip>

      <Stack gap={6}>
        {fields.map((field) => {
          const diff = entry.record.fields![field];
          return (
            <Box
              key={field}
              pl="sm"
              style={{
                borderLeft:
                  '2px solid var(--mantine-color-default-border)',
              }}
            >
              <Text size="xs" fw={600} mb={2}>
                {field}
              </Text>
              <Group gap="xs" wrap="wrap">
                {diff.old !== undefined && (
                  <Text
                    size="xs"
                    c="red.6"
                    style={{
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    - {formatValue(diff.old)}
                  </Text>
                )}
                {diff.new !== undefined && (
                  <Text
                    size="xs"
                    c="green.6"
                    style={{
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    + {formatValue(diff.new)}
                  </Text>
                )}
              </Group>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}

export default function ChangeHistory({
  history,
  extraHistories,
}: ChangeHistoryProps) {
  const hasExtras = extraHistories && extraHistories.length > 0;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sorted = useMemo(() => {
    const merged: MergedRecord[] = [];

    if (history) {
      for (const record of history.changes) {
        merged.push({ label: null, record });
      }
    }

    if (extraHistories) {
      for (const { label, history: extra } of extraHistories) {
        for (const record of extra.changes) {
          merged.push({ label, record });
        }
      }
    }

    return merged.sort((a, b) => b.record.timestamp - a.record.timestamp);
  }, [history, extraHistories]);

  const earliestAdded = useMemo(() => {
    const timestamps: number[] = [];
    if (history) timestamps.push(history.added);
    if (extraHistories) {
      for (const { history: extra } of extraHistories) {
        timestamps.push(extra.added);
      }
    }
    return timestamps.length > 0 ? Math.min(...timestamps) : null;
  }, [history, extraHistories]);

  if (!history && !hasExtras) return null;

  const visible = sorted.slice(0, visibleCount);
  const remaining = sorted.length - visibleCount;

  return (
    <Box mt="xl">
      <CollapsibleSectionCard
        defaultExpanded={false}
        header={
          <Group gap="sm" align="center">
            <Title order={2} size="h3">
              Change History
            </Title>
            {sorted.length > 0 && (
              <Badge variant="light" color="gray" size="sm">
                {sorted.length} update{sorted.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </Group>
        }
      >
        <Stack gap="md">
          {/* Added date */}
          {earliestAdded !== null && (
            <Tooltip label={formatExactDate(earliestAdded)} withArrow>
              <Group gap={6} w="fit-content">
                <IoCalendarOutline
                  size={14}
                  color="var(--mantine-color-dimmed)"
                />
                <Text size="sm" c="dimmed">
                  Added on {formatTimestamp(earliestAdded)}
                </Text>
              </Group>
            </Tooltip>
          )}

          {sorted.length === 0 ? (
            <Text size="sm" c="dimmed" fs="italic">
              No recorded changes yet.
            </Text>
          ) : (
            <Stack gap="sm">
              {visible.map((entry, index) => (
                <Box
                  key={`${entry.record.timestamp}-${entry.label}-${index}`}
                >
                  {index > 0 && <Divider mb="sm" />}
                  {entry.record.type ? (
                    <LifecycleEvent
                      record={entry.record}
                      label={entry.label}
                    />
                  ) : (
                    <FieldChangeEntry entry={entry} />
                  )}
                </Box>
              ))}

              {remaining > 0 && (
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  onClick={() =>
                    setVisibleCount((prev) => prev + PAGE_SIZE)
                  }
                >
                  Show {Math.min(remaining, PAGE_SIZE)} more
                  {remaining > PAGE_SIZE
                    ? ` of ${remaining} remaining`
                    : ''}
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </CollapsibleSectionCard>
    </Box>
  );
}
