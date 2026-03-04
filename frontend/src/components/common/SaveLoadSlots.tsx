import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Menu,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useState } from 'react';
import { IoClose, IoSave } from 'react-icons/io5';
import ConfirmActionModal from './ConfirmActionModal';

type SlotAction = { index: number; type: 'load' | 'save' | 'delete' };

interface SlotData {
  name?: string;
}

interface SaveLoadSlotsProps<T extends SlotData> {
  /** localStorage key for persisting slots */
  storageKey: string;
  /** Number of save slots (default 6) */
  numSlots?: number;
  /** Current builder state serialized as JSON string */
  currentJson: string;
  /** Called when a slot is loaded; receives the parsed slot data */
  onLoad: (data: T) => void;
  /** Renders the subtitle for an occupied slot (e.g. "6 members", "12 entries") */
  renderSlotDetail?: (data: T) => string;
  /** Default name shown when slot has no name */
  defaultName?: string;
  /** Whether to render as a compact ActionIcon (mobile) or a full Button */
  compact?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asSlotData(value: unknown): SlotData | null {
  if (!isRecord(value)) return null;

  const nested = value.data;
  if (isRecord(nested)) {
    return nested as SlotData;
  }

  const payload = value.payload;
  if (isRecord(payload)) {
    return payload as SlotData;
  }

  return value as SlotData;
}

function normalizeStoredSlots<T extends SlotData>(
  raw: unknown,
  numSlots: number
): Record<string, T | null> {
  const slots: Record<string, T | null> = {};

  const assignSlot = (index: number, value: unknown): void => {
    if (!Number.isInteger(index) || index < 0 || index >= numSlots) return;
    const slotData = asSlotData(value);
    if (slotData) {
      slots[String(index)] = slotData as T;
    }
  };

  if (Array.isArray(raw)) {
    raw.forEach((value, index) => assignSlot(index, value));
    return slots;
  }

  if (!isRecord(raw)) {
    return slots;
  }

  const source = (() => {
    const nestedSlots = raw.slots;
    if (Array.isArray(nestedSlots) || isRecord(nestedSlots)) {
      return nestedSlots;
    }
    return raw;
  })();

  if (Array.isArray(source)) {
    source.forEach((value, index) => assignSlot(index, value));
    return slots;
  }

  if (!isRecord(source)) {
    return slots;
  }

  Object.entries(source).forEach(([key, value]) => {
    if (!/^\d+$/.test(key)) return;
    assignSlot(Number(key), value);
  });

  return slots;
}

export default function SaveLoadSlots<T extends SlotData>({
  storageKey,
  numSlots = 6,
  currentJson,
  onLoad,
  renderSlotDetail,
  defaultName = 'Untitled',
  compact = false,
}: SaveLoadSlotsProps<T>) {
  type SaveSlots = Record<string, T | null>;

  const [saveSlots, setSaveSlots] = useState<SaveSlots>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        return normalizeStoredSlots<T>(parsed, numSlots);
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [pendingAction, setPendingAction] = useState<SlotAction | null>(null);
  const [menuOpened, { open: openMenu, close: closeMenu }] =
    useDisclosure(false);

  const persistSlots = useCallback(
    (next: SaveSlots) => {
      setSaveSlots(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      }
    },
    [storageKey]
  );

  function handleSave(index: number) {
    try {
      const data = JSON.parse(currentJson) as T;
      persistSlots({ ...saveSlots, [String(index)]: data });
    } catch {
      // ignore malformed current JSON
    }
  }

  function handleLoad(index: number) {
    const data = saveSlots[String(index)];
    if (data) onLoad(data);
  }

  function handleDelete(index: number) {
    const next = { ...saveSlots };
    delete next[String(index)];
    persistSlots(next);
  }

  function getSlotName(index: number) {
    return saveSlots[String(index)]?.name || defaultName;
  }

  function confirmAction() {
    if (!pendingAction) return;
    const { index, type } = pendingAction;
    if (type === 'load') handleLoad(index);
    else if (type === 'delete') handleDelete(index);
    else handleSave(index);
    setPendingAction(null);
  }

  return (
    <>
      <Menu
        shadow="md"
        width={260}
        position="bottom-start"
        withArrow
        opened={menuOpened}
        onChange={(opened) => {
          if (opened) openMenu();
          else closeMenu();
        }}
      >
        <Menu.Target>
          {compact ? (
            <Tooltip label="Save/Load Slots" withArrow>
              <ActionIcon variant="light">
                <IoSave size={16} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Button
              variant="light"
              size="sm"
              leftSection={<IoSave size={16} />}
            >
              Slots
            </Button>
          )}
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Save &amp; Load Slots</Menu.Label>
          {Array.from({ length: numSlots }, (_, i) => {
            const slotData = saveSlots[String(i)];
            const isOccupied = Boolean(slotData);
            const slotName = getSlotName(i);
            const detail =
              isOccupied && slotData && renderSlotDetail
                ? renderSlotDetail(slotData)
                : null;
            return (
              <Menu.Item
                key={i}
                leftSection={
                  <Badge
                    size="sm"
                    variant={isOccupied ? 'filled' : 'light'}
                    color={isOccupied ? 'blue' : 'gray'}
                    circle
                  >
                    {i + 1}
                  </Badge>
                }
                rightSection={
                  isOccupied ? (
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Overwrite" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeMenu();
                            setPendingAction({ index: i, type: 'save' });
                          }}
                        >
                          <IoSave size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeMenu();
                            setPendingAction({ index: i, type: 'delete' });
                          }}
                        >
                          <IoClose size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  ) : null
                }
                onClick={() => {
                  if (isOccupied) {
                    setPendingAction({ index: i, type: 'load' });
                  } else {
                    handleSave(i);
                  }
                }}
              >
                {isOccupied ? (
                  <div>
                    <Text size="sm" fw={500} lineClamp={1}>
                      {slotName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {detail ? `${detail} · ` : ''}Click to load
                    </Text>
                  </div>
                ) : (
                  <Text size="sm" c="dimmed">
                    Empty · Click to save
                  </Text>
                )}
              </Menu.Item>
            );
          })}
        </Menu.Dropdown>
      </Menu>

      <ConfirmActionModal
        opened={pendingAction !== null}
        onCancel={() => setPendingAction(null)}
        title={
          pendingAction?.type === 'load'
            ? `Load from slot ${pendingAction.index + 1}?`
            : pendingAction?.type === 'delete'
              ? `Delete slot ${pendingAction.index + 1}?`
              : `Overwrite slot ${(pendingAction?.index ?? 0) + 1}?`
        }
        message={
          pendingAction?.type === 'load'
            ? `This will replace your current builder state with "${getSlotName(pendingAction.index)}".`
            : pendingAction?.type === 'delete'
              ? `This will permanently delete "${getSlotName(pendingAction.index)}" from slot ${pendingAction.index + 1}.`
              : `This will overwrite the saved data in slot ${(pendingAction?.index ?? 0) + 1} with the current builder state.`
        }
        confirmLabel={
          pendingAction?.type === 'load'
            ? 'Load'
            : pendingAction?.type === 'delete'
              ? 'Delete'
              : 'Overwrite'
        }
        confirmColor={pendingAction?.type === 'delete' ? 'red' : 'blue'}
        onConfirm={confirmAction}
      />
    </>
  );
}
