import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  CopyButton,
  Group,
  Image,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  IoAdd,
  IoCheckmark,
  IoClipboardOutline,
  IoClose,
  IoCopy,
  IoOpenOutline,
  IoRemove,
  IoTrash,
} from 'react-icons/io5';
import { FACTION_ICON_MAP } from '../../assets/faction';
import { getWyrmspellIcon } from '../../assets/wyrmspell';
import { FACTION_COLOR, FACTION_NAMES } from '../../constants/colors';
import {
  CONTENT_TYPE_OPTIONS,
  DEFAULT_CONTENT_TYPE,
  normalizeContentType,
  type ContentType,
} from '../../constants/content-types';
import {
  buildEmptyIssueBody,
  GITHUB_REPO_URL,
  MAX_GITHUB_ISSUE_URL_LENGTH,
} from '../../constants/github';
import { getCardHoverProps } from '../../constants/styles';
import {
  BREAKPOINTS,
  CHARACTER_GRID_SPACING,
  STORAGE_KEY,
  TRANSITION,
} from '../../constants/ui';
import type { Character, CharacterClass } from '../../types/character';
import type { FactionName } from '../../types/faction';
import type { Team, TeamMember, TeamWyrmspells } from '../../types/team';
import type { Wyrmspell } from '../../types/wyrmspell';
import { insertUniqueBefore, removeItem } from '../../utils/dnd-list';
import { computeTeamSynergy } from '../../utils/team-synergy';
import { showWarningToast } from '../../utils/toast';
import CharacterCard from '../character/CharacterCard';
import FilterableCharacterPool from '../character/FilterableCharacterPool';
import CharacterNoteButton from './CharacterNoteButton';
import TeamSynergyAssistant from './TeamSynergyAssistant';

const MAX_ROSTER_SIZE = 6;
const GRID_SIZE = 9; // 3×3 grid

const ROW_COLORS = ['red', 'orange', 'blue'] as const;
const ROW_STRIP_LABELS = ['Front', 'Middle', 'Back'] as const;
const ROW_LABELS = ['the front row', 'the middle row', 'the back row'] as const;
const ROW_CLASS_HINTS = [
  'Guardian · Warrior · Assassin',
  'Warrior · Priest · Mage · Archer · Assassin',
  'Priest · Mage · Archer · Assassin',
] as const;

function getValidRows(charClass: CharacterClass): number[] {
  switch (charClass) {
    case 'Guardian':
      return [0];
    case 'Warrior':
      return [0, 1];
    case 'Assassin':
      return [0, 1, 2];
    case 'Priest':
      return [1, 2];
    case 'Mage':
      return [1, 2];
    case 'Archer':
      return [1, 2];
    default:
      return [0, 1, 2];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTeamMemberLike(value: unknown): value is TeamMember {
  return isRecord(value) && typeof value.character_name === 'string';
}

function getPastedTeamPatch(value: unknown): Partial<Team> | null {
  if (Array.isArray(value)) {
    if (value.every(isTeamMemberLike)) {
      return { members: value };
    }

    if (value.length === 1 && isRecord(value[0])) {
      return value[0] as Partial<Team>;
    }

    return null;
  }

  if (isRecord(value)) {
    return value as Partial<Team>;
  }

  return null;
}

function normalizeTeamFromPartial(
  partial: Partial<Team>,
  fallback: Team
): Team {
  const normalizedMembers = Array.isArray(partial.members)
    ? partial.members.filter(isTeamMemberLike).map((member) => {
        const hasValidPosition =
          typeof member.position?.row === 'number' &&
          typeof member.position?.col === 'number';
        return {
          character_name: member.character_name,
          overdrive_order:
            typeof member.overdrive_order === 'number'
              ? member.overdrive_order
              : null,
          ...(typeof member.note === 'string' && member.note
            ? { note: member.note }
            : {}),
          ...(hasValidPosition
            ? {
                position: {
                  row: member.position!.row,
                  col: member.position!.col,
                },
              }
            : {}),
        };
      })
    : fallback.members;

  const normalizedBench = Array.isArray(partial.bench)
    ? partial.bench.filter(
        (benchName): benchName is string => typeof benchName === 'string'
      )
    : fallback.bench;

  const normalizedBenchNotes = isRecord(partial.bench_notes)
    ? Object.fromEntries(
        Object.entries(partial.bench_notes)
          .filter(([characterName, note]) => {
            return (
              typeof characterName === 'string' && typeof note === 'string'
            );
          })
          .map(([characterName, note]) => [characterName, note])
      )
    : fallback.bench_notes;

  const normalizedWyrmspells = isRecord(partial.wyrmspells)
    ? {
        ...(typeof partial.wyrmspells.breach === 'string'
          ? { breach: partial.wyrmspells.breach }
          : {}),
        ...(typeof partial.wyrmspells.refuge === 'string'
          ? { refuge: partial.wyrmspells.refuge }
          : {}),
        ...(typeof partial.wyrmspells.wildcry === 'string'
          ? { wildcry: partial.wyrmspells.wildcry }
          : {}),
        ...(typeof partial.wyrmspells.dragons_call === 'string'
          ? { dragons_call: partial.wyrmspells.dragons_call }
          : {}),
      }
    : fallback.wyrmspells;

  return {
    ...fallback,
    ...(typeof partial.name === 'string' ? { name: partial.name } : {}),
    ...(typeof partial.author === 'string' ? { author: partial.author } : {}),
    ...(typeof partial.description === 'string'
      ? { description: partial.description }
      : {}),
    content_type: normalizeContentType(
      partial.content_type,
      fallback.content_type
    ),
    faction:
      typeof partial.faction === 'string'
        ? (partial.faction as FactionName)
        : fallback.faction,
    members: normalizedMembers,
    ...(normalizedBench ? { bench: normalizedBench } : {}),
    ...(normalizedBenchNotes ? { bench_notes: normalizedBenchNotes } : {}),
    ...(normalizedWyrmspells ? { wyrmspells: normalizedWyrmspells } : {}),
    last_updated:
      typeof partial.last_updated === 'number'
        ? partial.last_updated
        : fallback.last_updated,
  };
}

interface TeamBuilderProps {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: Team | null;
  wyrmspells?: Wyrmspell[];
}

const INPUT_COMMIT_DELAY_MS = 150;

const TeamMetaFields = memo(function TeamMetaFields({
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

function DraggableCharCard({
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

  const style: React.CSSProperties = overlay
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

function renderWyrmspellOption({ option }: { option: { label: string } }) {
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

function renderFactionOption({ option }: { option: { label: string } }) {
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

function SlotCard({
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

function SlotsGrid({
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

function AvailablePool({
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

function BenchDropItem({
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

function BenchPool({
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

/* ── Main TeamBuilder ── */

export default function TeamBuilder({
  characters,
  charMap,
  initialData,
  wyrmspells = [],
}: TeamBuilderProps) {
  // Team grid: 3×3 = 9 slots (indexed row*3+col)
  const [slots, setSlots] = useState<(string | null)[]>(
    Array(GRID_SIZE).fill(null)
  );
  // Ordered slot indexes representing overdrive order (index 0 => OD 1)
  const [overdriveSequence, setOverdriveSequence] = useState<number[]>([]);
  // Track bench characters (team-level)
  const [bench, setBench] = useState<string[]>([]);
  // Track notes for bench characters
  const [benchNotes, setBenchNotes] = useState<Record<string, string>>({});
  // Track notes for each slot
  const [slotNotes, setSlotNotes] = useState<string[]>(
    Array(GRID_SIZE).fill('')
  );
  // Track wyrmspells
  const [teamWyrmspells, setTeamWyrmspells] = useState<TeamWyrmspells>({});
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [contentType, setContentType] =
    useState<ContentType>(DEFAULT_CONTENT_TYPE);
  const [description, setDescription] = useState('');
  const [faction, setFaction] = useState<FactionName | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pasteModalOpened, { open: openPasteModal, close: closePasteModal }] =
    useDisclosure(false);
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [draftHydrated, setDraftHydrated] = useState(false);
  const handleContentTypeChange = useCallback((value: string | null) => {
    setContentType(normalizeContentType(value, DEFAULT_CONTENT_TYPE));
  }, []);
  const handleFactionChange = useCallback((value: string | null) => {
    setFaction(value as FactionName | null);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    })
  );

  function loadFromTeam(data: Team) {
    setName(data.name || '');
    setAuthor(data.author || '');
    setContentType(normalizeContentType(data.content_type));
    setDescription(data.description || '');
    setFaction(data.faction || null);

    const newSlots: (string | null)[] = Array(GRID_SIZE).fill(null);
    const parsedOverdriveEntries: Array<{
      slotIndex: number;
      order: number;
    }> = [];
    const newNotes: string[] = Array(GRID_SIZE).fill('');

    for (const member of data.members) {
      let idx: number;
      if (member.position) {
        idx = member.position.row * 3 + member.position.col;
      } else {
        idx = newSlots.findIndex((slotValue) => slotValue === null);
      }
      if (idx >= 0 && idx < GRID_SIZE && newSlots[idx] === null) {
        newSlots[idx] = member.character_name;
        if (member.overdrive_order != null) {
          parsedOverdriveEntries.push({
            slotIndex: idx,
            order: member.overdrive_order,
          });
        }
        newNotes[idx] = member.note || '';
      }
    }

    parsedOverdriveEntries.sort((a, b) => a.order - b.order);
    const normalizedOverdriveSequence = parsedOverdriveEntries
      .map((entry) => entry.slotIndex)
      .slice(0, MAX_ROSTER_SIZE);

    setTeamWyrmspells(data.wyrmspells || {});
    setBench(data.bench || []);
    setBenchNotes(data.bench_notes || {});
    setSlots(newSlots);
    setOverdriveSequence(normalizedOverdriveSequence);
    setSlotNotes(newNotes);
  }

  function handlePasteApply() {
    try {
      const parsed = JSON.parse(pasteText) as unknown;
      const partialTeam = getPastedTeamPatch(parsed);
      if (!partialTeam) {
        setPasteError(
          'Invalid team JSON: expected an object or a members array.'
        );
        return;
      }

      const currentTeam = JSON.parse(json) as Team;
      const mergedTeam = normalizeTeamFromPartial(partialTeam, currentTeam);
      loadFromTeam(mergedTeam);
      closePasteModal();
      setPasteText('');
      setPasteError('');
    } catch {
      setPasteError(
        'Could not parse JSON. Paste a JSON object, a one-item team array, or a members array.'
      );
    }
  }

  useEffect(() => {
    if (initialData) {
      queueMicrotask(() => {
        loadFromTeam(initialData);
        setDraftHydrated(true);
      });
      return;
    }

    if (typeof window === 'undefined') {
      setDraftHydrated(true);
      return;
    }

    const storedDraft = window.localStorage.getItem(
      STORAGE_KEY.TEAMS_BUILDER_DRAFT
    );
    if (storedDraft) {
      try {
        const parsedDraft = JSON.parse(storedDraft) as Team;
        if (Array.isArray(parsedDraft.members)) {
          loadFromTeam(parsedDraft);
        } else {
          window.localStorage.removeItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT);
      }
    }

    setDraftHydrated(true);
  }, [initialData]);

  const deferredName = useDeferredValue(name);
  const deferredAuthor = useDeferredValue(author);
  const deferredDescription = useDeferredValue(description);
  const deferredContentType = useDeferredValue(contentType);
  const deferredFaction = useDeferredValue(faction);

  const overdriveOrderBySlot = useMemo(() => {
    const map = new Map<number, number>();
    overdriveSequence.forEach((slotIndex, orderIdx) => {
      if (slots[slotIndex]) {
        map.set(slotIndex, orderIdx + 1);
      }
    });
    return map;
  }, [overdriveSequence, slots]);

  const factionColor = faction ? FACTION_COLOR[faction] : 'blue';

  // Set of all names currently on the team
  const teamNames = useMemo(() => {
    const s = new Set<string>();
    for (const n of slots) {
      if (n) s.add(n);
    }
    return s;
  }, [slots]);

  const teamSize = teamNames.size;

  const json = useMemo(() => {
    const members: TeamMember[] = [];
    let overdriveOrder = 1;

    // Add members with overdrive first (in grid order, row by row)
    for (const slotIndex of overdriveSequence) {
      const n = slots[slotIndex];
      if (n) {
        members.push({
          character_name: n,
          overdrive_order: overdriveOrder++,
          position: { row: Math.floor(slotIndex / 3), col: slotIndex % 3 },
          ...(slotNotes[slotIndex].trim()
            ? { note: slotNotes[slotIndex].trim() }
            : {}),
        });
      }
    }

    // Then add members without overdrive
    for (let i = 0; i < GRID_SIZE; i++) {
      const n = slots[i];
      if (n && !overdriveOrderBySlot.has(i)) {
        members.push({
          character_name: n,
          overdrive_order: null,
          position: { row: Math.floor(i / 3), col: i % 3 },
          ...(slotNotes[i].trim() ? { note: slotNotes[i].trim() } : {}),
        });
      }
    }

    const result: Team = {
      name: deferredName || 'My Team',
      author: deferredAuthor || 'Anonymous',
      content_type: deferredContentType,
      description: deferredDescription,
      faction: deferredFaction || 'Elemental Echo',
      members,
      last_updated: 0,
    };

    if (bench.length > 0) {
      result.bench = bench;
    }

    const normalizedBenchNotes = Object.fromEntries(
      Object.entries(benchNotes).filter(
        ([name, note]) => bench.includes(name) && note.trim().length > 0
      )
    );
    if (Object.keys(normalizedBenchNotes).length > 0) {
      result.bench_notes = normalizedBenchNotes;
    }

    // Add wyrmspells if any are selected
    const hasWyrmspells =
      teamWyrmspells.breach ||
      teamWyrmspells.refuge ||
      teamWyrmspells.wildcry ||
      teamWyrmspells.dragons_call;
    if (hasWyrmspells) {
      result.wyrmspells = teamWyrmspells;
    }

    return JSON.stringify(result, null, 2);
  }, [
    slots,
    overdriveSequence,
    overdriveOrderBySlot,
    bench,
    benchNotes,
    slotNotes,
    teamWyrmspells,
    deferredName,
    deferredAuthor,
    deferredContentType,
    deferredDescription,
    deferredFaction,
  ]);

  useEffect(() => {
    if (!draftHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT, json);
  }, [draftHydrated, json]);

  const usedNames = useMemo(() => {
    const s = new Set<string>();
    for (const n of slots) if (n) s.add(n);
    for (const n of bench) s.add(n);
    return s;
  }, [slots, bench]);

  const availableCharacters = useMemo(() => {
    return characters.filter((c) => !usedNames.has(c.name));
  }, [characters, usedNames]);

  const breachWyrmspellOptions = useMemo(
    () =>
      wyrmspells
        .filter((w) => w.type === 'Breach')
        .map((w) => ({ value: w.name, label: w.name })),
    [wyrmspells]
  );

  const refugeWyrmspellOptions = useMemo(
    () =>
      wyrmspells
        .filter((w) => w.type === 'Refuge')
        .map((w) => ({ value: w.name, label: w.name })),
    [wyrmspells]
  );

  const wildcryWyrmspellOptions = useMemo(
    () =>
      wyrmspells
        .filter((w) => w.type === 'Wildcry')
        .map((w) => ({ value: w.name, label: w.name })),
    [wyrmspells]
  );

  const dragonsCallWyrmspellOptions = useMemo(
    () =>
      wyrmspells
        .filter((w) => w.type === "Dragon's Call")
        .map((w) => ({ value: w.name, label: w.name })),
    [wyrmspells]
  );

  const synergy = useMemo(() => {
    const roster = slots
      .filter((slotName): slotName is string => Boolean(slotName))
      .map((slotName) => charMap.get(slotName))
      .filter((c): c is Character => Boolean(c));

    return computeTeamSynergy({
      roster,
      faction,
      contentType,
      overdriveCount: overdriveSequence.length,
      teamWyrmspells,
      wyrmspells,
    });
  }, [
    slots,
    charMap,
    faction,
    contentType,
    overdriveSequence,
    teamWyrmspells,
    wyrmspells,
  ]);

  const teamIssueQuery = useMemo(() => {
    const body = `**Paste your JSON below:**\n\n\`\`\`json\n${json}\n\`\`\`\n`;
    return new URLSearchParams({
      title: '[Team] New team suggestion',
      body,
    }).toString();
  }, [json]);

  const teamIssueUrl = useMemo(() => {
    const url = `${GITHUB_REPO_URL}/issues/new?${teamIssueQuery}`;
    if (url.length > MAX_GITHUB_ISSUE_URL_LENGTH) return null;
    return url;
  }, [teamIssueQuery]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function removeOverdriveSlot(slotIndex: number) {
    setOverdriveSequence((prev) => prev.filter((idx) => idx !== slotIndex));
  }

  function swapOverdriveSlots(firstIndex: number, secondIndex: number) {
    setOverdriveSequence((prev) =>
      prev.map((idx) => {
        if (idx === firstIndex) return secondIndex;
        if (idx === secondIndex) return firstIndex;
        return idx;
      })
    );
  }

  function moveOverdriveSlot(fromIndex: number, toIndex: number) {
    setOverdriveSequence((prev) =>
      prev.map((idx) => (idx === fromIndex ? toIndex : idx))
    );
  }

  function isValidPlacement(charName: string, slotIndex: number): boolean {
    const char = charMap.get(charName);
    if (!char) return true;
    const row = Math.floor(slotIndex / 3);
    return getValidRows(char.character_class).includes(row);
  }

  function notifyInvalidPlacement(charName: string, slotIndex: number) {
    const char = charMap.get(charName);
    const targetRow = Math.floor(slotIndex / 3);
    const targetRowLabel = ROW_LABELS[targetRow] || 'that row';

    showWarningToast({
      id: 'teambuilder-invalid-placement',
      title: 'Invalid slot placement',
      message: char
        ? `${charName} (${char.character_class}) cannot be placed in ${targetRowLabel}.`
        : `${charName} cannot be placed in ${targetRowLabel}.`,
      autoClose: 2400,
    });
  }

  function findValidEmptySlotForCharacter(charName: string): number {
    const char = charMap.get(charName);
    const validRows = char ? getValidRows(char.character_class) : [0, 1, 2];

    for (const row of validRows) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        if (!slots[idx]) return idx;
      }
    }
    return -1;
  }

  function findCharLocation(
    charName: string
  ):
    | { zone: 'slot'; index: number }
    | { zone: 'bench'; index: number }
    | { zone: 'available' } {
    const slotIdx = slots.indexOf(charName);
    if (slotIdx !== -1) return { zone: 'slot', index: slotIdx };
    const benchIdx = bench.indexOf(charName);
    if (benchIdx !== -1) return { zone: 'bench', index: benchIdx };
    return { zone: 'available' };
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const charName = event.active.id as string;
    const overId = event.over?.id as string | undefined;
    if (!overId) return;

    const from = findCharLocation(charName);

    // Determine target
    const isSlotTarget = overId.startsWith('slot-');
    const targetSlotIndex = isSlotTarget
      ? parseInt(overId.replace('slot-', ''), 10)
      : -1;

    // ── Drop onto a slot ──
    if (isSlotTarget) {
      if (!isValidPlacement(charName, targetSlotIndex)) {
        notifyInvalidPlacement(charName, targetSlotIndex);
        return;
      }
      const occupant = slots[targetSlotIndex];

      if (from.zone === 'available' || from.zone === 'bench') {
        const incomingNote =
          from.zone === 'bench' ? benchNotes[charName] || '' : '';
        // Available → slot
        if (occupant && teamSize >= MAX_ROSTER_SIZE) {
          // Team full, swap occupant back to available — clear occupant's notes
          setSlots((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = charName;
            return next;
          });
          removeOverdriveSlot(targetSlotIndex);
          setSlotNotes((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = incomingNote;
            return next;
          });
        } else if (occupant) {
          // Slot occupied but team not full — move occupant (with its notes) to empty slot
          const emptyIdx = findValidEmptySlotForCharacter(occupant);
          if (emptyIdx !== -1) {
            setSlots((prev) => {
              const next = [...prev];
              next[targetSlotIndex] = charName;
              next[emptyIdx] = occupant;
              return next;
            });
            moveOverdriveSlot(targetSlotIndex, emptyIdx);
            setSlotNotes((prev) => {
              const next = [...prev];
              next[emptyIdx] = next[targetSlotIndex]; // Move occupant's note
              next[targetSlotIndex] = incomingNote;
              return next;
            });
          }
        } else {
          // Slot empty — check team size
          if (teamSize >= MAX_ROSTER_SIZE) return;
          setSlots((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = charName;
            return next;
          });
          removeOverdriveSlot(targetSlotIndex);
          setSlotNotes((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = incomingNote;
            return next;
          });
        }

        if (from.zone === 'bench') {
          setBench((prev) => removeItem(prev, charName));
          setBenchNotes((prev) => {
            const next = { ...prev };
            delete next[charName];
            return next;
          });
        }
      } else if (from.zone === 'slot') {
        // Slot → different slot: swap
        const fromIndex = from.index;
        if (fromIndex === targetSlotIndex) return;
        if (occupant && !isValidPlacement(occupant, fromIndex)) {
          notifyInvalidPlacement(occupant, fromIndex);
          return;
        }
        setSlots((prev) => {
          const next = [...prev];
          next[fromIndex] = occupant;
          next[targetSlotIndex] = charName;
          return next;
        });
        swapOverdriveSlots(fromIndex, targetSlotIndex);
        setSlotNotes((prev) => {
          const next = [...prev];
          const temp = next[fromIndex];
          next[fromIndex] = next[targetSlotIndex];
          next[targetSlotIndex] = temp;
          return next;
        });
      }
      return;
    }

    // ── Drop onto available pool ──
    if (overId === 'available') {
      if (from.zone === 'slot') {
        setSlots((prev) => {
          const next = [...prev];
          next[from.index] = null;
          return next;
        });
        removeOverdriveSlot(from.index);
        setSlotNotes((prev) => {
          const next = [...prev];
          next[from.index] = '';
          return next;
        });
      } else if (from.zone === 'bench') {
        setBench((prev) => removeItem(prev, charName));
        setBenchNotes((prev) => {
          const next = { ...prev };
          delete next[charName];
          return next;
        });
      }
      return;
    }

    // ── Drop onto a bench character (insert/reorder) ──
    if (overId.startsWith('bench-item-')) {
      const targetName = overId.replace('bench-item-', '');
      if (!bench.includes(targetName)) return;

      if (from.zone === 'bench') {
        if (charName === targetName) return;
        setBench((prev) => {
          const fromIndex = prev.indexOf(charName);
          const toIndex = prev.indexOf(targetName);
          if (fromIndex === -1 || toIndex === -1) return prev;
          const next = [...prev];
          [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
          return next;
        });
        return;
      }

      if (from.zone === 'slot') {
        const movedSlotNote = slotNotes[from.index];
        setSlots((prev) => {
          const next = [...prev];
          next[from.index] = null;
          return next;
        });
        removeOverdriveSlot(from.index);
        setSlotNotes((prev) => {
          const next = [...prev];
          next[from.index] = '';
          return next;
        });
        setBenchNotes((prev) => ({
          ...prev,
          [charName]: prev[charName]?.trim().length
            ? prev[charName]
            : movedSlotNote,
        }));
      }

      if (from.zone === 'available' || from.zone === 'slot') {
        setBench((prev) => insertUniqueBefore(prev, charName, targetName));
        setBenchNotes((prev) => ({
          ...prev,
          [charName]: prev[charName] || '',
        }));
      }

      return;
    }

    // ── Drop onto bench ──
    if (overId === 'bench') {
      if (from.zone === 'slot') {
        const movedSlotNote = slotNotes[from.index];
        setSlots((prev) => {
          const next = [...prev];
          next[from.index] = null;
          return next;
        });
        removeOverdriveSlot(from.index);
        setSlotNotes((prev) => {
          const next = [...prev];
          next[from.index] = '';
          return next;
        });
        setBenchNotes((prev) => ({
          ...prev,
          [charName]: prev[charName]?.trim().length
            ? prev[charName]
            : movedSlotNote,
        }));
      }

      if (from.zone === 'available' || from.zone === 'slot') {
        setBench((prev) =>
          prev.includes(charName) ? prev : [...prev, charName]
        );
        setBenchNotes((prev) => ({
          ...prev,
          [charName]: prev[charName] || '',
        }));
      }

      return;
    }
  }

  function handleAddToNextSlot(charName: string) {
    if (teamSize >= MAX_ROSTER_SIZE) return;
    const targetIdx = findValidEmptySlotForCharacter(charName);

    if (targetIdx === -1) {
      showWarningToast({
        id: 'teambuilder-no-valid-slot',
        title: 'No valid slot available',
        message: `${charName} has no empty valid row right now. Move someone first.`,
        autoClose: 2400,
      });
      return;
    }

    setSlots((prev) => {
      const next = [...prev];
      next[targetIdx] = charName;
      return next;
    });
    removeOverdriveSlot(targetIdx);
  }

  function handleOverdriveOrderChange(slotIndex: number, value: number | null) {
    if (!slots[slotIndex]) return; // No character in slot
    setOverdriveSequence((prev) => {
      const withoutCurrent = prev.filter((idx) => idx !== slotIndex);

      if (value == null || !Number.isFinite(value)) {
        return withoutCurrent;
      }

      const slotCap = slots.filter(Boolean).length;
      const maxOrder = Math.min(MAX_ROSTER_SIZE, Math.max(1, slotCap));
      const clampedOrder = Math.min(Math.max(Math.round(value), 1), maxOrder);
      const insertAt = clampedOrder - 1;
      const next = [...withoutCurrent];
      next.splice(insertAt, 0, slotIndex);
      return next.slice(0, MAX_ROSTER_SIZE);
    });
  }

  function handleRemoveFromTeam(slotIndex: number) {
    const charName = slots[slotIndex];
    if (!charName) return;
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    removeOverdriveSlot(slotIndex);
    setSlotNotes((prev) => {
      const next = [...prev];
      next[slotIndex] = '';
      return next;
    });
  }

  function handleSlotNoteChange(slotIndex: number, note: string) {
    setSlotNotes((prev) => {
      const next = [...prev];
      next[slotIndex] = note;
      return next;
    });
  }

  function handleBenchNoteChange(charName: string, note: string) {
    setBenchNotes((prev) => ({ ...prev, [charName]: note }));
  }

  function handleSubmitSuggestion() {
    if (!teamIssueUrl) {
      const emptyUrl = `${GITHUB_REPO_URL}/issues/new?${new URLSearchParams({ title: '[Team] New team suggestion', body: buildEmptyIssueBody('team') }).toString()}`;
      window.open(emptyUrl, '_blank');
      showWarningToast({
        title: 'Team JSON is too large',
        message:
          'Please copy the JSON using the Copy JSON button and paste it into the GitHub issue body.',
        autoClose: 8000,
      });
      return;
    }
    window.open(teamIssueUrl, '_blank');
  }

  function handleClear() {
    setSlots(Array(GRID_SIZE).fill(null));
    setOverdriveSequence([]);
    setSlotNotes(Array(GRID_SIZE).fill(''));
    setBench([]);
    setBenchNotes({});
    setTeamWyrmspells({});
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Stack gap="md">
        <TeamMetaFields
          name={name}
          author={author}
          contentType={contentType}
          faction={faction}
          description={description}
          onNameCommit={setName}
          onAuthorCommit={setAuthor}
          onContentTypeChange={handleContentTypeChange}
          onFactionChange={handleFactionChange}
          onDescriptionCommit={setDescription}
        />

        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="xs" wrap="nowrap">
            <CopyButton value={json}>
              {({ copied, copy }) =>
                isMobile ? (
                  <Tooltip label={copied ? 'Copied!' : 'Copy JSON'} withArrow>
                    <ActionIcon
                      variant="light"
                      color={copied ? 'teal' : undefined}
                      onClick={copy}
                    >
                      {copied ? (
                        <IoCheckmark size={16} />
                      ) : (
                        <IoCopy size={16} />
                      )}
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
                    color={copied ? 'teal' : undefined}
                  >
                    {copied ? 'Copied' : 'Copy JSON'}
                  </Button>
                )
              }
            </CopyButton>
            {isMobile ? (
              <Tooltip label="Paste JSON" withArrow>
                <ActionIcon variant="light" onClick={openPasteModal}>
                  <IoClipboardOutline size={16} />
                </ActionIcon>
              </Tooltip>
            ) : (
              <Button
                variant="light"
                size="sm"
                leftSection={<IoClipboardOutline size={16} />}
                onClick={openPasteModal}
              >
                Paste JSON
              </Button>
            )}
          </Group>
          <Group gap="xs" wrap="nowrap">
            {isMobile ? (
              <Tooltip label="Submit Suggestion" withArrow>
                <ActionIcon
                  variant="light"
                  disabled={teamSize === 0}
                  onClick={handleSubmitSuggestion}
                >
                  <IoOpenOutline size={16} />
                </ActionIcon>
              </Tooltip>
            ) : (
              <Button
                variant="light"
                size="sm"
                leftSection={<IoOpenOutline size={16} />}
                onClick={handleSubmitSuggestion}
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
                  disabled={teamSize === 0}
                  onClick={handleClear}
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
                onClick={handleClear}
                disabled={teamSize === 0}
              >
                Clear All
              </Button>
            )}
            <Badge variant="light" color={factionColor} size="lg" radius="sm">
              {teamSize} / {MAX_ROSTER_SIZE}
            </Badge>
          </Group>
        </Group>

        <TeamSynergyAssistant synergy={synergy} />

        <Paper p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={600}>
              Wyrmspells
            </Text>
            <SimpleGrid cols={{ base: 2, xs: 4 }} spacing="sm">
              <Select
                label="Breach"
                placeholder="Select breach wyrmspell"
                data={breachWyrmspellOptions}
                renderOption={renderWyrmspellOption}
                leftSection={(() => {
                  const iconSrc = teamWyrmspells.breach
                    ? getWyrmspellIcon(teamWyrmspells.breach)
                    : undefined;
                  return iconSrc ? (
                    <Image src={iconSrc} alt="" w={16} h={16} fit="contain" />
                  ) : undefined;
                })()}
                value={teamWyrmspells.breach || null}
                onChange={(value) =>
                  setTeamWyrmspells((prev) => ({
                    ...prev,
                    breach: value || undefined,
                  }))
                }
                searchable={breachWyrmspellOptions.length >= 10}
                clearable
              />
              <Select
                label="Refuge"
                placeholder="Select refuge wyrmspell"
                data={refugeWyrmspellOptions}
                renderOption={renderWyrmspellOption}
                leftSection={(() => {
                  const iconSrc = teamWyrmspells.refuge
                    ? getWyrmspellIcon(teamWyrmspells.refuge)
                    : undefined;
                  return iconSrc ? (
                    <Image src={iconSrc} alt="" w={16} h={16} fit="contain" />
                  ) : undefined;
                })()}
                value={teamWyrmspells.refuge || null}
                onChange={(value) =>
                  setTeamWyrmspells((prev) => ({
                    ...prev,
                    refuge: value || undefined,
                  }))
                }
                searchable={refugeWyrmspellOptions.length >= 10}
                clearable
              />
              <Select
                label="Wildcry"
                placeholder="Select wildcry wyrmspell"
                data={wildcryWyrmspellOptions}
                renderOption={renderWyrmspellOption}
                leftSection={(() => {
                  const iconSrc = teamWyrmspells.wildcry
                    ? getWyrmspellIcon(teamWyrmspells.wildcry)
                    : undefined;
                  return iconSrc ? (
                    <Image src={iconSrc} alt="" w={16} h={16} fit="contain" />
                  ) : undefined;
                })()}
                value={teamWyrmspells.wildcry || null}
                onChange={(value) =>
                  setTeamWyrmspells((prev) => ({
                    ...prev,
                    wildcry: value || undefined,
                  }))
                }
                searchable={wildcryWyrmspellOptions.length >= 10}
                clearable
              />
              <Select
                label="Dragon's Call"
                placeholder="Select dragon's call wyrmspell"
                data={dragonsCallWyrmspellOptions}
                renderOption={renderWyrmspellOption}
                leftSection={(() => {
                  const iconSrc = teamWyrmspells.dragons_call
                    ? getWyrmspellIcon(teamWyrmspells.dragons_call)
                    : undefined;
                  return iconSrc ? (
                    <Image src={iconSrc} alt="" w={16} h={16} fit="contain" />
                  ) : undefined;
                })()}
                value={teamWyrmspells.dragons_call || null}
                onChange={(value) =>
                  setTeamWyrmspells((prev) => ({
                    ...prev,
                    dragons_call: value || undefined,
                  }))
                }
                searchable={dragonsCallWyrmspellOptions.length >= 10}
                clearable
              />
            </SimpleGrid>
          </Stack>
        </Paper>

        <SlotsGrid
          slots={slots}
          overdriveOrderBySlot={overdriveOrderBySlot}
          slotNotes={slotNotes}
          charMap={charMap}
          onOverdriveOrderChange={handleOverdriveOrderChange}
          onRemove={handleRemoveFromTeam}
          onNoteChange={handleSlotNoteChange}
          activeId={activeId}
        />

        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Bench
          </Text>
          <BenchPool
            bench={bench}
            charMap={charMap}
            benchNotes={benchNotes}
            onBenchNoteChange={handleBenchNoteChange}
          />
        </Stack>

        <FilterableCharacterPool characters={availableCharacters}>
          {(filtered, filterHeader, paginationControl) => (
            <AvailablePool
              filterHeader={filterHeader}
              paginationControl={paginationControl}
            >
              {filtered.map((c) => (
                <DraggableCharCard
                  key={c.name}
                  name={c.name}
                  char={c}
                  size={isMobile ? 56 : undefined}
                  onClick={() => handleAddToNextSlot(c.name)}
                />
              ))}
            </AvailablePool>
          )}
        </FilterableCharacterPool>
      </Stack>

      {typeof document !== 'undefined'
        ? createPortal(
            <DragOverlay dropAnimation={null}>
              {activeId ? (
                <div style={{ cursor: 'grabbing' }}>
                  <CharacterCard
                    name={activeId}
                    quality={charMap.get(activeId)?.quality}
                    disableLink
                  />
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )
        : null}

      <Modal
        opened={pasteModalOpened}
        onClose={() => {
          closePasteModal();
          setPasteText('');
          setPasteError('');
        }}
        title="Paste Team JSON"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Paste a team JSON object below to load it into the builder.
          </Text>
          <Textarea
            placeholder={'{\n  "name": "...",\n  "members": [...]\n}'}
            value={pasteText}
            onChange={(e) => {
              setPasteText(e.currentTarget.value);
              setPasteError('');
            }}
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
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                closePasteModal();
                setPasteText('');
                setPasteError('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePasteApply} disabled={!pasteText.trim()}>
              Apply
            </Button>
          </Group>
        </Stack>
      </Modal>
    </DndContext>
  );
}
