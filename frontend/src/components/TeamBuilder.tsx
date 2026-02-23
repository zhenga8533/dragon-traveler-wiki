import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  ActionIcon,
  Badge,
  Button,
  CopyButton,
  Group,
  Image,
  Modal,
  MultiSelect,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IoCheckmark,
  IoClose,
  IoCopy,
  IoOpenOutline,
  IoSettings,
  IoTrash,
} from 'react-icons/io5';
import { getPortrait } from '../assets/character';
import { FACTION_ICON_MAP } from '../assets/faction';
import { getWyrmspellIcon } from '../assets/wyrmspell';
import {
  buildEmptyIssueBody,
  GITHUB_REPO_URL,
  MAX_GITHUB_ISSUE_URL_LENGTH,
} from '../constants';
import { FACTION_COLOR } from '../constants/colors';
import { CHARACTER_GRID_SPACING } from '../constants/ui';
import type { Character } from '../types/character';
import type { FactionName } from '../types/faction';
import type { Team, TeamMember, TeamWyrmspells } from '../types/team';
import type { Wyrmspell } from '../types/wyrmspell';
import CharacterCard from './CharacterCard';
import FilterableCharacterPool from './FilterableCharacterPool';

const MAX_ROSTER_SIZE = 6;
const SLOT_COUNT = 6;

const FACTIONS: FactionName[] = [
  'Elemental Echo',
  'Wild Spirit',
  'Arcane Wisdom',
  'Sanctum Glory',
  'Otherworld Return',
  'Illusion Veil',
];

interface TeamBuilderProps {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: Team | null;
  wyrmspells?: Wyrmspell[];
}

/* ── Draggable portrait (used in available pool, bench, slots, and overlay) ── */

function DraggableCharCard({
  name,
  char,
  overlay,
  onClick,
}: {
  name: string;
  char: Character | undefined;
  overlay?: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: name,
  });

  const style: React.CSSProperties = overlay
    ? { cursor: 'grabbing' }
    : {
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'pointer',
      };

  // Wrap drag listeners to detect click vs drag
  const wrappedListeners = onClick
    ? Object.fromEntries(
        Object.entries(listeners ?? {}).map(([key, handler]) => [
          key,
          (e: React.PointerEvent) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const onUp = (upEvent: PointerEvent) => {
              const dx = Math.abs(upEvent.clientX - startX);
              const dy = Math.abs(upEvent.clientY - startY);
              if (dx < 5 && dy < 5) onClick();
              window.removeEventListener('pointerup', onUp);
            };
            window.addEventListener('pointerup', onUp, { once: true });
            (handler as (e: React.PointerEvent) => void)(e);
          },
        ])
      )
    : listeners;

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : { ...wrappedListeners, ...attributes })}
    >
      <CharacterCard name={name} quality={char?.quality} disableLink />
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

function renderCharacterOption({ option }: { option: { label: string } }) {
  return (
    <Group gap="xs" align="center">
      <Image
        src={getPortrait(option.label)}
        alt=""
        w={18}
        h={18}
        fit="cover"
        radius="50%"
        fallbackSrc={`https://placehold.co/18x18?text=${encodeURIComponent(option.label.charAt(0))}`}
      />
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

/* ── Configure-member modal (isolated state to avoid keystroke re-renders) ── */

interface ConfigModalProps {
  opened: boolean;
  onClose: () => void;
  characterName: string | null;
  note: string;
  onNoteChange: (note: string) => void;
  substitutes: string[];
  onSubstitutesChange: (subs: string[]) => void;
  substituteOptions: { value: string; label: string }[];
}

function ConfigModal({
  opened,
  onClose,
  characterName,
  note: externalNote,
  onNoteChange,
  substitutes: externalSubs,
  onSubstitutesChange,
  substituteOptions,
}: ConfigModalProps) {
  const [note, setNote] = useState(externalNote);
  const [subs, setSubs] = useState(externalSubs);

  // Sync from parent when modal opens
  useEffect(() => {
    if (opened) {
      queueMicrotask(() => {
        setNote(externalNote);
        setSubs(externalSubs);
      });
    }
  }, [opened, externalNote, externalSubs]);

  // Flush local state back to parent on close
  const handleClose = () => {
    onNoteChange(note);
    onSubstitutesChange(subs);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={characterName ? `Configure ${characterName}` : 'Configure Member'}
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Note"
          placeholder="Add a note (e.g., build full HP, swap for boss 2)..."
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
        />
        <Text size="sm" c="dimmed">
          Select characters that can substitute for this team member.
        </Text>
        <MultiSelect
          label="Substitutes"
          placeholder="Select substitute characters"
          data={substituteOptions}
          renderOption={renderCharacterOption}
          value={subs}
          onChange={setSubs}
          searchable
          clearable
        />
      </Stack>
    </Modal>
  );
}

/* ── Single team slot with overdrive toggle ── */

function SlotCard({
  index,
  charName,
  char,
  hasOverdrive,
  onToggleOverdrive,
  onRemove,
  onConfigure,
}: {
  index: number;
  charName: string | null;
  char: Character | undefined;
  hasOverdrive: boolean;
  onToggleOverdrive: () => void;
  onRemove: () => void;
  onConfigure: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}` });

  return (
    <Paper
      ref={setNodeRef}
      p="xs"
      radius="md"
      withBorder
      style={{
        borderColor: isOver ? 'var(--mantine-color-orange-5)' : undefined,
        borderWidth: isOver ? 2 : undefined,
        transition: 'border-color 150ms ease',
        minHeight: 130,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {charName ? (
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
          <ActionIcon
            size="xs"
            variant="light"
            color="gray"
            radius="xl"
            style={{ position: 'absolute', top: 4, right: 28 }}
            onClick={onConfigure}
            aria-label="Configure substitutes"
          >
            <IoSettings size={12} />
          </ActionIcon>
          {hasOverdrive && (
            <Badge
              size="sm"
              circle
              variant="filled"
              color="orange"
              style={{ position: 'absolute', top: 4, left: 4 }}
            >
              {index + 1}
            </Badge>
          )}
          <Stack gap={4} align="center">
            <DraggableCharCard name={charName} char={char} />
            <Button
              size="compact-xs"
              variant={hasOverdrive ? 'filled' : 'light'}
              color="orange"
              onClick={onToggleOverdrive}
              leftSection={hasOverdrive ? <IoCheckmark size={12} /> : undefined}
            >
              {hasOverdrive ? `OD ${index + 1}` : 'OD Off'}
            </Button>
          </Stack>
        </>
      ) : (
        <Text size="xs" c="dimmed" ta="center">
          Drop here
        </Text>
      )}
    </Paper>
  );
}

/* ── Team slots grid (6 slots) ── */

function SlotsGrid({
  slots,
  overdriveEnabled,
  charMap,
  onToggleOverdrive,
  onRemove,
  onConfigure,
}: {
  slots: (string | null)[];
  overdriveEnabled: boolean[];
  charMap: Map<string, Character>;
  onToggleOverdrive: (index: number) => void;
  onRemove: (index: number) => void;
  onConfigure: (index: number) => void;
}) {
  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={600}>
          Team Roster
        </Text>
        <Text size="xs" c="dimmed">
          Drag characters here • Toggle overdrive per character
        </Text>
      </Group>
      <SimpleGrid cols={{ base: 3, xs: 6 }} spacing="xs">
        {slots.map((charName, i) => (
          <SlotCard
            key={i}
            index={i}
            charName={charName}
            char={charName ? charMap.get(charName) : undefined}
            hasOverdrive={overdriveEnabled[i]}
            onToggleOverdrive={() => onToggleOverdrive(i)}
            onRemove={() => onRemove(i)}
            onConfigure={() => onConfigure(i)}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

/* ── Available pool ── */

function AvailablePool({
  children,
  filterHeader,
}: {
  children: React.ReactNode;
  filterHeader?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'available' });

  return (
    <Paper
      ref={setNodeRef}
      p="md"
      radius="md"
      withBorder
      style={{
        borderColor: isOver ? 'var(--mantine-color-blue-5)' : undefined,
        borderWidth: isOver ? 2 : undefined,
        transition: 'border-color 150ms ease',
      }}
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
  // Team roster: max 6 characters
  const [slots, setSlots] = useState<(string | null)[]>(
    Array(SLOT_COUNT).fill(null)
  );
  // Track which slots have overdrive enabled
  const [overdriveEnabled, setOverdriveEnabled] = useState<boolean[]>(
    Array(SLOT_COUNT).fill(false)
  );
  // Track substitutes for each slot
  const [substitutes, setSubstitutes] = useState<string[][]>(
    Array(SLOT_COUNT)
      .fill(null)
      .map(() => [])
  );
  // Track notes for each slot
  const [slotNotes, setSlotNotes] = useState<string[]>(
    Array(SLOT_COUNT).fill('')
  );
  // Track wyrmspells
  const [teamWyrmspells, setTeamWyrmspells] = useState<TeamWyrmspells>({});
  // Modal for configuring slot details
  const [
    configModalOpened,
    { open: openConfigModal, close: closeConfigModal },
  ] = useDisclosure(false);
  const [configSlotIndex, setConfigSlotIndex] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [contentType, setContentType] = useState('');
  const [description, setDescription] = useState('');
  const [faction, setFaction] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) return;
    queueMicrotask(() => {
      setName(initialData.name);
      setAuthor(initialData.author);
      setContentType(initialData.content_type);
      setDescription(initialData.description || '');
      setFaction(initialData.faction);
      const newSlots: (string | null)[] = Array(SLOT_COUNT).fill(null);
      const newOverdriveEnabled = Array(SLOT_COUNT).fill(false);
      const newSubstitutes: string[][] = Array(SLOT_COUNT)
        .fill(null)
        .map(() => []);
      const newNotes: string[] = Array(SLOT_COUNT).fill('');

      // Map members to slots and track overdrive status and substitutes
      for (const m of initialData.members) {
        // Find first empty slot for this member
        const emptyIdx = newSlots.findIndex((s) => s === null);
        if (emptyIdx !== -1) {
          newSlots[emptyIdx] = m.character_name;
          newOverdriveEnabled[emptyIdx] = m.overdrive_order != null;
          newSubstitutes[emptyIdx] = m.substitutes || [];
          newNotes[emptyIdx] = m.note || '';
        }
      }

      // Set wyrmspells
      if (initialData.wyrmspells) {
        setTeamWyrmspells(initialData.wyrmspells);
      }

      // Reorder slots so overdrive-enabled members come first
      const withOverdrive = newSlots
        .map((name, idx) => ({
          name,
          idx,
          hasOD: newOverdriveEnabled[idx],
          subs: newSubstitutes[idx],
          note: newNotes[idx],
        }))
        .filter((item) => item.name !== null && item.hasOD)
        .sort((a, b) => {
          const aOrder =
            initialData.members.find((m) => m.character_name === a.name)
              ?.overdrive_order || 0;
          const bOrder =
            initialData.members.find((m) => m.character_name === b.name)
              ?.overdrive_order || 0;
          return aOrder - bOrder;
        });

      const withoutOverdrive = newSlots
        .map((name, idx) => ({
          name,
          idx,
          hasOD: newOverdriveEnabled[idx],
          subs: newSubstitutes[idx],
          note: newNotes[idx],
        }))
        .filter((item) => item.name !== null && !item.hasOD);

      const reorderedSlots: (string | null)[] = Array(SLOT_COUNT).fill(null);
      const reorderedOverdrive = Array(SLOT_COUNT).fill(false);
      const reorderedSubstitutes: string[][] = Array(SLOT_COUNT)
        .fill(null)
        .map(() => []);
      const reorderedNotes: string[] = Array(SLOT_COUNT).fill('');

      let i = 0;
      for (const item of withOverdrive) {
        reorderedSlots[i] = item.name;
        reorderedOverdrive[i] = true;
        reorderedSubstitutes[i] = item.subs;
        reorderedNotes[i] = item.note;
        i++;
      }
      for (const item of withoutOverdrive) {
        reorderedSlots[i] = item.name;
        reorderedOverdrive[i] = false;
        reorderedSubstitutes[i] = item.subs;
        reorderedNotes[i] = item.note;
        i++;
      }

      setSlots(reorderedSlots);
      setOverdriveEnabled(reorderedOverdrive);
      setSubstitutes(reorderedSubstitutes);
      setSlotNotes(reorderedNotes);
    });
  }, [initialData]);

  const factionColor = faction ? FACTION_COLOR[faction as FactionName] : 'blue';

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

    // Add members with overdrive first (in order)
    for (let i = 0; i < slots.length; i++) {
      const n = slots[i];
      if (n && overdriveEnabled[i]) {
        members.push({
          character_name: n,
          overdrive_order: overdriveOrder++,
          substitutes: substitutes[i].length > 0 ? substitutes[i] : undefined,
          ...(slotNotes[i] ? { note: slotNotes[i] } : {}),
        });
      }
    }

    // Then add members without overdrive
    for (let i = 0; i < slots.length; i++) {
      const n = slots[i];
      if (n && !overdriveEnabled[i]) {
        members.push({
          character_name: n,
          overdrive_order: null,
          substitutes: substitutes[i].length > 0 ? substitutes[i] : undefined,
          ...(slotNotes[i] ? { note: slotNotes[i] } : {}),
        });
      }
    }

    const result: Team = {
      name: name || 'My Team',
      author: author || 'Anonymous',
      content_type: contentType || 'PvE',
      description,
      faction: (faction || 'Elemental Echo') as FactionName,
      members,
      last_updated: 0,
    };

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
    overdriveEnabled,
    substitutes,
    slotNotes,
    teamWyrmspells,
    name,
    author,
    contentType,
    description,
    faction,
  ]);

  const availableCharacters = useMemo(() => {
    return characters.filter((c) => !teamNames.has(c.name));
  }, [characters, teamNames]);

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

  function findCharLocation(
    charName: string
  ): { zone: 'slot'; index: number } | { zone: 'available' } {
    const slotIdx = slots.indexOf(charName);
    if (slotIdx !== -1) return { zone: 'slot', index: slotIdx };
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
      const occupant = slots[targetSlotIndex];

      if (from.zone === 'available') {
        // Available → slot
        if (occupant && teamSize >= MAX_ROSTER_SIZE) {
          // Team full, swap occupant back to available
          setSlots((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = charName;
            return next;
          });
          setOverdriveEnabled((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = false; // New character starts with overdrive off
            return next;
          });
        } else if (occupant) {
          // Slot occupied but team not full — find empty slot for occupant
          const emptyIdx = slots.findIndex((s) => s === null);
          if (emptyIdx !== -1) {
            setSlots((prev) => {
              const next = [...prev];
              next[targetSlotIndex] = charName;
              next[emptyIdx] = occupant;
              return next;
            });
            setOverdriveEnabled((prev) => {
              const next = [...prev];
              next[targetSlotIndex] = false; // New character starts with overdrive off
              // Keep occupant's overdrive state
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
          setOverdriveEnabled((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = false; // New character starts with overdrive off
            return next;
          });
        }
      } else if (from.zone === 'slot') {
        // Slot → different slot: swap
        const fromIndex = from.index;
        if (fromIndex === targetSlotIndex) return;
        setSlots((prev) => {
          const next = [...prev];
          next[fromIndex] = occupant;
          next[targetSlotIndex] = charName;
          return next;
        });
        setOverdriveEnabled((prev) => {
          const next = [...prev];
          // Swap overdrive states too
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
        setOverdriveEnabled((prev) => {
          const next = [...prev];
          next[from.index] = false;
          return next;
        });
      }
      return;
    }
  }

  function handleAddToNextSlot(charName: string) {
    if (teamSize >= MAX_ROSTER_SIZE) return;
    const emptyIdx = slots.findIndex((s) => s === null);
    if (emptyIdx === -1) return;
    setSlots((prev) => {
      const next = [...prev];
      next[emptyIdx] = charName;
      return next;
    });
    setOverdriveEnabled((prev) => {
      const next = [...prev];
      next[emptyIdx] = false;
      return next;
    });
  }

  function handleToggleOverdrive(slotIndex: number) {
    if (!slots[slotIndex]) return; // No character in slot
    setOverdriveEnabled((prev) => {
      const next = [...prev];
      next[slotIndex] = !next[slotIndex];
      return next;
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
    setOverdriveEnabled((prev) => {
      const next = [...prev];
      next[slotIndex] = false;
      return next;
    });
  }

  function handleOpenConfig(slotIndex: number) {
    if (!slots[slotIndex]) return; // No character in slot
    setConfigSlotIndex(slotIndex);
    openConfigModal();
  }

  function handleUpdateSubstitutes(subs: string[]) {
    if (configSlotIndex === null) return;
    setSubstitutes((prev) => {
      const next = [...prev];
      next[configSlotIndex] = subs;
      return next;
    });
  }

  function handleClear() {
    setSlots(Array(SLOT_COUNT).fill(null));
    setOverdriveEnabled(Array(SLOT_COUNT).fill(false));
    setSubstitutes(
      Array(SLOT_COUNT)
        .fill(null)
        .map(() => [])
    );
    setSlotNotes(Array(SLOT_COUNT).fill(''));
    setTeamWyrmspells({});
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Stack gap="md">
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Team name..."
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 150 }}
          />
          <TextInput
            placeholder="Author..."
            value={author}
            onChange={(e) => setAuthor(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 120 }}
          />
          <TextInput
            placeholder="Content type (e.g. PvE, PvP)..."
            value={contentType}
            onChange={(e) => setContentType(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 120 }}
          />
          <Select
            placeholder="Faction..."
            data={FACTIONS.map((f) => ({
              value: f,
              label: f,
            }))}
            value={faction}
            onChange={setFaction}
            renderOption={renderFactionOption}
            searchable
            leftSection={(() => {
              if (!faction) return undefined;
              const iconSrc = FACTION_ICON_MAP[faction as FactionName];
              return iconSrc ? (
                <Image src={iconSrc} alt="" w={16} h={16} fit="contain" />
              ) : undefined;
            })()}
            style={{ minWidth: 160 }}
          />
        </Group>

        <Textarea
          placeholder="Description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          autosize
          minRows={1}
          maxRows={4}
        />

        <Group gap="sm">
          <CopyButton value={json}>
            {({ copied, copy }) => (
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
            )}
          </CopyButton>
          <Button
            variant="light"
            size="sm"
            leftSection={<IoOpenOutline size={16} />}
            onClick={() => {
              if (!teamIssueUrl) {
                // URL too long, open issue with template but empty JSON
                const emptyUrl = `${GITHUB_REPO_URL}/issues/new?${new URLSearchParams({ title: '[Team] New team suggestion', body: buildEmptyIssueBody('team') }).toString()}`;
                window.open(emptyUrl, '_blank');
                notifications.show({
                  color: 'yellow',
                  title: 'Team JSON is too large',
                  message:
                    'Please copy the JSON using the Copy JSON button and paste it into the GitHub issue body.',
                  autoClose: 8000,
                });
                return;
              }

              window.open(teamIssueUrl, '_blank');
            }}
            disabled={teamSize === 0}
          >
            Submit Suggestion
          </Button>
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
          <Badge variant="light" color={factionColor} size="lg" radius="sm">
            {teamSize} / {MAX_ROSTER_SIZE}
          </Badge>
        </Group>

        <Paper p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={600}>
              Wyrmspells
            </Text>
            <SimpleGrid cols={{ base: 2, xs: 4 }} spacing="sm">
              <Select
                label="Breach"
                placeholder="Select breach wyrmspell"
                data={wyrmspells
                  .filter((w) => w.type === 'Breach')
                  .map((w) => ({ value: w.name, label: w.name }))}
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
                searchable
                clearable
              />
              <Select
                label="Refuge"
                placeholder="Select refuge wyrmspell"
                data={wyrmspells
                  .filter((w) => w.type === 'Refuge')
                  .map((w) => ({ value: w.name, label: w.name }))}
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
                searchable
                clearable
              />
              <Select
                label="Wildcry"
                placeholder="Select wildcry wyrmspell"
                data={wyrmspells
                  .filter((w) => w.type === 'Wildcry')
                  .map((w) => ({ value: w.name, label: w.name }))}
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
                searchable
                clearable
              />
              <Select
                label="Dragon's Call"
                placeholder="Select dragon's call wyrmspell"
                data={wyrmspells
                  .filter((w) => w.type === "Dragon's Call")
                  .map((w) => ({ value: w.name, label: w.name }))}
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
                searchable
                clearable
              />
            </SimpleGrid>
          </Stack>
        </Paper>

        <SlotsGrid
          slots={slots}
          overdriveEnabled={overdriveEnabled}
          charMap={charMap}
          onToggleOverdrive={handleToggleOverdrive}
          onRemove={handleRemoveFromTeam}
          onConfigure={handleOpenConfig}
        />

        <FilterableCharacterPool characters={availableCharacters}>
          {(filtered, filterHeader) => (
            <AvailablePool filterHeader={filterHeader}>
              {filtered.map((c) => (
                <DraggableCharCard
                  key={c.name}
                  name={c.name}
                  char={c}
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
                <DraggableCharCard
                  name={activeId}
                  char={charMap.get(activeId)}
                  overlay
                />
              ) : null}
            </DragOverlay>,
            document.body
          )
        : null}

      <ConfigModal
        opened={configModalOpened}
        onClose={closeConfigModal}
        characterName={configSlotIndex !== null ? slots[configSlotIndex] : null}
        note={configSlotIndex !== null ? slotNotes[configSlotIndex] : ''}
        onNoteChange={(note) => {
          if (configSlotIndex !== null) {
            setSlotNotes((prev) => {
              const next = [...prev];
              next[configSlotIndex] = note;
              return next;
            });
          }
        }}
        substitutes={
          configSlotIndex !== null ? substitutes[configSlotIndex] : []
        }
        onSubstitutesChange={(subs) => {
          if (configSlotIndex !== null) {
            handleUpdateSubstitutes(subs);
          }
        }}
        substituteOptions={availableCharacters
          .filter((c) => !teamNames.has(c.name))
          .map((c) => ({ value: c.name, label: c.name }))}
      />
    </DndContext>
  );
}
