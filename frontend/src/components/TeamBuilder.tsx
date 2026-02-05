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
import { useMemo, useState } from 'react';
import { IoCheckmark, IoClose, IoCopy, IoTrash } from 'react-icons/io5';
import { getPortrait } from '../assets/character';
import { FACTION_COLOR } from '../constants/colors';
import { QUALITY_BORDER_COLOR } from './CharacterCard';
import type { Character, FactionName } from '../types/character';
import type { Team, TeamMember } from '../types/team';

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
  filteredNames: Set<string>;
  charMap: Map<string, Character>;
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

/* ── Single numbered slot (droppable) ── */

function SlotCard({
  index,
  charName,
  char,
  onRemoveToBench,
}: {
  index: number;
  charName: string | null;
  char: Character | undefined;
  onRemoveToBench: () => void;
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
      <Badge
        size="sm"
        circle
        variant="filled"
        color="orange"
        style={{ position: 'absolute', top: 4, left: 4 }}
      >
        {index + 1}
      </Badge>

      {charName ? (
        <>
          <ActionIcon
            size="xs"
            variant="filled"
            color="gray"
            radius="xl"
            style={{ position: 'absolute', top: 4, right: 4 }}
            onClick={onRemoveToBench}
            title="Move to bench"
          >
            <IoClose size={12} />
          </ActionIcon>
          <DraggableCharCard name={charName} char={char} />
        </>
      ) : (
        <Text size="xs" c="dimmed" ta="center">
          Drop here
        </Text>
      )}
    </Paper>
  );
}

/* ── Slots grid (6 numbered slots) ── */

function SlotsGrid({
  slots,
  charMap,
  onRemoveToBench,
}: {
  slots: (string | null)[];
  charMap: Map<string, Character>;
  onRemoveToBench: (index: number) => void;
}) {
  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={600}>
          Overdrive Slots
        </Text>
        <Text size="xs" c="dimmed">
          Drag characters into numbered slots
        </Text>
      </Group>
      <SimpleGrid cols={{ base: 3, xs: 6 }} spacing="xs">
        {slots.map((charName, i) => (
          <SlotCard
            key={i}
            index={i}
            charName={charName}
            char={charName ? charMap.get(charName) : undefined}
            onRemoveToBench={() => onRemoveToBench(i)}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

/* ── Bench zone (team members without overdrive) ── */

function BenchZone({
  bench,
  charMap,
}: {
  bench: Set<string>;
  charMap: Map<string, Character>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bench' });

  return (
    <Paper
      ref={setNodeRef}
      p="md"
      radius="md"
      withBorder
      style={{
        borderColor: isOver ? 'var(--mantine-color-yellow-5)' : undefined,
        borderWidth: isOver ? 2 : undefined,
        transition: 'border-color 150ms ease',
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm" fw={600}>
            Bench
          </Text>
          <Text size="xs" c="dimmed">
            On team, no overdrive order
          </Text>
        </Group>
        <SimpleGrid
          cols={{ base: 3, xs: 4, sm: 6 }}
          spacing={4}
          style={{ minHeight: 40 }}
        >
          {[...bench].map((name) => (
            <DraggableCharCard
              key={name}
              name={name}
              char={charMap.get(name)}
            />
          ))}
        </SimpleGrid>
        {bench.size === 0 && (
          <Text size="xs" c="dimmed" ta="center">
            Drag characters here for no overdrive
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

/* ── Available pool ── */

function AvailablePool({ children }: { children: React.ReactNode }) {
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
        <Text size="sm" fw={600} c="dimmed">
          Available Characters
        </Text>
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
  filteredNames,
  charMap,
}: TeamBuilderProps) {
  // Index 0 = overdrive order 1, ..., index 5 = overdrive order 6
  const [slots, setSlots] = useState<(string | null)[]>(
    Array(SLOT_COUNT).fill(null),
  );
  // Characters on the team but without an overdrive number
  const [bench, setBench] = useState<Set<string>>(new Set());

  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [contentType, setContentType] = useState('');
  const [faction, setFaction] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const factionColor = faction
    ? FACTION_COLOR[faction as FactionName]
    : 'blue';

  // Set of all names currently on the team (slots + bench)
  const teamNames = useMemo(() => {
    const s = new Set<string>();
    for (const n of slots) {
      if (n) s.add(n);
    }
    for (const n of bench) {
      s.add(n);
    }
    return s;
  }, [slots, bench]);

  const teamSize = teamNames.size;

  const json = useMemo(() => {
    const members: TeamMember[] = [];
    // Slotted members first (with overdrive_order)
    for (let i = 0; i < slots.length; i++) {
      const n = slots[i];
      if (n) {
        members.push({ character_name: n, overdrive_order: i + 1 });
      }
    }
    // Bench members (no overdrive)
    for (const n of bench) {
      members.push({ character_name: n, overdrive_order: null });
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
  }, [slots, bench, name, author, contentType, faction]);

  const availableCharacters = useMemo(
    () =>
      characters.filter(
        (c) => filteredNames.has(c.name) && !teamNames.has(c.name),
      ),
    [characters, filteredNames, teamNames],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function findCharLocation(
    charName: string,
  ): { zone: 'slot'; index: number } | { zone: 'bench' } | { zone: 'available' } {
    const slotIdx = slots.indexOf(charName);
    if (slotIdx !== -1) return { zone: 'slot', index: slotIdx };
    if (bench.has(charName)) return { zone: 'bench' };
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
          // Team full, swap occupant back to available (remove occupant)
          setSlots((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = charName;
            return next;
          });
        } else if (occupant) {
          // Slot occupied but team not full — replace, move occupant to bench
          setSlots((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = charName;
            return next;
          });
          setBench((prev) => {
            const next = new Set(prev);
            next.add(occupant);
            return next;
          });
        } else {
          // Slot empty — check team size
          if (teamSize >= MAX_ROSTER_SIZE) return;
          setSlots((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = charName;
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
      } else if (from.zone === 'bench') {
        // Bench → slot
        setBench((prev) => {
          const next = new Set(prev);
          next.delete(charName);
          return next;
        });
        if (occupant) {
          // Move occupant to bench
          setBench((prev) => {
            const next = new Set(prev);
            next.add(occupant);
            return next;
          });
        }
        setSlots((prev) => {
          const next = [...prev];
          next[targetSlotIndex] = charName;
          return next;
        });
      }
      return;
    }

    // ── Drop onto bench ──
    if (overId === 'bench') {
      if (from.zone === 'available') {
        if (teamSize >= MAX_ROSTER_SIZE) return;
        setBench((prev) => {
          const next = new Set(prev);
          next.add(charName);
          return next;
        });
      } else if (from.zone === 'slot') {
        // Slot → bench
        setSlots((prev) => {
          const next = [...prev];
          next[from.index] = null;
          return next;
        });
        setBench((prev) => {
          const next = new Set(prev);
          next.add(charName);
          return next;
        });
      }
      // Bench → bench: no-op
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
      } else if (from.zone === 'bench') {
        setBench((prev) => {
          const next = new Set(prev);
          next.delete(charName);
          return next;
        });
      }
      return;
    }
  }

  function handleRemoveToBench(slotIndex: number) {
    const charName = slots[slotIndex];
    if (!charName) return;
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    setBench((prev) => {
      const next = new Set(prev);
      next.add(charName);
      return next;
    });
  }

  function handleClear() {
    setSlots(Array(SLOT_COUNT).fill(null));
    setBench(new Set());
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
          charMap={charMap}
          onRemoveToBench={handleRemoveToBench}
        />

        <BenchZone bench={bench} charMap={charMap} />

        <AvailablePool>
          {availableCharacters.map((c) => (
            <DraggableCharCard key={c.name} name={c.name} char={c} />
          ))}
        </AvailablePool>
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
