import {
  Box,
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMemo } from 'react';
import {
  IoAddCircleOutline,
  IoCalendarOutline,
  IoRemoveCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5';
import { usePagination } from '../../hooks/use-pagination';
import type {
  ChangeRecord,
  EntityChangeHistory,
  FieldDiff,
} from '../../types/changes';
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function formatDiffValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function extractNestedDiffDetails(value: unknown, pathPrefix = ''): string[] {
  if (!isRecord(value)) return [];

  const hasOldOrNew = 'old' in value || 'new' in value;
  if (hasOldOrNew) {
    const oldVal = (value as Record<string, unknown>).old;
    const newVal = (value as Record<string, unknown>).new;
    const label = pathPrefix || 'Value';

    if (oldVal !== undefined && newVal !== undefined) {
      return [
        `${label}: ${formatDiffValue(oldVal)} → ${formatDiffValue(newVal)}`,
      ];
    }
    if (newVal !== undefined) {
      return [`${label}: Added ${formatDiffValue(newVal)}`];
    }
    if (oldVal !== undefined) {
      return [`${label}: Removed ${formatDiffValue(oldVal)}`];
    }
    return [];
  }

  const details: string[] = [];
  for (const [key, nested] of Object.entries(value)) {
    const nextPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    details.push(...extractNestedDiffDetails(nested, nextPath));
  }

  return details;
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

function renderDetailLine(fieldName: string, detail: string, index: number) {
  const match = detail.match(/^(Added|Removed|Updated):\s*(.*)$/);
  if (!match) {
    return (
      <Text key={`${fieldName}-${index}`} size="xs" c="dimmed" mt={2}>
        {detail}
      </Text>
    );
  }

  const [, label, value] = match;
  return (
    <Text key={`${fieldName}-${index}`} size="xs" c="dimmed" mt={2}>
      <Text component="span" fw={700} c="dark">
        {label}:
      </Text>{' '}
      {value}
    </Text>
  );
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
    <Group gap="xs" align="flex-start" wrap="nowrap">
      <Icon size={14} color={`var(--mantine-color-${color}-6)`} />
      <Stack gap={0}>
        <Group gap={6} wrap="wrap">
          <Text size="sm" fw={700} c={`${color}.6`}>
            {text}
          </Text>
          {label && (
            <Text size="xs" c="dimmed">
              • {label}
            </Text>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          {formatTimestamp(record.timestamp)}
        </Text>
        <Text size="xs" c="dimmed">
          {formatExactDate(record.timestamp)}
        </Text>
      </Stack>
    </Group>
  );
}

function summarizeFieldDiff(diff: FieldDiff): {
  kind: string;
  details: string[];
} {
  const details: string[] = [];

  if (diff.added?.length) details.push(`Added: ${diff.added.join(', ')}`);
  if (diff.removed?.length) details.push(`Removed: ${diff.removed.join(', ')}`);
  if (diff.modified) {
    if (Array.isArray(diff.modified) && diff.modified.length) {
      details.push(`Updated: ${diff.modified.join(', ')}`);
    } else if (isRecord(diff.modified)) {
      const updatedItems = Object.keys(diff.modified);
      if (updatedItems.length > 0) {
        details.push(`Updated: ${updatedItems.join(', ')}`);
        for (const [itemKey, nested] of Object.entries(diff.modified)) {
          details.push(...extractNestedDiffDetails(nested, itemKey));
        }
      }
    }
  }

  if (diff.changed) {
    for (const [key, value] of Object.entries(diff.changed)) {
      details.push(
        `${key}: ${formatDiffValue(value.old)} → ${formatDiffValue(value.new)}`
      );
    }
  }

  if (diff.old !== undefined && diff.new !== undefined) {
    details.push(`${formatDiffValue(diff.old)} → ${formatDiffValue(diff.new)}`);
  } else if (diff.new !== undefined) {
    details.push(`Added: ${formatDiffValue(diff.new)}`);
  } else if (diff.old !== undefined) {
    details.push(`Removed: ${formatDiffValue(diff.old)}`);
  }

  if (details.length === 0) {
    return { kind: 'Updated', details: ['Value changed'] };
  }

  const hasAdd = diff.added?.length || diff.new !== undefined;
  const hasRemove = diff.removed?.length || diff.old !== undefined;
  const hasModified = Array.isArray(diff.modified)
    ? diff.modified.length > 0
    : !!(
        diff.modified &&
        isRecord(diff.modified) &&
        Object.keys(diff.modified).length
      );
  const hasUpdate = hasModified || !!diff.changed;

  if (hasAdd && !hasRemove && !hasUpdate) return { kind: 'Added', details };
  if (!hasAdd && hasRemove && !hasUpdate) return { kind: 'Removed', details };

  return { kind: 'Updated', details };
}

function FieldChangeEntry({ entry }: { entry: MergedRecord }) {
  const { fields } = entry.record;
  if (!fields) return null;
  const fieldNames = Object.keys(fields);
  if (fieldNames.length === 0) return null;

  return (
    <Paper p="sm" withBorder radius="md" bg="var(--mantine-color-body)">
      <Stack gap="xs">
        <Group
          justify="space-between"
          align="flex-start"
          gap="sm"
          wrap="nowrap"
        >
          <Group gap="xs" align="flex-start" wrap="nowrap">
            <IoTimeOutline size={13} color="var(--mantine-color-dimmed)" />
            <Stack gap={0}>
              <Text size="sm" fw={600}>
                {formatTimestamp(entry.record.timestamp)}
              </Text>
              <Text size="xs" c="dimmed">
                {formatExactDate(entry.record.timestamp)}
              </Text>
            </Stack>
          </Group>
          <Text size="xs" c="dimmed" ta="right">
            {fieldNames.length} field{fieldNames.length !== 1 ? 's' : ''}
            {entry.label ? ` • ${entry.label}` : ''}
          </Text>
        </Group>

        <Stack gap={8}>
          {fieldNames.map((fieldName) => {
            const diff = fields[fieldName];
            const summary = summarizeFieldDiff(diff);

            return (
              <Paper
                key={fieldName}
                p="xs"
                withBorder
                radius="sm"
                bg="var(--mantine-color-body)"
              >
                <Group
                  justify="space-between"
                  align="flex-start"
                  gap="sm"
                  wrap="nowrap"
                >
                  <Text size="sm" fw={600} ff="monospace">
                    {fieldName}
                  </Text>
                  <Text size="xs" c="dimmed" fw={700}>
                    {summary.kind}
                  </Text>
                </Group>
                {summary.details.map((detail, index) =>
                  renderDetailLine(fieldName, detail, index)
                )}
              </Paper>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function ChangeHistory({
  history,
  extraHistories,
}: ChangeHistoryProps) {
  const hasExtras = extraHistories && extraHistories.length > 0;

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

  const paginationResetKey = useMemo(() => {
    const newestTimestamp = sorted[0]?.record.timestamp ?? 0;
    const oldestTimestamp = sorted[sorted.length - 1]?.record.timestamp ?? 0;
    return `${earliestAdded ?? 0}:${sorted.length}:${newestTimestamp}:${oldestTimestamp}`;
  }, [earliestAdded, sorted]);

  const { page, setPage } = usePagination(sorted.length, 1, paginationResetKey);

  if (!history && !hasExtras) return null;

  const visibleCount = Math.min(sorted.length, page * PAGE_SIZE);
  const visible = sorted.slice(0, visibleCount);
  const remaining = sorted.length - visibleCount;

  return (
    <Box mt="xl">
      <CollapsibleSectionCard
        defaultExpanded={false}
        header={
          <Stack gap={2}>
            <Group gap="sm" align="center">
              <Title order={2} size="h3">
                Change History
              </Title>
              {sorted.length > 0 && (
                <Text size="sm" c="dimmed" fw={500}>
                  {sorted.length} update{sorted.length !== 1 ? 's' : ''}
                </Text>
              )}
            </Group>
            <Text size="xs" c="dimmed">
              Recent edits, lifecycle events, and field-level updates.
            </Text>
          </Stack>
        }
      >
        <Stack gap="md">
          {/* Added date */}
          {earliestAdded !== null && (
            <Paper p="xs" withBorder radius="md" bg="var(--mantine-color-body)">
              <Group gap="xs" align="flex-start" wrap="nowrap">
                <IoCalendarOutline
                  size={14}
                  color="var(--mantine-color-dimmed)"
                />
                <Stack gap={0}>
                  <Text size="sm" c="dimmed" fw={500}>
                    Added on {formatTimestamp(earliestAdded)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatExactDate(earliestAdded)}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          )}

          {sorted.length === 0 ? (
            <Text size="sm" c="dimmed" fs="italic">
              No recorded changes yet.
            </Text>
          ) : (
            <Stack gap="sm">
              {visible.map((entry, index) => (
                <Box key={`${entry.record.timestamp}-${entry.label}-${index}`}>
                  {index > 0 && <Divider mb="sm" />}
                  {entry.record.type ? (
                    <Paper
                      p="sm"
                      withBorder
                      radius="md"
                      bg="var(--mantine-color-body)"
                    >
                      <LifecycleEvent
                        record={entry.record}
                        label={entry.label}
                      />
                    </Paper>
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
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Show {Math.min(remaining, PAGE_SIZE)} more
                  {remaining > PAGE_SIZE ? ` of ${remaining} remaining` : ''}
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </CollapsibleSectionCard>
    </Box>
  );
}
