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
import type { Team } from '../types/team';

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

function TeamDropZone({
  color,
  children,
}: {
  color: string;
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
        <Badge variant="filled" color={color} size="lg" radius="sm">
          Team Roster
        </Badge>
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
  const [roster, setRoster] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [contentType, setContentType] = useState('');
  const [faction, setFaction] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const factionColor = faction
    ? FACTION_COLOR[faction as FactionName]
    : 'blue';

  const json = useMemo(() => {
    const result: Team = {
      name: name || 'My Team',
      author: author || 'Anonymous',
      content_type: contentType || 'PvE',
      description: '',
      faction: (faction || 'Elemental Echo') as FactionName,
      characters: [...roster],
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
        const next = new Set(prev);
        next.delete(charName);
        return next;
      });
    } else if (overId === 'team') {
      setRoster((prev) => new Set(prev).add(charName));
    }
  }

  function handleClear() {
    setRoster(new Set());
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

        <TeamDropZone color={factionColor}>
          {[...roster].map((n) => (
            <DraggableCharCard key={n} name={n} char={charMap.get(n)} />
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
