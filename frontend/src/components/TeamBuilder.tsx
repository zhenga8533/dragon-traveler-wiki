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
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { IoCheckmark, IoClose, IoCopy, IoTrash } from 'react-icons/io5';
import { getPortrait } from '../assets/character';
import { FACTION_COLOR } from '../constants/colors';
import type { Character } from '../types/character';
import type { FactionName } from '../types/faction';
import type { Team, TeamMember } from '../types/team';
import { QUALITY_BORDER_COLOR } from './CharacterCard';
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
}

/* ── Draggable portrait (used in available pool, bench, slots, and overlay) ── */

function DraggableCharCard({
  name,
  char,
  overlay,
}: {
  name: string;
  char: Character | undefined;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: name,
  });

  const borderColor = char
    ? QUALITY_BORDER_COLOR[char.quality]
    : 'var(--mantine-color-gray-5)';

  const style: React.CSSProperties = overlay
    ? { cursor: 'grabbing' }
    : {
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      };

  return (
    <Stack
      ref={overlay ? undefined : setNodeRef}
      gap={2}
      align="center"
      style={style}
      {...(overlay ? {} : { ...listeners, ...attributes })}
    >
      <Image
        src={getPortrait(name)}
        alt={name}
        h={80}
        w={80}
        fit="cover"
        radius="50%"
        style={{
          border: `3px solid ${borderColor}`,
        }}
      />
      <Text size="xs" fw={500} ta="center" lineClamp={1}>
        {name}
      </Text>
    </Stack>
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
}: {
  index: number;
  charName: string | null;
  char: Character | undefined;
  hasOverdrive: boolean;
  onToggleOverdrive: () => void;
  onRemove: () => void;
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
            title="Remove from team"
          >
            <IoClose size={12} />
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
}: {
  slots: (string | null)[];
  overdriveEnabled: boolean[];
  charMap: Map<string, Character>;
  onToggleOverdrive: (index: number) => void;
  onRemove: (index: number) => void;
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
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

/* ── Available pool ── */

function AvailablePool({ children, filterHeader }: { children: React.ReactNode; filterHeader?: React.ReactNode }) {
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
          cols={{ base: 4, xs: 5, sm: 6, md: 8 }}
          spacing={4}
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
}: TeamBuilderProps) {
  // Team roster: max 6 characters
  const [slots, setSlots] = useState<(string | null)[]>(
    Array(SLOT_COUNT).fill(null),
  );
  // Track which slots have overdrive enabled
  const [overdriveEnabled, setOverdriveEnabled] = useState<boolean[]>(
    Array(SLOT_COUNT).fill(false),
  );

  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [contentType, setContentType] = useState('');
  const [faction, setFaction] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) return;
    setName(initialData.name);
    setAuthor(initialData.author);
    setContentType(initialData.content_type);
    setFaction(initialData.faction);
    const newSlots: (string | null)[] = Array(SLOT_COUNT).fill(null);
    const newOverdriveEnabled = Array(SLOT_COUNT).fill(false);

    // Map members to slots and track overdrive status
    for (const m of initialData.members) {
      // Find first empty slot for this member
      const emptyIdx = newSlots.findIndex((s) => s === null);
      if (emptyIdx !== -1) {
        newSlots[emptyIdx] = m.character_name;
        newOverdriveEnabled[emptyIdx] = m.overdrive_order != null;
      }
    }

    // Reorder slots so overdrive-enabled members come first
    const withOverdrive = newSlots
      .map((name, idx) => ({ name, idx, hasOD: newOverdriveEnabled[idx] }))
      .filter((item) => item.name !== null && item.hasOD)
      .sort((a, b) => {
        const aOrder = initialData.members.find((m) => m.character_name === a.name)?.overdrive_order || 0;
        const bOrder = initialData.members.find((m) => m.character_name === b.name)?.overdrive_order || 0;
        return aOrder - bOrder;
      });

    const withoutOverdrive = newSlots
      .map((name, idx) => ({ name, idx, hasOD: newOverdriveEnabled[idx] }))
      .filter((item) => item.name !== null && !item.hasOD);

    const reorderedSlots: (string | null)[] = Array(SLOT_COUNT).fill(null);
    const reorderedOverdrive = Array(SLOT_COUNT).fill(false);

    let i = 0;
    for (const item of withOverdrive) {
      reorderedSlots[i] = item.name;
      reorderedOverdrive[i] = true;
      i++;
    }
    for (const item of withoutOverdrive) {
      reorderedSlots[i] = item.name;
      reorderedOverdrive[i] = false;
      i++;
    }

    setSlots(reorderedSlots);
    setOverdriveEnabled(reorderedOverdrive);
  }, [initialData]);

  const factionColor = faction
    ? FACTION_COLOR[faction as FactionName]
    : 'blue';

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
        members.push({ character_name: n, overdrive_order: overdriveOrder++ });
      }
    }

    // Then add members without overdrive
    for (let i = 0; i < slots.length; i++) {
      const n = slots[i];
      if (n && !overdriveEnabled[i]) {
        members.push({ character_name: n, overdrive_order: null });
      }
    }

    const result: Team = {
      name: name || 'My Team',
      author: author || 'Anonymous',
      content_type: contentType || 'PvE',
      description: '',
      faction: (faction || 'Elemental Echo') as FactionName,
      members,
    };
    return JSON.stringify(result, null, 2);
  }, [slots, overdriveEnabled, name, author, contentType, faction]);

  const availableCharacters = useMemo(() => {
    return characters.filter((c) => !teamNames.has(c.name));
  }, [characters, teamNames]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function findCharLocation(
    charName: string,
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

  function handleClear() {
    setSlots(Array(SLOT_COUNT).fill(null));
    setOverdriveEnabled(Array(SLOT_COUNT).fill(false));
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
            data={FACTIONS}
            value={faction}
            onChange={setFaction}
            style={{ minWidth: 160 }}
          />
        </Group>

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

        <SlotsGrid
          slots={slots}
          overdriveEnabled={overdriveEnabled}
          charMap={charMap}
          onToggleOverdrive={handleToggleOverdrive}
          onRemove={handleRemoveFromTeam}
        />

        <FilterableCharacterPool characters={availableCharacters}>
          {(filtered, filterHeader) => (
            <AvailablePool filterHeader={filterHeader}>
              {filtered.map((c) => (
                <DraggableCharCard key={c.name} name={c.name} char={c} />
              ))}
            </AvailablePool>
          )}
        </FilterableCharacterPool>
      </Stack>

      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <DraggableCharCard
            name={activeId}
            char={charMap.get(activeId)}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
