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
  Paper,
  Popover,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IoCheckmark,
  IoCopy,
  IoOpenOutline,
  IoPencil,
  IoTrash,
} from 'react-icons/io5';
import { GITHUB_REPO_URL } from '../constants';
import { TIER_COLOR, TIER_ORDER } from '../constants/colors';
import { CHARACTER_GRID_SPACING } from '../constants/ui';
import type { Character } from '../types/character';
import type { Tier, TierList } from '../types/tier-list';
import CharacterCard from './CharacterCard';
import FilterableCharacterPool from './FilterableCharacterPool';
interface TierListBuilderProps {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: TierList | null;
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

  const style: React.CSSProperties = overlay
    ? { cursor: 'grabbing' }
    : {
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : { ...listeners, ...attributes })}
    >
      <CharacterCard name={name} quality={char?.quality} disableLink />
    </div>
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

function UnrankedPool({
  children,
  filterHeader,
}: {
  children: React.ReactNode;
  filterHeader?: React.ReactNode;
}) {
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
        {filterHeader || (
          <Text size="sm" fw={600} c="dimmed">
            Unranked Characters
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

export default function TierListBuilder({
  characters,
  charMap,
  initialData,
}: TierListBuilderProps) {
  const [placements, setPlacements] = useState<Record<string, Tier>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) return;
    queueMicrotask(() => {
      setName(initialData.name);
      setAuthor(initialData.author);
      setCategoryName(initialData.content_type);
      setDescription(initialData.description || '');
      const p: Record<string, Tier> = {};
      const n: Record<string, string> = {};
      for (const entry of initialData.entries) {
        p[entry.character_name] = entry.tier;
        if (entry.note) n[entry.character_name] = entry.note;
      }
      setPlacements(p);
      setNotes(n);
    });
  }, [initialData]);

  const json = useMemo(() => {
    const result: TierList = {
      name: name || 'My Tier List',
      author: author || 'Anonymous',
      content_type: categoryName || 'PvE',
      description,
      entries: TIER_ORDER.flatMap((tier) =>
        Object.entries(placements)
          .filter(([, t]) => t === tier)
          .map(([character_name]) => ({
            character_name,
            tier,
            ...(notes[character_name] ? { note: notes[character_name] } : {}),
          }))
      ),
      last_updated: 0,
    };
    return JSON.stringify(result, null, 2);
  }, [placements, notes, name, author, categoryName, description]);

  const unrankedCharacters = useMemo(() => {
    return characters.filter((c) => !(c.name in placements));
  }, [characters, placements]);

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
    setNotes({});
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Stack gap="md">
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Tier list name..."
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
            value={categoryName}
            onChange={(e) => setCategoryName(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 120 }}
          />
          <Textarea
            placeholder="Description (optional)..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            autosize
            minRows={1}
            maxRows={4}
            style={{ width: '100%' }}
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
            size="sm"
            leftSection={<IoOpenOutline size={16} />}
            onClick={() => {
              const body = `**Paste your JSON below:**\n\n\`\`\`json\n${json}\n\`\`\`\n`;
              const url = `${GITHUB_REPO_URL}/issues/new?${new URLSearchParams({ title: '[Tier List] New tier list suggestion', body }).toString()}`;
              window.open(url, '_blank');
            }}
            disabled={Object.keys(placements).length === 0}
          >
            Submit Suggestion
          </Button>
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
                <div key={n} style={{ position: 'relative' }}>
                  <DraggableCharCard name={n} char={charMap.get(n)} />
                  <Popover position="top" withArrow trapFocus shadow="md">
                    <Popover.Target>
                      <ActionIcon
                        size="xs"
                        variant={notes[n] ? 'filled' : 'light'}
                        color={notes[n] ? 'blue' : 'gray'}
                        radius="xl"
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 'calc(50% - 40px)',
                        }}
                        title="Edit note"
                      >
                        <IoPencil size={10} />
                      </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <TextInput
                        size="xs"
                        placeholder="Add a note..."
                        value={notes[n] || ''}
                        onChange={(e) =>
                          setNotes((prev) => ({
                            ...prev,
                            [n]: e.currentTarget.value,
                          }))
                        }
                        style={{ width: 200 }}
                      />
                    </Popover.Dropdown>
                  </Popover>
                </div>
              ))}
            </TierDropZone>
          );
        })}

        <FilterableCharacterPool characters={unrankedCharacters}>
          {(filtered, filterHeader) => (
            <UnrankedPool filterHeader={filterHeader}>
              {filtered.map((c) => (
                <DraggableCharCard key={c.name} name={c.name} char={c} />
              ))}
            </UnrankedPool>
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
    </DndContext>
  );
}
