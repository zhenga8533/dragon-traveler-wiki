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
  Modal,
  Paper,
  Popover,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IoAddOutline,
  IoCheckmark,
  IoChevronDown,
  IoChevronUp,
  IoClipboardOutline,
  IoCopy,
  IoOpenOutline,
  IoSwapVertical,
  IoTrash,
} from 'react-icons/io5';
import { DEFAULT_TIER_DEFINITIONS, getTierColor } from '../../constants/colors';
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
import type { Character } from '../../types/character';
import type { TierDefinition, TierList } from '../../types/tier-list';
import {
  cloneRecordArrays,
  removeItemFromRecordArrays,
} from '../../utils/dnd-list';
import { compareCharactersByQualityThenName } from '../../utils/filter-characters';
import CharacterCard from '../character/CharacterCard';
import FilterableCharacterPool from '../character/FilterableCharacterPool';
import CharacterNoteButton from './CharacterNoteButton';

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
  size,
}: {
  name: string;
  char: Character | undefined;
  overlay?: boolean;
  tier?: string;
  size?: number;
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
        transition: `opacity ${TRANSITION.FAST} ${TRANSITION.EASE}`,
        touchAction: 'none',
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
        borderRadius: 'var(--mantine-radius-xs)',
      }}
      {...(overlay ? {} : { ...listeners, ...attributes })}
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

function TierDropZone({
  id,
  label,
  color,
  note,
  onNoteChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  canDelete,
  children,
}: {
  id: string;
  label: string;
  color: string;
  note?: string;
  onNoteChange: (note: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  canDelete: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Paper
      ref={setNodeRef}
      p="md"
      radius="md"
      withBorder
      {...getCardHoverProps({
        style: {
          borderColor: isOver ? `var(--mantine-color-${color}-5)` : undefined,
          borderWidth: isOver ? 2 : undefined,
          transition: `border-color ${TRANSITION.FAST} ${TRANSITION.EASE}`,
        },
      })}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Badge variant="filled" color={color} size="lg" radius="sm">
              {label}
            </Badge>
            <TierNotePopover
              value={note || ''}
              onCommit={onNoteChange}
              placeholder="Add a tier note..."
              emptyLabel="Add a tier note..."
              editorMinWidth={200}
              editorMaxWidth={320}
              align="left"
            />
          </Stack>
          <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip
              label={isFirst ? 'Already at top tier' : 'Move tier up'}
              withArrow
              withinPortal
            >
              <ActionIcon
                size="sm"
                radius="md"
                variant="light"
                color="blue"
                onClick={onMoveUp}
                disabled={isFirst}
                aria-label="Move tier up"
              >
                <IoChevronUp size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip
              label={isLast ? 'Already at bottom tier' : 'Move tier down'}
              withArrow
              withinPortal
            >
              <ActionIcon
                size="sm"
                radius="md"
                variant="light"
                color="blue"
                onClick={onMoveDown}
                disabled={isLast}
                aria-label="Move tier down"
              >
                <IoChevronDown size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip
              label={
                canDelete ? 'Delete tier' : 'At least one tier is required'
              }
              withArrow
              withinPortal
            >
              <ActionIcon
                size="sm"
                radius="md"
                variant="light"
                color="red"
                onClick={onDelete}
                disabled={!canDelete}
                aria-label="Delete tier"
              >
                <IoTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
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

function TierNotePopover({
  value,
  onCommit,
  placeholder = 'Add a note...',
  emptyLabel = '+ note',
  editorMinWidth = 180,
  editorMaxWidth = 220,
  align = 'center',
}: {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  editorMinWidth?: number;
  editorMaxWidth?: number;
  align?: 'left' | 'center';
}) {
  const [opened, setOpened] = useState(false);
  const [draftValue, setDraftValue] = useState(value);

  function commitAndClose() {
    if (draftValue !== value) {
      onCommit(draftValue);
    }
    setOpened(false);
  }

  const isLeftAligned = align === 'left';

  return (
    <Popover
      opened={opened}
      onChange={(nextOpened) => {
        if (nextOpened) {
          setDraftValue(value);
        }
        setOpened(nextOpened);
      }}
      position={isLeftAligned ? 'bottom-start' : 'bottom'}
      withArrow
      shadow="md"
      withinPortal
      zIndex={400}
      offset={6}
    >
      <Popover.Target>
        <div
          role="button"
          tabIndex={0}
          style={{
            cursor: 'pointer',
            padding: '2px 4px',
            textAlign: align,
            display: 'inline-block',
            width: 'fit-content',
            maxWidth: '100%',
            alignSelf: isLeftAligned ? 'flex-start' : 'center',
          }}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={() => setOpened((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpened((prev) => !prev);
            }
          }}
        >
          <Text
            size="xs"
            c={value ? 'blue' : 'dimmed'}
            lineClamp={1}
            style={{ opacity: value ? 1 : 0.45 }}
          >
            {value || emptyLabel}
          </Text>
        </div>
      </Popover.Target>
      <Popover.Dropdown p="xs">
        <Textarea
          size="xs"
          placeholder={placeholder}
          value={draftValue}
          onChange={(e) => setDraftValue(e.currentTarget.value)}
          onBlur={commitAndClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraftValue(value);
              setOpened(false);
            }
          }}
          autosize
          minRows={1}
          maxRows={3}
          styles={{
            input: {
              minWidth: editorMinWidth,
              maxWidth: editorMaxWidth,
              lineHeight: 1.35,
              opacity: draftValue ? 1 : 0.9,
            },
          }}
        />
      </Popover.Dropdown>
    </Popover>
  );
}

function UnrankedPool({
  children,
  filterHeader,
  paginationControl,
}: {
  children: React.ReactNode;
  filterHeader?: React.ReactNode;
  paginationControl?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unranked' });

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
        {paginationControl}
      </Stack>
    </Paper>
  );
}

export default function TierListBuilder({
  characters,
  charMap,
  initialData,
}: TierListBuilderProps) {
  const [tierDefs, setTierDefs] = useState<TierDefinition[]>(() =>
    DEFAULT_TIER_DEFINITIONS.map((t) => ({ ...t }))
  );
  const [placements, setPlacements] = useState<TierPlacements>(() => {
    const init: TierPlacements = {};
    DEFAULT_TIER_DEFINITIONS.forEach((t) => {
      init[t.name] = [];
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
  const [newTierName, setNewTierName] = useState('');
  const [newTierNote, setNewTierNote] = useState('');
  const [pasteModalOpened, { open: openPasteModal, close: closePasteModal }] =
    useDisclosure(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [draftHydrated, setDraftHydrated] = useState(false);
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    })
  );

  function loadFromTierList(data: TierList) {
    setName(data.name || '');
    setAuthor(data.author || '');
    setCategoryName(normalizeContentType(data.content_type));
    setDescription(data.description || '');

    const baseDefs: TierDefinition[] = data.tiers?.length
      ? data.tiers.map((t) => ({ name: t.name, note: t.note || '' }))
      : DEFAULT_TIER_DEFINITIONS.map((t) => ({ ...t }));

    // Also add any tiers referenced by entries but not in baseDefs
    const tierNameSet = new Set(baseDefs.map((t) => t.name));
    const extraDefs: TierDefinition[] = [];
    for (const entry of data.entries) {
      if (!tierNameSet.has(entry.tier)) {
        extraDefs.push({ name: entry.tier, note: '' });
        tierNameSet.add(entry.tier);
      }
    }
    const allDefs = [...baseDefs, ...extraDefs];
    setTierDefs(allDefs);

    const p: TierPlacements = {};
    allDefs.forEach((t) => {
      p[t.name] = [];
    });
    const n: Record<string, string> = {};
    for (const entry of data.entries) {
      if (p[entry.tier] !== undefined) {
        p[entry.tier].push(entry.character_name);
      }
      if (entry.note) n[entry.character_name] = entry.note;
    }
    setPlacements(p);
    setNotes(n);
  }

  function handlePasteApply() {
    try {
      const data = JSON.parse(pasteText) as TierList;
      if (!Array.isArray(data.entries)) {
        setPasteError('Invalid tier list JSON: "entries" must be an array.');
        return;
      }
      loadFromTierList(data);
      closePasteModal();
      setPasteText('');
      setPasteError('');
    } catch {
      setPasteError(
        'Could not parse JSON. Please check the format and try again.'
      );
    }
  }

  useEffect(() => {
    if (initialData) {
      queueMicrotask(() => {
        loadFromTierList(initialData);
        setDraftHydrated(true);
      });
      return;
    }

    if (typeof window === 'undefined') {
      setDraftHydrated(true);
      return;
    }

    const storedDraft = window.localStorage.getItem(
      STORAGE_KEY.TIER_LIST_BUILDER_DRAFT
    );
    if (storedDraft) {
      try {
        const parsedDraft = JSON.parse(storedDraft) as TierList;
        if (Array.isArray(parsedDraft.entries)) {
          loadFromTierList(parsedDraft);
        } else {
          window.localStorage.removeItem(STORAGE_KEY.TIER_LIST_BUILDER_DRAFT);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY.TIER_LIST_BUILDER_DRAFT);
      }
    }

    setDraftHydrated(true);
  }, [initialData]);

  const json = useMemo(() => {
    const result: TierList = {
      name: name || 'My Tier List',
      author: author || 'Anonymous',
      content_type: categoryName,
      description,
      tiers: tierDefs.map(({ name: tierName, note }) => ({
        name: tierName,
        ...(note ? { note } : {}),
      })),
      entries: tierDefs.flatMap(({ name: tierName }) =>
        (placements[tierName] || []).map((character_name) => ({
          character_name,
          tier: tierName,
          ...(notes[character_name] ? { note: notes[character_name] } : {}),
        }))
      ),
      last_updated: 0,
    };
    return JSON.stringify(result, null, 2);
  }, [placements, notes, name, author, categoryName, description, tierDefs]);

  const unrankedCharacters = useMemo(() => {
    const placed = new Set(Object.values(placements).flat());
    return characters.filter((c) => !placed.has(c.name));
  }, [characters, placements]);

  const hasAnyPlaced = useMemo(
    () => Object.values(placements).some((chars) => chars.length > 0),
    [placements]
  );

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

  useEffect(() => {
    if (!draftHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY.TIER_LIST_BUILDER_DRAFT, json);
  }, [draftHydrated, json]);

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
            const next = cloneRecordArrays(prev) as TierPlacements;
            next[activeTier] = next[activeTier].filter((n) => n !== charName);
            return next;
          });
        }
        return;
      }

      // If dropping on itself, do nothing
      if (charName === targetCharName) return;

      setPlacements((prev) => {
        const next = cloneRecordArrays(prev) as TierPlacements;
        const targetIndex = next[targetTier].indexOf(targetCharName);
        if (targetIndex === -1) return next;

        if (activeTier) {
          const activeIndex = next[activeTier].indexOf(charName);
          if (activeIndex === -1) return next;

          if (activeTier === targetTier) {
            next[targetTier][activeIndex] = targetCharName;
            next[targetTier][targetIndex] = charName;
            return next;
          }

          next[activeTier] = next[activeTier].filter((n) => n !== charName);
          next[targetTier][targetIndex] = charName;
          next[activeTier].push(targetCharName);
          return next;
        }

        removeItemFromRecordArrays(next, charName);
        next[targetTier][targetIndex] = charName;

        return next;
      });
      return;
    }

    // Drop on a tier zone
    if (overId.startsWith('tier-')) {
      const tier = overId.replace('tier-', '');
      setPlacements((prev) => {
        const next = cloneRecordArrays(prev) as TierPlacements;
        removeItemFromRecordArrays(next, charName);
        if (!next[tier]) next[tier] = [];
        next[tier].push(charName);
        return next;
      });
    }
  }

  function handleSort() {
    setPlacements((prev) => {
      const next: TierPlacements = {};
      for (const { name: tier } of tierDefs) {
        next[tier] = [...(prev[tier] || [])].sort((a, b) => {
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
    const defaultDefs = DEFAULT_TIER_DEFINITIONS.map((t) => ({ ...t }));
    setTierDefs(defaultDefs);
    setPlacements(() => {
      const init: TierPlacements = {};
      defaultDefs.forEach((t) => {
        init[t.name] = [];
      });
      return init;
    });
    setNotes({});
  }

  function handleTierNoteChange(tierName: string, note: string) {
    setTierDefs((prev) =>
      prev.map((t) => (t.name === tierName ? { ...t, note } : t))
    );
  }

  function handleDeleteTier(tierName: string) {
    setTierDefs((prev) => prev.filter((t) => t.name !== tierName));
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[tierName];
      return next;
    });
  }

  function handleMoveTierUp(index: number) {
    if (index === 0) return;
    setTierDefs((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function handleMoveTierDown(index: number) {
    setTierDefs((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function handleAddTier() {
    const trimmed = newTierName.trim();
    if (!trimmed) return;
    if (tierDefs.some((t) => t.name === trimmed)) return;
    setTierDefs((prev) => [
      ...prev,
      { name: trimmed, note: newTierNote.trim() || undefined },
    ]);
    setPlacements((prev) => ({ ...prev, [trimmed]: [] }));
    setNewTierName('');
    setNewTierNote('');
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
          <Group gap="sm" wrap="wrap" align="center">
            <CopyButton value={json}>
              {({ copied, copy }) => (
                <Button
                  variant="light"
                  size="sm"
                  leftSection={
                    copied ? <IoCheckmark size={16} /> : <IoCopy size={16} />
                  }
                  onClick={() => {
                    copy();
                  }}
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
              disabled={!hasAnyPlaced}
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
              disabled={!hasAnyPlaced}
            >
              Submit Suggestion
            </Button>
            <Button
              variant="light"
              color="red"
              size="sm"
              leftSection={<IoTrash size={16} />}
              onClick={handleClear}
              disabled={!hasAnyPlaced}
            >
              Clear All
            </Button>
          </Group>
        </Group>

        {tierDefs.map((tierDef, index) => {
          const tier = tierDef.name;
          const names = placements[tier] || [];
          const color = getTierColor(tier, index);

          return (
            <TierDropZone
              key={tier}
              id={`tier-${tier}`}
              label={`${tier} Tier`}
              color={color}
              note={tierDef.note}
              onNoteChange={(note) => handleTierNoteChange(tier, note)}
              onDelete={() => handleDeleteTier(tier)}
              onMoveUp={() => handleMoveTierUp(index)}
              onMoveDown={() => handleMoveTierDown(index)}
              isFirst={index === 0}
              isLast={index === tierDefs.length - 1}
              canDelete={tierDefs.length > 1}
            >
              {names.map((n) => (
                <Box
                  key={n}
                  style={{ position: 'relative', display: 'inline-block' }}
                >
                  <DraggableCharCard
                    name={n}
                    char={charMap.get(n)}
                    tier={tier}
                    size={isMobile ? 56 : undefined}
                  />
                  <CharacterNoteButton
                    value={notes[n] || ''}
                    onCommit={(value) => {
                      setNotes((prev) => ({ ...prev, [n]: value }));
                    }}
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 'calc(50% + 24px)',
                      transform: 'translateX(-50%)',
                    }}
                  />
                </Box>
              ))}
            </TierDropZone>
          );
        })}

        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="New tier name (e.g. F)"
            value={newTierName}
            onChange={(e) => setNewTierName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTier();
            }}
            size="sm"
            style={{ width: 150 }}
          />
          <TextInput
            placeholder="Tier note (optional)"
            value={newTierNote}
            onChange={(e) => setNewTierNote(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTier();
            }}
            size="sm"
            style={{ flex: 1, minWidth: 140 }}
          />
          <Button
            size="sm"
            variant="light"
            leftSection={<IoAddOutline size={14} />}
            onClick={handleAddTier}
            disabled={
              !newTierName.trim() ||
              tierDefs.some((t) => t.name === newTierName.trim())
            }
          >
            Add Tier
          </Button>
        </Group>

        <FilterableCharacterPool characters={unrankedCharacters}>
          {(filtered, filterHeader, paginationControl) => (
            <UnrankedPool
              filterHeader={filterHeader}
              paginationControl={paginationControl}
            >
              {filtered.map((c) => (
                <DraggableCharCard
                  key={c.name}
                  name={c.name}
                  char={c}
                  size={isMobile ? 56 : undefined}
                />
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
