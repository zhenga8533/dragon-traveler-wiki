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
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { IoCheckmark, IoCopy, IoTrash } from 'react-icons/io5';
import { getPortrait } from '../assets/portrait';
import type { Character } from '../types/character';
import type { Tier, TierListCategory } from '../types/tier-list';

const TIER_ORDER: Tier[] = ['S+', 'S', 'A', 'B', 'C', 'D'];

const TIER_COLOR: Record<Tier, string> = {
  'S+': 'pink',
  S: 'red',
  A: 'orange',
  B: 'yellow',
  C: 'green',
  D: 'gray',
};

const QUALITY_BORDER_COLOR: Record<string, string> = {
  'SSR EX': 'var(--mantine-color-red-6)',
  'SSR+': 'var(--mantine-color-orange-5)',
  SSR: 'var(--mantine-color-yellow-5)',
  'SR+': 'var(--mantine-color-violet-5)',
  R: 'var(--mantine-color-blue-5)',
  N: 'var(--mantine-color-gray-5)',
};

interface TierListBuilderProps {
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

function TierDropZone({
  id,
  label,
  color,
  children,
}: {
  id: string;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

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
          {label}
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

function UnrankedPool({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unranked' });

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
          Unranked Characters
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

export default function TierListBuilder({
  characters,
  filteredNames,
  charMap,
}: TierListBuilderProps) {
  const [placements, setPlacements] = useState<Record<string, Tier>>({});
  const [name, setName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const json = useMemo(() => {
    const result: TierListCategory = {
      name: name || 'My Tier List',
      entries: TIER_ORDER.flatMap((tier) =>
        Object.entries(placements)
          .filter(([, t]) => t === tier)
          .map(([characterName]) => ({ characterName, tier })),
      ),
    };
    return JSON.stringify(result, null, 2);
  }, [placements, name]);

  const unrankedCharacters = useMemo(
    () =>
      characters.filter(
        (c) => filteredNames.has(c.name) && !(c.name in placements),
      ),
    [characters, filteredNames, placements],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const charName = event.active.id as string;
    const overId = event.over?.id as string | undefined;

    if (!overId) return;

    if (overId === 'unranked') {
      setPlacements((prev) => {
        const next = { ...prev };
        delete next[charName];
        return next;
      });
    } else if (overId.startsWith('tier-')) {
      const tier = overId.replace('tier-', '') as Tier;
      setPlacements((prev) => ({ ...prev, [charName]: tier }));
    }
  }

  function handleClear() {
    setPlacements({});
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Stack gap="md">
        <Group gap="sm">
          <TextInput
            placeholder="Tier list name..."
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
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
            disabled={Object.keys(placements).length === 0}
          >
            Clear All
          </Button>
        </Group>

        {TIER_ORDER.map((tier) => {
          const names = Object.entries(placements)
            .filter(([, t]) => t === tier)
            .map(([n]) => n);

          return (
            <TierDropZone
              key={tier}
              id={`tier-${tier}`}
              label={`${tier} Tier`}
              color={TIER_COLOR[tier]}
            >
              {names.map((n) => (
                <DraggableCharCard key={n} name={n} char={charMap.get(n)} />
              ))}
            </TierDropZone>
          );
        })}

        <UnrankedPool>
          {unrankedCharacters.map((c) => (
            <DraggableCharCard key={c.name} name={c.name} char={c} />
          ))}
        </UnrankedPool>
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
