import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Badge,
  Button,
  Card,
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
import { QUALITY_ICON_MAP } from '../assets/character_quality';
import { CLASS_ICON_MAP } from '../assets/class';
import { FACTION_ICON_MAP } from '../assets/faction';
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: name,
  });

  const style: React.CSSProperties = overlay
    ? { cursor: 'grabbing' }
    : {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
      };

  const card = (
    <Card
      ref={overlay ? undefined : setNodeRef}
      padding="xs"
      radius="md"
      withBorder
      style={style}
      {...(overlay ? {} : { ...listeners, ...attributes })}
    >
      <Stack gap={4} align="center">
        {getPortrait(name) && (
          <Image
            src={getPortrait(name)}
            alt={name}
            h={64}
            w={64}
            fit="cover"
            radius="50%"
          />
        )}
        <Text size="xs" fw={500} ta="center" lineClamp={1}>
          {name}
        </Text>
        {char && (
          <Group gap={2} justify="center" wrap="nowrap">
            <Image
              src={QUALITY_ICON_MAP[char.quality]}
              alt={char.quality}
              w={14}
              h={14}
              fit="contain"
            />
            <Image
              src={CLASS_ICON_MAP[char.character_class]}
              alt={char.character_class}
              w={14}
              h={14}
              fit="contain"
            />
            {char.factions.map((f) => (
              <Image
                key={f}
                src={FACTION_ICON_MAP[f]}
                alt={f}
                w={14}
                h={14}
                fit="contain"
              />
            ))}
          </Group>
        )}
      </Stack>
    </Card>
  );

  return card;
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
          cols={{ base: 2, xs: 3, sm: 4, md: 5 }}
          spacing="sm"
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
          cols={{ base: 2, xs: 3, sm: 4, md: 5 }}
          spacing="sm"
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

      <DragOverlay>
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
