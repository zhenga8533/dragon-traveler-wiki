import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  Box,
  Button,
  CopyButton,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  IoAddOutline,
  IoCheckmark,
  IoClipboardOutline,
  IoCopy,
  IoOpenOutline,
  IoSwapVertical,
  IoTrash,
} from 'react-icons/io5';
import {
  DEFAULT_TIER_DEFINITIONS,
  getTierColor,
} from '../../../constants/colors';
import {
  DEFAULT_CONTENT_TYPE,
  normalizeContentType,
  type ContentType,
} from '../../../constants/content-types';
import {
  buildEmptyIssueBody,
  GITHUB_REPO_URL,
  MAX_GITHUB_ISSUE_URL_LENGTH,
} from '../../../constants/github';
import { BREAKPOINTS, STORAGE_KEY } from '../../../constants/ui';
import type { Character } from '../../../types/character';
import type { TierDefinition, TierList } from '../../../types/tier-list';
import {
  buildCharacterByIdentityMap,
  buildCharacterNameCounts,
  getCharacterBaseSlug,
  getCharacterByReferenceKey,
  getCharacterIdentityKey,
  resolveCharacterReferenceKey,
  toCharacterReferenceFromKey,
} from '../../../utils/character-route';
import {
  cloneRecordArrays,
  removeItemFromRecordArrays,
} from '../../../utils/dnd-list';
import { compareCharactersByQualityThenName } from '../../../utils/filter-characters';
import { showWarningToast } from '../../../utils/toast';
import FilterableCharacterPool from '../../character/FilterableCharacterPool';
import ConfirmActionModal from '../../common/ConfirmActionModal';
import SaveLoadSlots from '../../common/SaveLoadSlots';
import CharacterNoteButton from '../CharacterNoteButton';
import {
  DraggableCharCard,
  TierDropZone,
  TierListMetaFields,
  UnrankedPool,
} from './components';
import {
  getPastedTierListPatch,
  normalizeNote,
  normalizeTierListFromPartial,
} from './utils';

interface TierPlacements {
  [tier: string]: string[]; // tier -> ordered array of character identity keys
}

interface TierListBuilderProps {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: TierList | null;
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
  const [
    clearConfirmOpened,
    { open: openClearConfirm, close: closeClearConfirm },
  ] = useDisclosure(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [draftHydrated, setDraftHydrated] = useState(false);
  const characterNameCounts = useMemo(
    () => buildCharacterNameCounts(characters),
    [characters]
  );
  const characterByIdentity = useMemo(() => {
    return buildCharacterByIdentityMap(characters);
  }, [characters]);

  const getCharacterFromKey = useCallback(
    (characterKey: string) =>
      getCharacterByReferenceKey(characterKey, charMap, characterByIdentity),
    [characterByIdentity, charMap]
  );

  const getCharacterKeyFromReference = useCallback(
    (name: string, quality?: string) =>
      resolveCharacterReferenceKey(
        name,
        quality,
        characters,
        charMap,
        characterByIdentity
      ),
    [characterByIdentity, charMap, characters]
  );
  const handleCategoryChange = useCallback((value: string | null) => {
    setCategoryName(normalizeContentType(value, DEFAULT_CONTENT_TYPE));
  }, []);
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
      ? data.tiers.map((t) => ({
          name: t.name,
          note: normalizeNote(t.note) || '',
        }))
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
    const seenCharacters = new Set<string>();
    for (const entry of data.entries) {
      const characterKey = getCharacterKeyFromReference(
        entry.character_name,
        entry.character_quality
      );
      if (seenCharacters.has(characterKey)) continue;
      seenCharacters.add(characterKey);
      if (p[entry.tier] !== undefined) {
        p[entry.tier].push(characterKey);
      }
      const normalizedEntryNote = normalizeNote(entry.note);
      if (normalizedEntryNote) n[characterKey] = normalizedEntryNote;
    }
    setPlacements(p);
    setNotes(n);
  }

  function handlePasteApply() {
    try {
      const parsed = JSON.parse(pasteText) as unknown;
      const partialTierList = getPastedTierListPatch(parsed);
      if (!partialTierList) {
        setPasteError(
          'Invalid tier list JSON: expected an object or an entries array.'
        );
        return;
      }

      const currentTierList = JSON.parse(json) as TierList;
      const mergedTierList = normalizeTierListFromPartial(
        partialTierList,
        currentTierList
      );
      loadFromTierList(mergedTierList);
      closePasteModal();
      setPasteText('');
      setPasteError('');
    } catch {
      setPasteError(
        'Could not parse JSON. Paste a JSON object, a one-item tier list array, or an entries array.'
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
      queueMicrotask(() => {
        setDraftHydrated(true);
      });
      return;
    }

    const storedDraft = window.localStorage.getItem(
      STORAGE_KEY.TIER_LIST_BUILDER_DRAFT
    );
    if (storedDraft) {
      try {
        const parsedDraft = JSON.parse(storedDraft) as TierList;
        if (Array.isArray(parsedDraft.entries)) {
          queueMicrotask(() => {
            loadFromTierList(parsedDraft);
          });
        } else {
          window.localStorage.removeItem(STORAGE_KEY.TIER_LIST_BUILDER_DRAFT);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY.TIER_LIST_BUILDER_DRAFT);
      }
    }

    queueMicrotask(() => {
      setDraftHydrated(true);
    });
  }, [initialData]);

  const deferredName = useDeferredValue(name);
  const deferredAuthor = useDeferredValue(author);
  const deferredDescription = useDeferredValue(description);
  const deferredCategoryName = useDeferredValue(categoryName);

  const json = (() => {
    const result: TierList = {
      name: deferredName || 'My Tier List',
      author: deferredAuthor || 'Anonymous',
      content_type: deferredCategoryName,
      description: deferredDescription,
      tiers: tierDefs.map(({ name: tierName, note }) => ({
        name: tierName,
        ...(note ? { note } : {}),
      })),
      entries: tierDefs.flatMap(({ name: tierName }) =>
        (placements[tierName] || []).map((characterKey) => ({
          ...toCharacterReferenceFromKey(
            characterKey,
            charMap,
            characterByIdentity,
            characterNameCounts
          ),
          tier: tierName,
          ...(notes[characterKey] ? { note: notes[characterKey] } : {}),
        }))
      ),
      last_updated: 0,
    };
    return JSON.stringify(result, null, 2);
  })();

  const unrankedCharacters = useMemo(() => {
    const placed = new Set(Object.values(placements).flat());
    return characters.filter((c) => !placed.has(getCharacterIdentityKey(c)));
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
    const charKey = event.active.id as string;
    const overId = event.over?.id as string | undefined;

    if (!overId) return;

    const activeTier = event.active.data.current?.tier as string | undefined;

    // Drop on unranked pool
    if (overId === 'unranked') {
      if (activeTier) {
        setPlacements((prev) => {
          const next = { ...prev };
          next[activeTier] = next[activeTier].filter((n) => n !== charKey);
          return next;
        });
        setNotes((prev) => {
          if (!(charKey in prev)) return prev;
          const next = { ...prev };
          delete next[charKey];
          return next;
        });
      }
      return;
    }

    // Drop on a character (swap within tier or move to new tier)
    if (overId.startsWith('char-')) {
      const targetCharName = event.over?.data.current?.characterKey as
        | string
        | undefined;
      const targetTier = event.over?.data.current?.tier as string | undefined;

      if (!targetCharName) return;

      // Dropped onto an unranked character card: remove from ranked tier
      if (!targetTier) {
        if (activeTier) {
          setPlacements((prev) => {
            const next = cloneRecordArrays(prev) as TierPlacements;
            const activeIndex = next[activeTier].indexOf(charKey);
            if (activeIndex === -1) return next;
            next[activeTier][activeIndex] = targetCharName;
            return next;
          });
          setNotes((prev) => {
            if (!(charKey in prev)) return prev;
            const next = { ...prev };
            delete next[charKey];
            return next;
          });
        }
        return;
      }

      // If dropping on itself, do nothing
      if (charKey === targetCharName) return;

      setPlacements((prev) => {
        const next = cloneRecordArrays(prev) as TierPlacements;
        const targetIndex = next[targetTier].indexOf(targetCharName);
        if (targetIndex === -1) return next;

        if (activeTier) {
          const activeIndex = next[activeTier].indexOf(charKey);
          if (activeIndex === -1) return next;

          if (activeTier === targetTier) {
            next[targetTier][activeIndex] = targetCharName;
            next[targetTier][targetIndex] = charKey;
            return next;
          }

          next[activeTier] = next[activeTier].filter((n) => n !== charKey);
          next[targetTier][targetIndex] = charKey;
          next[activeTier].push(targetCharName);
          return next;
        }

        removeItemFromRecordArrays(next, charKey);
        next[targetTier][targetIndex] = charKey;

        return next;
      });
      return;
    }

    // Drop on a tier zone
    if (overId.startsWith('tier-')) {
      const tier = overId.replace('tier-', '');
      setPlacements((prev) => {
        const next = cloneRecordArrays(prev) as TierPlacements;
        removeItemFromRecordArrays(next, charKey);
        if (!next[tier]) next[tier] = [];
        next[tier].push(charKey);
        return next;
      });
    }
  }

  function handleSort() {
    setPlacements((prev) => {
      const next: TierPlacements = {};
      for (const { name: tier } of tierDefs) {
        next[tier] = [...(prev[tier] || [])].sort((a, b) => {
          const charA = getCharacterFromKey(a);
          const charB = getCharacterFromKey(b);
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
    const normalized = note.trim();
    setTierDefs((prev) =>
      prev.map((t) =>
        t.name === tierName
          ? { ...t, note: normalized.length > 0 ? normalized : '' }
          : t
      )
    );
  }

  function handleDeleteTier(tierName: string) {
    const removedCharacters = placements[tierName] || [];
    setTierDefs((prev) => prev.filter((t) => t.name !== tierName));
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[tierName];
      return next;
    });
    if (removedCharacters.length > 0) {
      setNotes((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const removedCharacter of removedCharacters) {
          if (removedCharacter in next) {
            delete next[removedCharacter];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
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
        <TierListMetaFields
          name={name}
          author={author}
          categoryName={categoryName}
          description={description}
          onNameCommit={setName}
          onAuthorCommit={setAuthor}
          onCategoryChange={handleCategoryChange}
          onDescriptionCommit={setDescription}
        />

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
            <SaveLoadSlots<TierList>
              storageKey={STORAGE_KEY.TIER_LIST_BUILDER_SLOTS}
              numSlots={3}
              currentJson={json}
              onLoad={loadFromTierList}
              defaultName="My Tier List"
              renderSlotDetail={(t) => {
                const n = t.entries?.length ?? 0;
                return `${n} entr${n !== 1 ? 'ies' : 'y'}`;
              }}
            />
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
                  showWarningToast({
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
              onClick={openClearConfirm}
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
              {names.map((n) => {
                const character = getCharacterFromKey(n);
                const isDuplicate = character && (characterNameCounts.get(getCharacterBaseSlug(character.name)) ?? 1) > 1;
                return (
                  <Box
                    key={n}
                    style={{ position: 'relative', display: 'inline-block' }}
                  >
                    <DraggableCharCard
                      name={character?.name ?? n}
                      label={isDuplicate && character ? `${character.name} (${character.quality})` : undefined}
                      charKey={n}
                      char={character}
                      tier={tier}
                      size={isMobile ? 56 : undefined}
                    />
                    <CharacterNoteButton
                      value={notes[n] || ''}
                      onCommit={(value) => {
                        const normalized = value.trim();
                        setNotes((prev) => {
                          const next = { ...prev };
                          if (normalized.length > 0) {
                            next[n] = normalized;
                          } else {
                            delete next[n];
                          }
                          return next;
                        });
                      }}
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: 'calc(50% + 24px)',
                        transform: 'translateX(-50%)',
                      }}
                    />
                  </Box>
                );
              })}
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
              {filtered.map((c) => {
                const isDuplicate = (characterNameCounts.get(getCharacterBaseSlug(c.name)) ?? 1) > 1;
                return (
                  <DraggableCharCard
                    key={getCharacterIdentityKey(c)}
                    name={c.name}
                    label={isDuplicate ? `${c.name} (${c.quality})` : undefined}
                    charKey={getCharacterIdentityKey(c)}
                    char={c}
                    size={isMobile ? 56 : undefined}
                  />
                );
              })}
            </UnrankedPool>
          )}
        </FilterableCharacterPool>
      </Stack>

      {typeof document !== 'undefined'
        ? createPortal(
            <DragOverlay dropAnimation={null}>
              {activeId ? (() => {
                const activeChar = getCharacterFromKey(activeId);
                const isDuplicate = activeChar && (characterNameCounts.get(getCharacterBaseSlug(activeChar.name)) ?? 1) > 1;
                return (
                  <DraggableCharCard
                    name={activeChar?.name ?? activeId}
                    label={isDuplicate && activeChar ? `${activeChar.name} (${activeChar.quality})` : undefined}
                    charKey={activeId}
                    char={activeChar}
                    overlay
                  />
                );
              })() : null}
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

      <ConfirmActionModal
        opened={clearConfirmOpened}
        onCancel={closeClearConfirm}
        title="Clear tier list builder?"
        message="This will remove all ranked characters, notes, and custom tier changes in the builder."
        confirmLabel="Clear All"
        confirmColor="red"
        onConfirm={() => {
          handleClear();
          closeClearConfirm();
        }}
      />
    </DndContext>
  );
}
