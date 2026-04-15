import { DEFAULT_TIER_DEFINITIONS } from '@/constants/colors';
import {
  DEFAULT_CONTENT_TYPE,
  normalizeContentType,
  type ContentType,
} from '@/constants/content-types';
import { STORAGE_KEY } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import {
  getCharacterBaseSlug,
  getCharacterByReferenceKey,
  getCharacterIdentityKey,
  resolveCharacterReferenceKey,
  toCharacterReferenceFromKey,
} from '@/features/characters/utils/character-route';
import { compareCharactersByQualityThenName } from '@/features/characters/utils/filter-characters';
import type { TierExportRow } from '@/features/tier-list/components/TierListBuilder/ExportView';
import { normalizeNote } from '@/utils/normalize-note';
import {
  getPastedTierListPatch,
  normalizeTierListFromPartial,
} from '@/features/tier-list/components/TierListBuilder/utils';
import type {
  TierDefinition,
  TierList,
} from '@/features/tier-list/types';
import { removeItemFromRecordArrays } from '@/utils/dnd-list';
import { useCharacterResolution } from '@/hooks';
import type { Quality } from '@/types/quality';
import { showWarningToast } from '@/utils/toast';
import type {
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

const DEFAULT_TIER_LIST_NAME = 'My Tier List';
const DEFAULT_TIER_LIST_AUTHOR = 'Anonymous';

export type TierPlacements = Record<string, string[]>;

export interface TierListBuilderMetaState {
  name: string;
  author: string;
  categoryName: ContentType;
  description: string;
}

export interface TierListBuilderDraftState {
  newTierName: string;
  newTierNote: string;
}

export interface TierListBuilderState {
  tierDefs: TierDefinition[];
  placements: TierPlacements;
  notes: Record<string, string>;
  meta: TierListBuilderMetaState;
  drafts: TierListBuilderDraftState;
}

export type TierListBuilderAction =
  | { type: 'LOAD_TIER_LIST'; payload: TierListBuilderState }
  | { type: 'UPDATE_META'; patch: Partial<TierListBuilderMetaState> }
  | { type: 'SET_PLACEMENTS'; payload: TierPlacements }
  | { type: 'SET_CHARACTER_NOTE'; characterKey: string; note?: string }
  | { type: 'SET_TIER_NOTE'; tierName: string; note: string }
  | { type: 'ADD_TIER'; name: string; note?: string }
  | { type: 'DELETE_TIER'; tierName: string }
  | { type: 'MOVE_TIER'; fromIndex: number; toIndex: number }
  | { type: 'UPDATE_NEW_TIER_DRAFT'; patch: Partial<TierListBuilderDraftState> }
  | { type: 'RESET' };

export interface UseTierListStateOptions {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: TierList | null;
}

interface DragResolution {
  placements: TierPlacements;
  notes: Record<string, string>;
}

function createPlacements(tierDefs: TierDefinition[]): TierPlacements {
  const placements: TierPlacements = {};
  for (const tierDef of tierDefs) {
    placements[tierDef.name] = [];
  }
  return placements;
}

function createDefaultTierDefs(): TierDefinition[] {
  return DEFAULT_TIER_DEFINITIONS.map((tierDef) => ({ ...tierDef }));
}

function createEmptyBuilderState(): TierListBuilderState {
  const tierDefs = createDefaultTierDefs();
  return {
    tierDefs,
    placements: createPlacements(tierDefs),
    notes: {},
    meta: {
      name: '',
      author: '',
      categoryName: DEFAULT_CONTENT_TYPE,
      description: '',
    },
    drafts: {
      newTierName: '',
      newTierNote: '',
    },
  };
}

function createFallbackTierList(): TierList {
  return {
    name: '',
    author: '',
    content_type: DEFAULT_CONTENT_TYPE,
    description: '',
    tiers: createDefaultTierDefs(),
    entries: [],
    last_updated: 0,
  };
}

function clonePlacements(source: TierPlacements): TierPlacements {
  const nextPlacements: TierPlacements = {};
  for (const [key, values] of Object.entries(source)) {
    nextPlacements[key] = [...values];
  }
  return nextPlacements;
}

function removeCharacterNote(
  notes: Record<string, string>,
  characterKey: string
): Record<string, string> {
  if (!(characterKey in notes)) return notes;
  const nextNotes = { ...notes };
  delete nextNotes[characterKey];
  return nextNotes;
}

function toCharacterKey(id: UniqueIdentifier | undefined): string | null {
  return typeof id === 'string' ? id : null;
}

function toBuilderState(
  data: TierList,
  getCharacterKeyFromReference: (name: string, quality?: Quality) => string
): TierListBuilderState {
  const baseTierDefs = data.tiers?.length
    ? data.tiers.map((tierDef) => ({
        name: tierDef.name,
        note: normalizeNote(tierDef.note) || '',
      }))
    : createDefaultTierDefs();

  const tierNameSet = new Set(baseTierDefs.map((tierDef) => tierDef.name));
  const extraTierDefs: TierDefinition[] = [];
  for (const entry of data.entries) {
    if (!tierNameSet.has(entry.tier)) {
      extraTierDefs.push({ name: entry.tier, note: '' });
      tierNameSet.add(entry.tier);
    }
  }

  const tierDefs = [...baseTierDefs, ...extraTierDefs];
  const placements = createPlacements(tierDefs);
  const notes: Record<string, string> = {};
  const seenCharacters = new Set<string>();

  for (const entry of data.entries) {
    const characterKey = getCharacterKeyFromReference(
      entry.character_name,
      entry.character_quality
    );
    if (seenCharacters.has(characterKey)) continue;
    seenCharacters.add(characterKey);

    if (placements[entry.tier] !== undefined) {
      placements[entry.tier].push(characterKey);
    }

    const normalizedEntryNote = normalizeNote(entry.note);
    if (normalizedEntryNote) {
      notes[characterKey] = normalizedEntryNote;
    }
  }

  return {
    tierDefs,
    placements,
    notes,
    meta: {
      name: data.name || '',
      author: data.author || '',
      categoryName: normalizeContentType(data.content_type),
      description: data.description || '',
    },
    drafts: {
      newTierName: '',
      newTierNote: '',
    },
  };
}

function tierListBuilderReducer(
  state: TierListBuilderState,
  action: TierListBuilderAction
): TierListBuilderState {
  switch (action.type) {
    case 'LOAD_TIER_LIST':
      return action.payload;
    case 'UPDATE_META':
      return {
        ...state,
        meta: {
          ...state.meta,
          ...action.patch,
        },
      };
    case 'SET_PLACEMENTS':
      return { ...state, placements: action.payload };
    case 'SET_CHARACTER_NOTE': {
      const nextNotes = { ...state.notes };
      if (action.note) {
        nextNotes[action.characterKey] = action.note;
      } else {
        delete nextNotes[action.characterKey];
      }
      return { ...state, notes: nextNotes };
    }
    case 'SET_TIER_NOTE':
      return {
        ...state,
        tierDefs: state.tierDefs.map((tierDef) =>
          tierDef.name === action.tierName
            ? { ...tierDef, note: action.note }
            : tierDef
        ),
      };
    case 'ADD_TIER': {
      if (!action.name.trim()) return state;
      if (state.tierDefs.some((tierDef) => tierDef.name === action.name)) {
        return state;
      }
      return {
        ...state,
        tierDefs: [...state.tierDefs, { name: action.name, note: action.note }],
        placements: {
          ...state.placements,
          [action.name]: [],
        },
        drafts: {
          newTierName: '',
          newTierNote: '',
        },
      };
    }
    case 'DELETE_TIER': {
      const removedCharacters = state.placements[action.tierName] || [];
      const nextPlacements = { ...state.placements };
      delete nextPlacements[action.tierName];

      let nextNotes = state.notes;
      for (const characterKey of removedCharacters) {
        nextNotes = removeCharacterNote(nextNotes, characterKey);
      }

      return {
        ...state,
        tierDefs: state.tierDefs.filter(
          (tierDef) => tierDef.name !== action.tierName
        ),
        placements: nextPlacements,
        notes: nextNotes,
      };
    }
    case 'MOVE_TIER': {
      if (
        action.fromIndex < 0 ||
        action.fromIndex >= state.tierDefs.length ||
        action.toIndex < 0 ||
        action.toIndex >= state.tierDefs.length
      ) {
        return state;
      }

      const nextTierDefs = [...state.tierDefs];
      const [movedTier] = nextTierDefs.splice(action.fromIndex, 1);
      nextTierDefs.splice(action.toIndex, 0, movedTier);
      return { ...state, tierDefs: nextTierDefs };
    }
    case 'UPDATE_NEW_TIER_DRAFT':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          ...action.patch,
        },
      };
    case 'RESET':
      return createEmptyBuilderState();
    default:
      return state;
  }
}

function applyTierListDrag(
  state: TierListBuilderState,
  input: {
    characterKey: string;
    overId: string;
    activeTier?: string;
    targetCharacterKey?: string;
    targetTier?: string;
  }
): DragResolution | null {
  const { characterKey, overId, activeTier, targetCharacterKey, targetTier } =
    input;

  if (overId === 'unranked') {
    if (!activeTier) return null;
    const nextPlacements = clonePlacements(state.placements);
    nextPlacements[activeTier] = nextPlacements[activeTier].filter(
      (entry) => entry !== characterKey
    );
    return {
      placements: nextPlacements,
      notes: removeCharacterNote(state.notes, characterKey),
    };
  }

  if (overId.startsWith('char-')) {
    if (!targetCharacterKey) return null;
    if (characterKey === targetCharacterKey) return null;

    if (!targetTier) {
      if (!activeTier) return null;
      const nextPlacements = clonePlacements(state.placements);
      const activeIndex = nextPlacements[activeTier].indexOf(characterKey);
      if (activeIndex === -1) return null;

      nextPlacements[activeTier][activeIndex] = targetCharacterKey;
      return {
        placements: nextPlacements,
        notes: removeCharacterNote(state.notes, characterKey),
      };
    }

    const nextPlacements = clonePlacements(state.placements);
    const targetIndex =
      nextPlacements[targetTier]?.indexOf(targetCharacterKey) ?? -1;
    if (targetIndex === -1) return null;

    if (activeTier) {
      const activeIndex =
        nextPlacements[activeTier]?.indexOf(characterKey) ?? -1;
      if (activeIndex === -1) return null;

      if (activeTier === targetTier) {
        nextPlacements[targetTier][activeIndex] = targetCharacterKey;
        nextPlacements[targetTier][targetIndex] = characterKey;
        return { placements: nextPlacements, notes: state.notes };
      }

      nextPlacements[activeTier] = nextPlacements[activeTier].filter(
        (entry) => entry !== characterKey
      );
      nextPlacements[targetTier][targetIndex] = characterKey;
      nextPlacements[activeTier].push(targetCharacterKey);
      return { placements: nextPlacements, notes: state.notes };
    }

    removeItemFromRecordArrays(nextPlacements, characterKey);
    nextPlacements[targetTier][targetIndex] = characterKey;
    return { placements: nextPlacements, notes: state.notes };
  }

  if (overId.startsWith('tier-')) {
    const tierName = overId.replace('tier-', '');
    const nextPlacements = clonePlacements(state.placements);
    removeItemFromRecordArrays(nextPlacements, characterKey);
    if (!nextPlacements[tierName]) {
      nextPlacements[tierName] = [];
    }
    nextPlacements[tierName].push(characterKey);
    return { placements: nextPlacements, notes: state.notes };
  }

  return null;
}

export function useTierListState({
  characters,
  charMap,
  initialData,
}: UseTierListStateOptions) {
  const [state, dispatch] = useReducer(
    tierListBuilderReducer,
    undefined,
    createEmptyBuilderState
  );
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { byIdentity: characterByIdentity, nameCounts: characterNameCounts } =
    useCharacterResolution(characters);

  const getCharacterFromKey = useCallback(
    (characterKey: string) =>
      getCharacterByReferenceKey(characterKey, charMap, characterByIdentity),
    [characterByIdentity, charMap]
  );

  const getCharacterKeyFromReference = useCallback(
    (name: string, quality?: Quality) =>
      resolveCharacterReferenceKey(
        name,
        quality,
        characters,
        charMap,
        characterByIdentity
      ),
    [characterByIdentity, charMap, characters]
  );

  const loadFromTierList = useCallback(
    (tierList: TierList) => {
      dispatch({
        type: 'LOAD_TIER_LIST',
        payload: toBuilderState(tierList, getCharacterKeyFromReference),
      });
    },
    [getCharacterKeyFromReference]
  );

  useEffect(() => {
    if (initialData) {
      queueMicrotask(() => {
        loadFromTierList(initialData);
        setDraftHydrated(true);
      });
      return;
    }

    if (typeof window === 'undefined') {
      queueMicrotask(() => setDraftHydrated(true));
      return;
    }

    const storedDraft = window.localStorage.getItem(
      STORAGE_KEY.TIER_LIST_BUILDER_DRAFT
    );
    if (storedDraft) {
      try {
        const parsedDraft = JSON.parse(storedDraft) as unknown;
        const partialTierList = getPastedTierListPatch(parsedDraft);
        if (partialTierList) {
          const hydratedTierList = normalizeTierListFromPartial(
            partialTierList,
            createFallbackTierList()
          );
          queueMicrotask(() => {
            loadFromTierList(hydratedTierList);
          });
        } else {
          window.localStorage.removeItem(STORAGE_KEY.TIER_LIST_BUILDER_DRAFT);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY.TIER_LIST_BUILDER_DRAFT);
      }
    }

    queueMicrotask(() => setDraftHydrated(true));
  }, [initialData, loadFromTierList]);

  const deferredName = useDeferredValue(state.meta.name);
  const deferredAuthor = useDeferredValue(state.meta.author);
  const deferredDescription = useDeferredValue(state.meta.description);
  const deferredCategoryName = useDeferredValue(state.meta.categoryName);

  const tierListData = useMemo<TierList>(() => {
    return {
      name: deferredName || DEFAULT_TIER_LIST_NAME,
      author: deferredAuthor || DEFAULT_TIER_LIST_AUTHOR,
      content_type: deferredCategoryName,
      description: deferredDescription,
      tiers: state.tierDefs.map((tierDef) => ({
        name: tierDef.name,
        ...(normalizeNote(tierDef.note)
          ? { note: normalizeNote(tierDef.note) }
          : {}),
      })),
      entries: state.tierDefs.flatMap((tierDef) =>
        (state.placements[tierDef.name] || []).map((characterKey) => ({
          ...toCharacterReferenceFromKey(
            characterKey,
            charMap,
            characterByIdentity,
            characterNameCounts
          ),
          tier: tierDef.name,
          ...(state.notes[characterKey]
            ? { note: state.notes[characterKey] }
            : {}),
        }))
      ),
      last_updated: 0,
    };
  }, [
    charMap,
    characterByIdentity,
    characterNameCounts,
    deferredAuthor,
    deferredCategoryName,
    deferredDescription,
    deferredName,
    state.notes,
    state.placements,
    state.tierDefs,
  ]);

  const json = useMemo(
    () => JSON.stringify(tierListData, null, 2),
    [tierListData]
  );

  useEffect(() => {
    if (!draftHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY.TIER_LIST_BUILDER_DRAFT, json);
  }, [draftHydrated, json]);

  const hasAnyPlaced = useMemo(
    () => Object.values(state.placements).some((entries) => entries.length > 0),
    [state.placements]
  );

  const unrankedCharacters = useMemo(() => {
    const placedCharacters = new Set(Object.values(state.placements).flat());
    return characters.filter(
      (character) => !placedCharacters.has(getCharacterIdentityKey(character))
    );
  }, [characters, state.placements]);

  const hasAnyBuilderData = useMemo(
    () =>
      hasAnyPlaced ||
      Object.values(state.notes).some((note) => Boolean(normalizeNote(note))) ||
      state.tierDefs.length !== DEFAULT_TIER_DEFINITIONS.length ||
      state.tierDefs.some((tierDef, index) => {
        const defaultTierDef = DEFAULT_TIER_DEFINITIONS[index];
        if (!defaultTierDef) return true;
        const tierNote = normalizeNote(tierDef.note) || '';
        const defaultTierNote = normalizeNote(defaultTierDef.note) || '';
        return (
          tierDef.name !== defaultTierDef.name || tierNote !== defaultTierNote
        );
      }) ||
      state.meta.name.trim().length > 0 ||
      state.meta.author.trim().length > 0 ||
      state.meta.description.trim().length > 0 ||
      state.meta.categoryName !== DEFAULT_CONTENT_TYPE ||
      state.drafts.newTierName.trim().length > 0 ||
      Boolean(normalizeNote(state.drafts.newTierNote)),
    [
      hasAnyPlaced,
      state.drafts.newTierName,
      state.drafts.newTierNote,
      state.meta,
      state.notes,
      state.tierDefs,
    ]
  );

  const tierExportRows = useMemo<TierExportRow[]>(
    () =>
      state.tierDefs
        .map((tierDef, index) => ({
          tier: tierDef.name,
          tierIndex: index,
          note: tierDef.note,
          entries: (state.placements[tierDef.name] || []).map(
            (characterKey) => {
              const character = getCharacterFromKey(characterKey);
              const isDuplicate =
                character &&
                (characterNameCounts.get(
                  getCharacterBaseSlug(character.name)
                ) ?? 1) > 1;
              return {
                characterName: character?.name ?? characterKey,
                characterQuality: character?.quality ?? null,
                label:
                  isDuplicate && character
                    ? `${character.name} (${character.quality})`
                    : undefined,
              };
            }
          ),
        }))
        .filter((row) => row.entries.length > 0),
    [characterNameCounts, getCharacterFromKey, state.placements, state.tierDefs]
  );

  const updateMeta = useCallback((patch: Partial<TierListBuilderMetaState>) => {
    dispatch({ type: 'UPDATE_META', patch });
  }, []);

  const handleNameCommit = useCallback(
    (name: string) => {
      updateMeta({ name });
    },
    [updateMeta]
  );

  const handleAuthorCommit = useCallback(
    (author: string) => {
      updateMeta({ author });
    },
    [updateMeta]
  );

  const handleCategoryChange = useCallback(
    (value: string | null) => {
      updateMeta({
        categoryName: normalizeContentType(value, DEFAULT_CONTENT_TYPE),
      });
    },
    [updateMeta]
  );

  const handleDescriptionCommit = useCallback(
    (description: string) => {
      updateMeta({ description });
    },
    [updateMeta]
  );

  const handleNewTierNameChange = useCallback((newTierName: string) => {
    dispatch({ type: 'UPDATE_NEW_TIER_DRAFT', patch: { newTierName } });
  }, []);

  const handleNewTierNoteChange = useCallback((newTierNote: string) => {
    dispatch({ type: 'UPDATE_NEW_TIER_DRAFT', patch: { newTierNote } });
  }, []);

  const handleCharacterNoteChange = useCallback(
    (characterKey: string, note: string) => {
      dispatch({
        type: 'SET_CHARACTER_NOTE',
        characterKey,
        note: normalizeNote(note),
      });
    },
    []
  );

  const handleTierNoteChange = useCallback((tierName: string, note: string) => {
    dispatch({
      type: 'SET_TIER_NOTE',
      tierName,
      note: normalizeNote(note) || '',
    });
  }, []);

  const handleDeleteTier = useCallback((tierName: string) => {
    dispatch({ type: 'DELETE_TIER', tierName });
  }, []);

  const handleMoveTierUp = useCallback((index: number) => {
    if (index === 0) return;
    dispatch({ type: 'MOVE_TIER', fromIndex: index, toIndex: index - 1 });
  }, []);

  const handleMoveTierDown = useCallback(
    (index: number) => {
      if (index >= state.tierDefs.length - 1) return;
      dispatch({ type: 'MOVE_TIER', fromIndex: index, toIndex: index + 1 });
    },
    [state.tierDefs.length]
  );

  const handleAddTier = useCallback(() => {
    const trimmedTierName = state.drafts.newTierName.trim();
    if (!trimmedTierName) {
      showWarningToast({
        id: 'tierlistbuilder-tier-name-required',
        title: 'Tier name required',
        message: 'Enter a tier name before adding a new tier.',
        autoClose: 2400,
      });
      return;
    }

    if (state.tierDefs.some((tierDef) => tierDef.name === trimmedTierName)) {
      showWarningToast({
        id: 'tierlistbuilder-tier-name-duplicate',
        title: 'Tier already exists',
        message: `A tier named "${trimmedTierName}" already exists. Use a different name.`,
        autoClose: 2400,
      });
      return;
    }

    dispatch({
      type: 'ADD_TIER',
      name: trimmedTierName,
      note: normalizeNote(state.drafts.newTierNote),
    });
  }, [state.drafts.newTierName, state.drafts.newTierNote, state.tierDefs]);

  const handlePasteApply = useCallback(
    (pasteText: string) => {
      try {
        const parsed = JSON.parse(pasteText) as unknown;
        const partialTierList = getPastedTierListPatch(parsed);
        if (!partialTierList) {
          return 'Invalid tier list JSON: expected an object or an entries array.';
        }

        const mergedTierList = normalizeTierListFromPartial(
          partialTierList,
          tierListData
        );
        loadFromTierList(mergedTierList);
        return null;
      } catch {
        return 'Could not parse JSON. Paste a JSON object, a one-item tier list array, or an entries array.';
      }
    },
    [loadFromTierList, tierListData]
  );

  const handleSort = useCallback(() => {
    const nextPlacements: TierPlacements = {};
    for (const tierDef of state.tierDefs) {
      nextPlacements[tierDef.name] = [
        ...(state.placements[tierDef.name] || []),
      ].sort((left, right) => {
        const leftCharacter = getCharacterFromKey(left);
        const rightCharacter = getCharacterFromKey(right);
        if (!leftCharacter && !rightCharacter) return left.localeCompare(right);
        if (!leftCharacter) return 1;
        if (!rightCharacter) return -1;
        return compareCharactersByQualityThenName(
          leftCharacter,
          rightCharacter
        );
      });
    }
    dispatch({ type: 'SET_PLACEMENTS', payload: nextPlacements });
  }, [getCharacterFromKey, state.placements, state.tierDefs]);

  const handleClear = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(toCharacterKey(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const characterKey = toCharacterKey(event.active.id);
      const overId = toCharacterKey(event.over?.id);
      if (!characterKey || !overId) return;

      const activeTier =
        typeof event.active.data.current?.tier === 'string'
          ? event.active.data.current.tier
          : undefined;
      const targetCharacterKey =
        typeof event.over?.data.current?.characterKey === 'string'
          ? event.over.data.current.characterKey
          : undefined;
      const targetTier =
        typeof event.over?.data.current?.tier === 'string'
          ? event.over.data.current.tier
          : undefined;

      const dragResult = applyTierListDrag(state, {
        characterKey,
        overId,
        activeTier,
        targetCharacterKey,
        targetTier,
      });

      if (!dragResult) return;
      dispatch({ type: 'SET_PLACEMENTS', payload: dragResult.placements });
      if (dragResult.notes !== state.notes) {
        for (const noteKey of new Set([
          ...Object.keys(state.notes),
          ...Object.keys(dragResult.notes),
        ])) {
          const previous = state.notes[noteKey];
          const next = dragResult.notes[noteKey];
          if (previous !== next) {
            dispatch({
              type: 'SET_CHARACTER_NOTE',
              characterKey: noteKey,
              note: next,
            });
          }
        }
      }
    },
    [state]
  );

  return {
    activeId,
    characterNameCounts,
    getCharacterFromKey,
    handleAddTier,
    handleAuthorCommit,
    handleCategoryChange,
    handleCharacterNoteChange,
    handleClear,
    handleDeleteTier,
    handleDescriptionCommit,
    handleDragEnd,
    handleDragStart,
    handleMoveTierDown,
    handleMoveTierUp,
    handleNameCommit,
    handleNewTierNameChange,
    handleNewTierNoteChange,
    handlePasteApply,
    handleSort,
    handleTierNoteChange,
    hasAnyBuilderData,
    hasAnyPlaced,
    json,
    meta: state.meta,
    newTierName: state.drafts.newTierName,
    newTierNote: state.drafts.newTierNote,
    notes: state.notes,
    placements: state.placements,
    tierDefs: state.tierDefs,
    tierExportRows,
    tierListData,
    unrankedCharacters,
  };
}
