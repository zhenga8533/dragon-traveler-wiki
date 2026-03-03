import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Image,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { memo, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  IoAdd,
  IoCheckmark,
  IoClose,
  IoRemove,
} from 'react-icons/io5';
import { FACTION_ICON_MAP } from '../../../assets/faction';
import { getWyrmspellIcon } from '../../../assets/wyrmspell';
import { FACTION_NAMES } from '../../../constants/colors';
import {
  CONTENT_TYPE_OPTIONS,
  type ContentType,
} from '../../../constants/content-types';
import { getCardHoverProps } from '../../../constants/styles';
import {
  BREAKPOINTS,
  CHARACTER_GRID_SPACING,
  TRANSITION,
} from '../../../constants/ui';
import type { Character } from '../../../types/character';
import type { FactionName } from '../../../types/faction';
import CharacterCard from '../../character/CharacterCard';
import CharacterNoteButton from '../CharacterNoteButton';
import {
  INPUT_COMMIT_DELAY_MS,
  getValidRows,
  ROW_CLASS_HINTS,
  ROW_COLORS,
  ROW_STRIP_LABELS,
} from './utils';

export const TeamMetaFields = memo(function TeamMetaFields({
  name,
  author,
  contentType,
  faction,
  description,
  onNameCommit,
  onAuthorCommit,
  onContentTypeChange,
  onFactionChange,
  onDescriptionCommit,
}: {
  name: string;
  author: string;
  contentType: ContentType;
  faction: FactionName | null;
  description: string;
  onNameCommit: (value: string) => void;
  onAuthorCommit: (value: string) => void;
  onContentTypeChange: (value: string | null) => void;
  onFactionChange: (value: string | null) => void;
  onDescriptionCommit: (value: string) => void;
}) {
  const [nameInput, setNameInput] = useState(name);
  const [authorInput, setAuthorInput] = useState(author);
  const [descriptionInput, setDescriptionInput] = useState(description);

  useEffect(() => {
    setNameInput(name);
  }, [name]);

  useEffect(() => {
    setAuthorInput(author);
  }, [author]);

  useEffect(() => {
    setDescriptionInput(description);
  }, [description]);

  useEffect(() => {
    if (nameInput === name) return;
    const timer = setTimeout(() => {
      onNameCommit(nameInput);
    }, INPUT_COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [nameInput, name, onNameCommit]);

  useEffect(() => {
    if (authorInput === author) return;
    const timer = setTimeout(() => {
      onAuthorCommit(authorInput);
    }, INPUT_COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [authorInput, author, onAuthorCommit]);

  useEffect(() => {
    if (descriptionInput === description) return;
    const timer = setTimeout(() => {
      onDescriptionCommit(descriptionInput);
    }, INPUT_COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [descriptionInput, description, onDescriptionCommit]);

  return (
    <>
      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder="Team name..."
          value={nameInput}
          onChange={(e) => setNameInput(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 150 }}
        />
        <TextInput
          placeholder="Author..."
          value={authorInput}
          onChange={(e) => setAuthorInput(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 120 }}
        />
        <Select
          placeholder="Content type..."
          data={CONTENT_TYPE_OPTIONS.map((contentTypeOption) => ({
            value: contentTypeOption,
            label: contentTypeOption,
          }))}
          value={contentType}
          onChange={onContentTypeChange}
          allowDeselect={false}
          style={{ flex: 1, minWidth: 120 }}
        />
        <Select
          placeholder="Faction..."
          data={FACTION_NAMES.map((f) => ({
            value: f,
            label: f,
          }))}
          value={faction}
          onChange={onFactionChange}
          renderOption={renderFactionOption}
          searchable={FACTION_NAMES.length >= 10}
          leftSection={(() => {
            if (!faction) return undefined;
            const iconSrc = FACTION_ICON_MAP[faction];
            return iconSrc ? (
              <Image src={iconSrc} alt="" w={16} h={16} fit="contain" />
            ) : undefined;
          })()}
          style={{ minWidth: 160 }}
        />
      </Group>

      <Textarea
        placeholder="Description (optional)..."
        value={descriptionInput}
        onChange={(e) => setDescriptionInput(e.currentTarget.value)}
        autosize
        minRows={1}
        maxRows={4}
      />
    </>
  );
});

/* ── Draggable portrait (used in available pool, bench, slots, and overlay) ── */

export function DraggableCharCard({
  name,
  char,
  overlay,
  onClick,
  size,
}: {
  name: string;
  char: Character | undefined;
  overlay?: boolean;
  onClick?: () => void;
  size?: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: name,
  });

  const style: CSSProperties = overlay
    ? { cursor: 'grabbing' }
    : {
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'pointer',
        touchAction: 'none',
      };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      onClick={overlay ? undefined : onClick}
      {...(overlay ? {} : { ...(listeners ?? {}), ...attributes })}
    >
      <CharacterCard
        name={name}
        quality={char?.quality}
        disableLink
        size={size}
      />
    </div>
  );
}

export function renderWyrmspellOption({ option }: { option: { label: string } }) {
  const iconSrc = getWyrmspellIcon(option.label);
  return (
    <Group gap="xs" align="center">
      {iconSrc ? (
        <Image src={iconSrc} alt="" w={18} h={18} fit="contain" />
      ) : null}
      <Text size="sm">{option.label}</Text>
    </Group>
  );
}

export function renderFactionOption({ option }: { option: { label: string } }) {
  const iconSrc = FACTION_ICON_MAP[option.label as FactionName];
  return (
    <Group gap="xs" align="center">
      {iconSrc ? (
        <Image src={iconSrc} alt="" w={18} h={18} fit="contain" />
      ) : null}
      <Text size="sm">{option.label}</Text>
    </Group>
  );
}

/* ── Single team slot with overdrive toggle ── */

export function SlotCard({
  index,
  charName,
  char,
  overdriveOrder,
  note,
  onOverdriveOrderChange,
  onRemove,
  onNoteChange,
  isValidDrop,
  isDragging,
}: {
  index: number;
  charName: string | null;
  char: Character | undefined;
  overdriveOrder: number | null;
  note: string;
  onOverdriveOrderChange: (value: number | null) => void;
  onRemove: () => void;
  onNoteChange: (note: string) => void;
  isValidDrop: boolean;
  isDragging: boolean;
}) {
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}` });

  let borderColor: string | undefined;
  if (isOver) {
    borderColor = isValidDrop
      ? 'var(--mantine-color-orange-5)'
      : 'var(--mantine-color-red-5)';
  } else if (isDragging && !isValidDrop && !charName) {
    borderColor = 'var(--mantine-color-red-3)';
  }

  return (
    <Paper
      ref={setNodeRef}
      p={isMobile ? 4 : 'xs'}
      radius="md"
      withBorder
      {...getCardHoverProps({
        style: {
          borderColor,
          borderWidth:
            isOver || (isDragging && !isValidDrop && !charName) ? 2 : undefined,
          opacity: isDragging && !isValidDrop && !charName ? 0.45 : 1,
          transition: `border-color ${TRANSITION.FAST} ${TRANSITION.EASE}, opacity ${TRANSITION.FAST} ${TRANSITION.EASE}`,
          minHeight: isMobile ? 100 : 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
      })}
    >
      {charName ? (
        isMobile ? (
          // Mobile: header row for controls, smaller portrait, single OD tap-to-cycle
          <Stack gap={4} align="center" style={{ width: '100%' }}>
            <Group
              justify="space-between"
              align="center"
              gap={0}
              style={{ width: '100%' }}
            >
              {overdriveOrder != null ? (
                <Badge size="xs" circle variant="filled" color="orange">
                  {overdriveOrder}
                </Badge>
              ) : (
                <Box style={{ width: 16 }} />
              )}
              <ActionIcon
                size="xs"
                variant="filled"
                color="red"
                radius="xl"
                onClick={onRemove}
                aria-label="Remove from team"
              >
                <IoClose size={12} />
              </ActionIcon>
            </Group>
            <Box style={{ position: 'relative', display: 'inline-block' }}>
              <DraggableCharCard name={charName} char={char} size={56} />
              <CharacterNoteButton
                value={note}
                onCommit={onNoteChange}
                placeholder="Add note..."
                style={{ position: 'absolute', top: 2, right: 2 }}
              />
            </Box>
            <Group gap={4} wrap="nowrap" style={{ width: '100%' }}>
              <Button
                size="compact-xs"
                variant={overdriveOrder != null ? 'filled' : 'light'}
                color="orange"
                leftSection={
                  overdriveOrder != null ? <IoCheckmark size={12} /> : undefined
                }
                onClick={() =>
                  onOverdriveOrderChange(
                    overdriveOrder == null
                      ? 1
                      : overdriveOrder >= 6
                        ? 1
                        : overdriveOrder + 1
                  )
                }
                style={{ flex: 1 }}
              >
                {overdriveOrder != null ? `OD ${overdriveOrder}` : 'OD'}
              </Button>
              {overdriveOrder != null && (
                <ActionIcon
                  size="xs"
                  variant="light"
                  color="red"
                  onClick={() => onOverdriveOrderChange(null)}
                  aria-label="Disable overdrive"
                >
                  <IoClose size={10} />
                </ActionIcon>
              )}
            </Group>
          </Stack>
        ) : (
          // Desktop: existing layout with absolute-positioned controls
          <>
            <ActionIcon
              size="xs"
              variant="filled"
              color="red"
              radius="xl"
              style={{ position: 'absolute', top: 4, right: 4 }}
              onClick={onRemove}
              aria-label="Remove from team"
            >
              <IoClose size={12} />
            </ActionIcon>
            {overdriveOrder != null && (
              <Badge
                size="sm"
                circle
                variant="filled"
                color="orange"
                style={{ position: 'absolute', top: 4, left: 4 }}
              >
                {overdriveOrder}
              </Badge>
            )}
            <Stack gap={4} align="center">
              <Box style={{ position: 'relative', display: 'inline-block' }}>
                <DraggableCharCard name={charName} char={char} />
                <CharacterNoteButton
                  value={note}
                  onCommit={onNoteChange}
                  placeholder="Add note..."
                  style={{ position: 'absolute', top: 2, right: 2 }}
                />
              </Box>
              <Group gap={6} align="center" wrap="nowrap">
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="orange"
                  onClick={() =>
                    onOverdriveOrderChange(
                      overdriveOrder == null ? 1 : overdriveOrder - 1
                    )
                  }
                  aria-label="Decrease overdrive order"
                >
                  <IoRemove size={12} />
                </ActionIcon>
                <Button
                  size="compact-xs"
                  variant={overdriveOrder != null ? 'filled' : 'light'}
                  color="orange"
                  leftSection={
                    overdriveOrder != null ? (
                      <IoCheckmark size={12} />
                    ) : undefined
                  }
                  onClick={() =>
                    onOverdriveOrderChange(overdriveOrder != null ? null : 1)
                  }
                >
                  {overdriveOrder != null ? `OD ${overdriveOrder}` : 'OD Off'}
                </Button>
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="orange"
                  onClick={() =>
                    onOverdriveOrderChange(
                      overdriveOrder == null ? 1 : overdriveOrder + 1
                    )
                  }
                  aria-label="Increase overdrive order"
                >
                  <IoAdd size={12} />
                </ActionIcon>
              </Group>
            </Stack>
          </>
        )
      ) : (
        <Text size="xs" c="dimmed" ta="center" lh={1.4}>
          Drop here
        </Text>
      )}
    </Paper>
  );
}

/* ── Team slots grid (3×3) ── */

export function SlotsGrid({
  slots,
  overdriveOrderBySlot,
  slotNotes,
  charMap,
  onOverdriveOrderChange,
  onRemove,
  onNoteChange,
  activeId,
}: {
  slots: (string | null)[];
  overdriveOrderBySlot: Map<number, number>;
  slotNotes: string[];
  charMap: Map<string, Character>;
  onOverdriveOrderChange: (index: number, value: number | null) => void;
  onRemove: (index: number) => void;
  onNoteChange: (index: number, note: string) => void;
  activeId: string | null;
}) {
  // Determine valid rows for the character being dragged
  const activeChar = activeId ? charMap.get(activeId) : null;
  const activeValidRows = activeChar
    ? getValidRows(activeChar.character_class)
    : null;

  const isDragging = !!activeId;

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={600}>
          Team Grid
        </Text>
        <Text size="xs" c="dimmed">
          Drag to position · Click to add · Set OD order directly (1-6)
        </Text>
      </Group>

      <Box>
        {[0, 1, 2].map((row) => {
          const isValidDrop = activeValidRows
            ? activeValidRows.includes(row)
            : true;
          return (
            <Group key={row} gap="xs" align="stretch" mb="xs" wrap="nowrap">
              {/* Row indicator */}
              <Tooltip label={ROW_CLASS_HINTS[row]} withArrow position="right">
                <Box
                  style={{
                    width: 24,
                    minWidth: 24,
                    flexShrink: 0,
                    borderRadius: 'var(--mantine-radius-sm)',
                    background: isDragging
                      ? `var(--mantine-color-${isValidDrop ? 'green' : 'red'}-5)`
                      : `var(--mantine-color-${ROW_COLORS[row]}-5)`,
                    transition: `background ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                    color: 'var(--mantine-color-white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    userSelect: 'none',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      transform: 'scaleY(1.2)',
                      transformOrigin: 'center',
                    }}
                  >
                    {ROW_STRIP_LABELS[row]}
                  </span>
                </Box>
              </Tooltip>

              {/* 3 slots for this row */}
              <SimpleGrid cols={3} spacing="xs" style={{ flex: 1 }}>
                {[0, 1, 2].map((col) => {
                  const idx = row * 3 + col;
                  return (
                    <SlotCard
                      key={idx}
                      index={idx}
                      charName={slots[idx]}
                      char={slots[idx] ? charMap.get(slots[idx]!) : undefined}
                      overdriveOrder={overdriveOrderBySlot.get(idx) ?? null}
                      note={slotNotes[idx]}
                      onOverdriveOrderChange={(value) =>
                        onOverdriveOrderChange(idx, value)
                      }
                      onRemove={() => onRemove(idx)}
                      onNoteChange={(note) => onNoteChange(idx, note)}
                      isValidDrop={isValidDrop}
                      isDragging={isDragging}
                    />
                  );
                })}
              </SimpleGrid>
            </Group>
          );
        })}
      </Box>
    </Stack>
  );
}

/* ── Available pool ── */

export function AvailablePool({
  children,
  filterHeader,
  paginationControl,
}: {
  children: React.ReactNode;
  filterHeader?: React.ReactNode;
  paginationControl?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'available' });

  return (
    <Paper
      ref={setNodeRef}
      p="md"
      radius="md"
      withBorder
      {...getCardHoverProps({
        style: {
          borderColor: isOver ? 'var(--mantine-color-blue-5)' : undefined,
          borderWidth: isOver ? 2 : undefined,
          transition: `border-color ${TRANSITION.FAST} ${TRANSITION.EASE}`,
        },
      })}
    >
      <Stack gap="sm">
        {filterHeader || (
          <Text size="sm" fw={600} c="dimmed">
            Available Characters
          </Text>
        )}
        <SimpleGrid
          cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
          spacing={CHARACTER_GRID_SPACING}
          style={{ minHeight: 40 }}
        >
          {children}
        </SimpleGrid>
        {paginationControl}
      </Stack>
    </Paper>
  );
}

/* ── Bench pool ── */

export function BenchDropItem({
  name,
  charMap,
  note,
  onNoteChange,
}: {
  name: string;
  charMap: Map<string, Character>;
  note: string;
  onNoteChange: (name: string, note: string) => void;
}) {
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const { setNodeRef: setItemNodeRef, isOver: isOverItem } = useDroppable({
    id: `bench-item-${name}`,
  });

  return (
    <Box
      ref={setItemNodeRef}
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        outline: isOverItem ? '2px solid var(--mantine-color-blue-5)' : 'none',
        outlineOffset: 2,
        transition: `outline-color ${TRANSITION.FAST} ${TRANSITION.EASE}`,
      }}
    >
      <Stack gap={4} align="center">
        <Box style={{ position: 'relative', display: 'inline-block' }}>
          <DraggableCharCard
            name={name}
            char={charMap.get(name)}
            size={isMobile ? 56 : undefined}
          />
          <CharacterNoteButton
            value={note}
            onCommit={(nextNote) => onNoteChange(name, nextNote)}
            placeholder="Add note..."
            style={{ position: 'absolute', top: 2, right: 2 }}
          />
        </Box>
      </Stack>
    </Box>
  );
}

export function BenchPool({
  bench,
  charMap,
  benchNotes,
  onBenchNoteChange,
}: {
  bench: string[];
  charMap: Map<string, Character>;
  benchNotes: Record<string, string>;
  onBenchNoteChange: (name: string, note: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bench' });

  return (
    <Paper
      ref={setNodeRef}
      p="md"
      radius="md"
      withBorder
      {...getCardHoverProps({
        style: {
          borderColor: isOver ? 'var(--mantine-color-blue-5)' : undefined,
          borderWidth: isOver ? 2 : undefined,
          transition: `border-color ${TRANSITION.FAST} ${TRANSITION.EASE}`,
        },
      })}
    >
      <Stack gap="sm">
        <SimpleGrid
          cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
          spacing={CHARACTER_GRID_SPACING}
          style={{ minHeight: 72 }}
        >
          {bench.length > 0 ? (
            bench.map((name) => (
              <BenchDropItem
                key={name}
                name={name}
                charMap={charMap}
                note={benchNotes[name] || ''}
                onNoteChange={onBenchNoteChange}
              />
            ))
          ) : (
            <Box
              style={{
                gridColumn: '1 / -1',
                minHeight: 72,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <Text size="xs" c="dimmed">
                Drag characters here to add to bench
              </Text>
            </Box>
          )}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
