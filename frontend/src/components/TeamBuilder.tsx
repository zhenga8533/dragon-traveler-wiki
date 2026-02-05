import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
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
import { IoCheckmark, IoCopy, IoTrash } from 'react-icons/io5';
import { getPortrait } from '../assets/character';
import { FACTION_COLOR } from '../constants/colors';
import { QUALITY_BORDER_COLOR } from './CharacterCard';
import type { Character, FactionName } from '../types/character';
import type { Team, TeamMember } from '../types/team';

const MAX_ROSTER_SIZE = 6;

const FACTIONS: FactionName[] = [
  'Elemental Echo',
  'Wild Spirit',
  'Arcane Wisdom',
  'Sanctum Glory',
  'Otherworld Return',
  'Illusion Veil',
];

const OVERDRIVE_OPTIONS = [
  { value: '', label: 'Off' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
];

interface TeamBuilderProps {
  characters: Character[];
  filteredNames: Set<string>;
  charMap: Map<string, Character>;
}

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

function RosterCharCard({
  name,
  char,
  overdriveOrder,
  onOverdriveChange,
}: {
  name: string;
  char: Character | undefined;
  overdriveOrder: number | null;
  onOverdriveChange: (value: number | null) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: name,
  });

  const borderColor = char
    ? QUALITY_BORDER_COLOR[char.quality]
    : 'var(--mantine-color-gray-5)';

  return (
    <Stack
      ref={setNodeRef}
      gap={2}
      align="center"
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      {/* Only the portrait + name act as the drag handle */}
      <Stack
        gap={2}
        align="center"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        {...listeners}
        {...attributes}
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
      <Select
        size="xs"
        w={60}
        data={OVERDRIVE_OPTIONS}
        value={overdriveOrder !== null ? String(overdriveOrder) : ''}
        onChange={(val) => onOverdriveChange(val ? Number(val) : null)}
        allowDeselect={false}
        styles={{ input: { textAlign: 'center', paddingInline: 4 } }}
      />
    </Stack>
  );
}

function TeamDropZone({
  color,
  rosterSize,
  children,
}: {
  color: string;
  rosterSize: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'team' });

  return (
    <Paper
      ref={setNodeRef}
      p="md"
      radius="md"
      withBorder
      style={{
        borderColor: isOver ? `var(--mantine-color-${color}-5)` : undefined,
        borderWidth: isOver ? 2 : undefined,
        transition: 'border-color 150ms ease',
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Badge variant="filled" color={color} size="lg" radius="sm">
            Team Roster
          </Badge>
          <Text size="xs" c="dimmed">
            {rosterSize} / {MAX_ROSTER_SIZE}
          </Text>
        </Group>
        <SimpleGrid
          cols={{ base: 3, xs: 4, sm: 6 }}
          spacing={4}
          style={{ minHeight: 40 }}
        >
          {children}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

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

export default function TeamBuilder({
  characters,
  filteredNames,
  charMap,
}: TeamBuilderProps) {
  // Map from character name to overdrive order (null = off)
  const [roster, setRoster] = useState<Map<string, number | null>>(new Map());
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [contentType, setContentType] = useState('');
  const [faction, setFaction] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const factionColor = faction
    ? FACTION_COLOR[faction as FactionName]
    : 'blue';

  const json = useMemo(() => {
    const members: TeamMember[] = [...roster.entries()].map(
      ([character_name, overdrive_order]) => ({
        character_name,
        overdrive_order,
      }),
    );
    const result: Team = {
      name: name || 'My Team',
      author: author || 'Anonymous',
      content_type: contentType || 'PvE',
      description: '',
      faction: (faction || 'Elemental Echo') as FactionName,
      members,
    };
    return JSON.stringify(result, null, 2);
  }, [roster, name, author, contentType, faction]);

  const availableCharacters = useMemo(
    () => characters.filter((c) => filteredNames.has(c.name) && !roster.has(c.name)),
    [characters, filteredNames, roster],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const charName = event.active.id as string;
    const overId = event.over?.id as string | undefined;

    if (!overId) return;

    if (overId === 'available') {
      setRoster((prev) => {
        const next = new Map(prev);
        next.delete(charName);
        return next;
      });
    } else if (overId === 'team') {
      if (!roster.has(charName) && roster.size >= MAX_ROSTER_SIZE) return;
      setRoster((prev) => {
        if (prev.has(charName)) return prev;
        const next = new Map(prev);
        next.set(charName, null);
        return next;
      });
    }
  }

  function handleOverdriveChange(charName: string, value: number | null) {
    setRoster((prev) => {
      const next = new Map(prev);
      next.set(charName, value);
      return next;
    });
  }

  function handleClear() {
    setRoster(new Map());
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
            disabled={roster.size === 0}
          >
            Clear All
          </Button>
        </Group>

        <TeamDropZone color={factionColor} rosterSize={roster.size}>
          {[...roster.entries()].map(([n, od]) => (
            <RosterCharCard
              key={n}
              name={n}
              char={charMap.get(n)}
              overdriveOrder={od}
              onOverdriveChange={(val) => handleOverdriveChange(n, val)}
            />
          ))}
        </TeamDropZone>

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
