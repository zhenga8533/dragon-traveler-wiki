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
  Modal,
  Paper,
  Popover,
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
  IoClipboardOutline,
  IoCopy,
  IoOpenOutline,
  IoPencil,
  IoSwapVertical,
  IoTrash,
} from 'react-icons/io5';
import {
  buildEmptyIssueBody,
  GITHUB_REPO_URL,
  MAX_GITHUB_ISSUE_URL_LENGTH,
} from '../constants';
import { TIER_COLOR, TIER_ORDER } from '../constants/colors';
import {
  CONTENT_TYPE_OPTIONS,
  DEFAULT_CONTENT_TYPE,
  normalizeContentType,
  type ContentType,
} from '../constants/content-types';
import { CHARACTER_GRID_SPACING } from '../constants/ui';
import type { Character } from '../types/character';
import type { Tier, TierList } from '../types/tier-list';
import { compareCharactersByQualityThenName } from '../utils/filter-characters';
import CharacterCard from './CharacterCard';
import FilterableCharacterPool from './FilterableCharacterPool';

interface TierPlacements {
  [tier: string]: string[]; // tier -> ordered array of character names
}
interface TierListBuilderProps {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: TierList | null;
}

function DraggableCharCard({
  name,
  char,
  overlay,
  tier,
}: {
  name: string;
  char: Character | undefined;
  overlay?: boolean;
  tier?: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: name,
    data: { tier },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `char-${name}`,
    data: { characterName: name, tier },
  });

  const style: React.CSSProperties = overlay
    ? { cursor: 'grabbing' }
    : {
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'opacity 150ms ease',
      };

  return (
    <div
      ref={(node) => {
        if (!overlay) {
          setNodeRef(node);
          setDropRef(node);
        }
      }}
      style={{
        ...style,
        outline:
          isOver && !overlay
            ? '2px solid var(--mantine-color-blue-5)'
            : undefined,
        borderRadius: 4,
      }}
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
  const [placements, setPlacements] = useState<TierPlacements>(() => {
    const init: TierPlacements = {};
    TIER_ORDER.forEach((tier) => {
      init[tier] = [];
    });
    return init;
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryName, setCategoryName] =
    useState<ContentType>(DEFAULT_CONTENT_TYPE);
  const [description, setDescription] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pasteModalOpened, { open: openPasteModal, close: closePasteModal }] =
    useDisclosure(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');

  function handlePasteApply() {
    try {
      const data = JSON.parse(pasteText) as TierList;
      if (!Array.isArray(data.entries)) {
        setPasteError('Invalid tier list JSON: "entries" must be an array.');
        return;
      }
      setName(data.name || '');
      setAuthor(data.author || '');
      setCategoryName(normalizeContentType(data.content_type));
      setDescription(data.description || '');
      const p: TierPlacements = {};
      TIER_ORDER.forEach((tier) => {
        p[tier] = [];
      });
      const n: Record<string, string> = {};
      for (const entry of data.entries) {
        if (TIER_ORDER.includes(entry.tier as Tier)) {
          p[entry.tier].push(entry.character_name);
        }
        if (entry.note) n[entry.character_name] = entry.note;
      }
      setPlacements(p);
      setNotes(n);
      closePasteModal();
      setPasteText('');
      setPasteError('');
    } catch {
      setPasteError('Could not parse JSON. Please check the format and try again.');
    }
  }

  useEffect(() => {
    if (!initialData) return;
    queueMicrotask(() => {
      setName(initialData.name);
      setAuthor(initialData.author);
      setCategoryName(normalizeContentType(initialData.content_type));
      setDescription(initialData.description || '');
      const p: TierPlacements = {};
      TIER_ORDER.forEach((tier) => {
        p[tier] = [];
      });
      const n: Record<string, string> = {};
      for (const entry of initialData.entries) {
        p[entry.tier].push(entry.character_name);
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
      content_type: categoryName,
      description,
      entries: TIER_ORDER.flatMap((tier) =>
        placements[tier].map((character_name) => ({
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
    const placed = new Set(TIER_ORDER.flatMap((tier) => placements[tier]));
    return characters.filter((c) => !placed.has(c.name));
  }, [characters, placements]);

  const tierListIssueQuery = useMemo(() => {
    const body = `**Paste your JSON below:**\n\n\`\`\`json\n${json}\n\`\`\`\n`;
    return new URLSearchParams({
      title: '[Tier List] New tier list suggestion',
      body,
    }).toString();
  }, [json]);

  const tierListIssueUrl = useMemo(() => {
    const url = `${GITHUB_REPO_URL}/issues/new?${tierListIssueQuery}`;
    if (url.length > MAX_GITHUB_ISSUE_URL_LENGTH) return null;
    return url;
  }, [tierListIssueQuery]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const charName = event.active.id as string;
    const overId = event.over?.id as string | undefined;

    if (!overId) return;

    const activeTier = event.active.data.current?.tier as string | undefined;

    // Drop on unranked pool
    if (overId === 'unranked') {
      if (activeTier) {
        setPlacements((prev) => {
          const next = { ...prev };
          next[activeTier] = next[activeTier].filter((n) => n !== charName);
          return next;
        });
      }
      return;
    }

    // Drop on a character (swap within tier or move to new tier)
    if (overId.startsWith('char-')) {
      const targetCharName = event.over?.data.current?.characterName as
        | string
        | undefined;
      const targetTier = event.over?.data.current?.tier as string | undefined;

      if (!targetCharName) return;

      // Dropped onto an unranked character card: remove from ranked tier
      if (!targetTier) {
        if (activeTier) {
          setPlacements((prev) => {
            const next = { ...prev };
            next[activeTier] = next[activeTier].filter((n) => n !== charName);
            return next;
          });
        }
        return;
      }

      // If dropping on itself, do nothing
      if (charName === targetCharName) return;

      setPlacements((prev) => {
        const next = { ...prev };

        // If moving within the same tier, handle reordering
        if (activeTier === targetTier) {
          const currentIndex = next[targetTier].indexOf(charName);
          const targetIndex = next[targetTier].indexOf(targetCharName);

          if (currentIndex !== -1 && targetIndex !== -1) {
            // Remove from current position
            next[targetTier] = next[targetTier].filter((n) => n !== charName);
            // Find new target index after removal
            const newTargetIndex = next[targetTier].indexOf(targetCharName);
            // Insert at the target position
            next[targetTier].splice(newTargetIndex, 0, charName);
          }
        } else {
          // Moving between different tiers
          // Remove from current position
          if (activeTier) {
            next[activeTier] = next[activeTier].filter((n) => n !== charName);
          }

          // Add to new position
          const targetIndex = next[targetTier].indexOf(targetCharName);
          if (targetIndex !== -1) {
            // Insert at the target position
            next[targetTier].splice(targetIndex, 0, charName);
          } else {
            // Target not found, add at end
            next[targetTier].push(charName);
          }
        }

        return next;
      });
      return;
    }

    // Drop on a tier zone
    if (overId.startsWith('tier-')) {
      const tier = overId.replace('tier-', '') as Tier;
      setPlacements((prev) => {
        const next = { ...prev };

        // Remove from current tier if exists
        if (activeTier && activeTier !== tier) {
          next[activeTier] = next[activeTier].filter((n) => n !== charName);
        }

        // Add to new tier if not already there
        if (!next[tier].includes(charName)) {
          next[tier].push(charName);
        }

        return next;
      });
    }
  }

  function handleSort() {
    setPlacements((prev) => {
      const next: TierPlacements = {};
      for (const tier of TIER_ORDER) {
        next[tier] = [...prev[tier]].sort((a, b) => {
          const charA = charMap.get(a);
          const charB = charMap.get(b);
          if (!charA && !charB) return a.localeCompare(b);
          if (!charA) return 1;
          if (!charB) return -1;
          return compareCharactersByQualityThenName(charA, charB);
        });
      }
      return next;
    });
  }

  function handleClear() {
    setPlacements(() => {
      const init: TierPlacements = {};
      TIER_ORDER.forEach((tier) => {
        init[tier] = [];
      });
      return init;
    });
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
          <Select
            placeholder="Content type..."
            data={CONTENT_TYPE_OPTIONS.map((contentTypeOption) => ({
              value: contentTypeOption,
              label: contentTypeOption,
            }))}
            value={categoryName}
            onChange={(value) =>
              setCategoryName(normalizeContentType(value, DEFAULT_CONTENT_TYPE))
            }
            allowDeselect={false}
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
        </Group>

        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="sm" wrap="wrap">
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
              leftSection={<IoClipboardOutline size={16} />}
              onClick={openPasteModal}
            >
              Paste JSON
            </Button>
            <Button
              variant="light"
              size="sm"
              leftSection={<IoSwapVertical size={16} />}
              onClick={handleSort}
              disabled={TIER_ORDER.every((tier) => placements[tier].length === 0)}
            >
              Sort Tiers
            </Button>
          </Group>
          <Group gap="sm" wrap="wrap">
            <Button
              variant="light"
              size="sm"
              leftSection={<IoOpenOutline size={16} />}
              onClick={() => {
                if (!tierListIssueUrl) {
                  // URL too long, open issue with template but empty JSON
                  const emptyUrl = `${GITHUB_REPO_URL}/issues/new?${new URLSearchParams({ title: '[Tier List] New tier list suggestion', body: buildEmptyIssueBody('tier list') }).toString()}`;
                  window.open(emptyUrl, '_blank');
                  notifications.show({
                    color: 'yellow',
                    title: 'Tier list JSON is too large',
                    message:
                      'Please copy the JSON using the Copy JSON button and paste it into the GitHub issue body.',
                    autoClose: 8000,
                  });
                  return;
                }

                window.open(tierListIssueUrl, '_blank');
              }}
              disabled={TIER_ORDER.every((tier) => placements[tier].length === 0)}
            >
              Submit Suggestion
            </Button>
            <Button
              variant="light"
              color="red"
              size="sm"
              leftSection={<IoTrash size={16} />}
              onClick={handleClear}
              disabled={TIER_ORDER.every((tier) => placements[tier].length === 0)}
            >
              Clear All
            </Button>
          </Group>
        </Group>

        {TIER_ORDER.map((tier) => {
          const names = placements[tier] || [];

          return (
            <TierDropZone
              key={tier}
              id={`tier-${tier}`}
              label={`${tier} Tier`}
              color={TIER_COLOR[tier]}
            >
              {names.map((n) => (
                <div key={n} style={{ position: 'relative' }}>
                  <DraggableCharCard
                    name={n}
                    char={charMap.get(n)}
                    tier={tier}
                  />
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
                        aria-label="Edit note"
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

      <Modal
        opened={pasteModalOpened}
        onClose={() => {
          closePasteModal();
          setPasteText('');
          setPasteError('');
        }}
        title="Paste Tier List JSON"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Paste a tier list JSON object below to load it into the builder.
          </Text>
          <Textarea
            placeholder={'{\n  "name": "...",\n  "entries": [...]\n}'}
            value={pasteText}
            onChange={(e) => {
              setPasteText(e.currentTarget.value);
              setPasteError('');
            }}
            minRows={8}
            maxRows={20}
            autosize
            error={pasteError || undefined}
            styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
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
