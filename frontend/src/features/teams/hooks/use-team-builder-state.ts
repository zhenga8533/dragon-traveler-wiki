import { FACTION_COLOR, FACTION_NAMES } from '@/constants/colors';
import {
  DEFAULT_CONTENT_TYPE,
  normalizeContentType,
  type ContentType,
} from '@/constants/content-types';
import { STORAGE_KEY } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import {
  getCharacterByReferenceKey,
  getCharacterIdentityKey,
  getCharacterRoutePath,
  getCharacterRoutePathByName,
  resolveCharacterByNameAndQuality,
  resolveCharacterReferenceKey,
  toCharacterReferenceFromKey,
} from '@/features/characters/utils/character-route';
import { normalizeNote } from '@/utils/normalize-note';
import {
  getPastedTeamPatch,
  getValidRows,
  GRID_SIZE,
  MAX_ROSTER_SIZE,
  normalizeTeamFromPartial,
  ROW_LABELS,
} from '@/features/teams/components/TeamBuilder/utils';
import type { Team, TeamMember, TeamWyrmspells } from '@/features/teams/types';
import {
  insertUniqueBefore,
  removeItem,
} from '@/utils/dnd-list';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryNote,
  getTeamBenchEntryQuality,
} from '@/features/teams/utils/team-bench';
import { computeTeamSynergy } from '@/features/teams/utils/team-synergy';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import { useCharacterResolution } from '@/hooks';
import type { FactionName } from '@/types/faction';
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

const DEFAULT_TEAM_NAME = 'My Team';
const DEFAULT_TEAM_AUTHOR = 'Anonymous';
const DEFAULT_TEAM_FACTION = 'Elemental Echo' as FactionName;

export interface TeamBuilderMetaState {
  name: string;
  author: string;
  contentType: ContentType;
  description: string;
  faction: FactionName | null;
}

export interface TeamBuilderState {
  slots: Array<string | null>;
  overdriveSequence: number[];
  bench: string[];
  benchNotes: Record<string, string>;
  slotNotes: string[];
  teamWyrmspells: TeamWyrmspells;
  meta: TeamBuilderMetaState;
}

export type TeamBuilderAction =
  | { type: 'LOAD_TEAM'; payload: TeamBuilderState }
  | { type: 'SET_SLOT'; slotIndex: number; characterKey: string | null }
  | { type: 'SET_BENCH'; bench: string[]; benchNotes?: Record<string, string> }
  | { type: 'UPDATE_META'; patch: Partial<TeamBuilderMetaState> }
  | { type: 'SET_OVERDRIVE_SEQUENCE'; payload: number[] }
  | { type: 'SET_SLOT_NOTE'; slotIndex: number; note: string }
  | { type: 'SET_SLOT_NOTES'; payload: string[] }
  | { type: 'SET_BENCH_NOTE'; characterKey: string; note?: string }
  | { type: 'SET_WYRMSPELL'; key: keyof TeamWyrmspells; value?: string }
  | { type: 'RESET' };

export interface UseTeamBuilderStateOptions {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: Team | null;
  wyrmspells?: Wyrmspell[];
}

interface CharacterLocationInBuilder {
  zone: 'slot' | 'bench' | 'available';
  index?: number;
}

function createEmptyBuilderState(): TeamBuilderState {
  return {
    slots: Array<string | null>(GRID_SIZE).fill(null),
    overdriveSequence: [],
    bench: [],
    benchNotes: {},
    slotNotes: Array<string>(GRID_SIZE).fill(''),
    teamWyrmspells: {},
    meta: {
      name: '',
      author: '',
      contentType: DEFAULT_CONTENT_TYPE,
      description: '',
      faction: null,
    },
  };
}

function createFallbackTeam(): Team {
  return {
    name: '',
    author: '',
    content_type: DEFAULT_CONTENT_TYPE,
    description: '',
    faction: DEFAULT_TEAM_FACTION,
    members: [],
    last_updated: 0,
  };
}

function teamBuilderReducer(
  state: TeamBuilderState,
  action: TeamBuilderAction
): TeamBuilderState {
  switch (action.type) {
    case 'LOAD_TEAM':
      return action.payload;
    case 'SET_SLOT': {
      const slots = [...state.slots];
      slots[action.slotIndex] = action.characterKey;
      return { ...state, slots };
    }
    case 'SET_BENCH':
      return {
        ...state,
        bench: action.bench,
        ...(action.benchNotes ? { benchNotes: action.benchNotes } : {}),
      };
    case 'UPDATE_META':
      return {
        ...state,
        meta: {
          ...state.meta,
          ...action.patch,
        },
      };
    case 'SET_OVERDRIVE_SEQUENCE':
      return { ...state, overdriveSequence: action.payload };
    case 'SET_SLOT_NOTE': {
      const slotNotes = [...state.slotNotes];
      slotNotes[action.slotIndex] = action.note;
      return { ...state, slotNotes };
    }
    case 'SET_SLOT_NOTES':
      return { ...state, slotNotes: action.payload };
    case 'SET_BENCH_NOTE': {
      const benchNotes = { ...state.benchNotes };
      if (action.note) {
        benchNotes[action.characterKey] = action.note;
      } else {
        delete benchNotes[action.characterKey];
      }
      return { ...state, benchNotes };
    }
    case 'SET_WYRMSPELL': {
      const nextWyrmspells = { ...state.teamWyrmspells };
      if (action.value) {
        nextWyrmspells[action.key] = action.value;
      } else {
        delete nextWyrmspells[action.key];
      }
      return { ...state, teamWyrmspells: nextWyrmspells };
    }
    case 'RESET':
      return createEmptyBuilderState();
    default:
      return state;
  }
}

function parseFactionName(value: string | null): FactionName | null {
  if (!value) return null;
  return FACTION_NAMES.includes(value as FactionName)
    ? (value as FactionName)
    : null;
}

function toCharacterKey(id: UniqueIdentifier | undefined): string | null {
  return typeof id === 'string' ? id : null;
}

function toBuilderState(
  data: Team,
  getCharacterKeyFromReference: (name: string, quality?: string) => string
): TeamBuilderState {
  const nextState = createEmptyBuilderState();
  nextState.meta = {
    name: data.name || '',
    author: data.author || '',
    contentType: normalizeContentType(data.content_type),
    description: data.description || '',
    faction: data.faction || null,
  };

  const usedKeys = new Set<string>();
  const parsedOverdriveEntries: Array<{ slotIndex: number; order: number }> =
    [];

  for (const member of data.members) {
    const characterKey = getCharacterKeyFromReference(
      member.character_name,
      member.character_quality
    );
    if (usedKeys.has(characterKey)) continue;

    let slotIndex = nextState.slots.findIndex(
      (slotValue) => slotValue === null
    );
    if (member.position) {
      slotIndex = member.position.row * 3 + member.position.col;
    }

    if (
      slotIndex >= 0 &&
      slotIndex < GRID_SIZE &&
      nextState.slots[slotIndex] === null
    ) {
      nextState.slots[slotIndex] = characterKey;
      usedKeys.add(characterKey);
      nextState.slotNotes[slotIndex] = normalizeNote(member.note) || '';

      if (member.overdrive_order != null) {
        parsedOverdriveEntries.push({
          slotIndex,
          order: member.overdrive_order,
        });
      }
    }
  }

  parsedOverdriveEntries.sort((left, right) => left.order - right.order);
  nextState.overdriveSequence = parsedOverdriveEntries
    .map((entry) => entry.slotIndex)
    .slice(0, MAX_ROSTER_SIZE);

  const seenBenchKeys = new Set<string>();
  const normalizedBenchEntries = (data.bench || [])
    .map((benchEntry) => {
      const benchName = getTeamBenchEntryName(benchEntry);
      const benchQuality = getTeamBenchEntryQuality(benchEntry);
      const benchKey = getCharacterKeyFromReference(benchName, benchQuality);
      const benchNote = normalizeNote(getTeamBenchEntryNote(benchEntry)) || '';
      return { benchKey, benchNote };
    })
    .filter((entry) => {
      if (usedKeys.has(entry.benchKey)) return false;
      if (seenBenchKeys.has(entry.benchKey)) return false;
      seenBenchKeys.add(entry.benchKey);
      return true;
    });

  nextState.bench = normalizedBenchEntries.map((entry) => entry.benchKey);
  nextState.benchNotes = Object.fromEntries(
    normalizedBenchEntries
      .map((entry) => [entry.benchKey, entry.benchNote] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1]))
  );
  nextState.teamWyrmspells = data.wyrmspells || {};

  return nextState;
}

export function useTeamBuilderState({
  characters,
  charMap,
  initialData,
  wyrmspells = [],
}: UseTeamBuilderStateOptions) {
  const [state, dispatch] = useReducer(
    teamBuilderReducer,
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

  const loadFromTeam = useCallback(
    (team: Team) => {
      dispatch({
        type: 'LOAD_TEAM',
        payload: toBuilderState(team, getCharacterKeyFromReference),
      });
    },
    [getCharacterKeyFromReference]
  );

  useEffect(() => {
    if (initialData) {
      queueMicrotask(() => {
        loadFromTeam(initialData);
        setDraftHydrated(true);
      });
      return;
    }

    if (typeof window === 'undefined') {
      queueMicrotask(() => setDraftHydrated(true));
      return;
    }

    const storedDraft = window.localStorage.getItem(
      STORAGE_KEY.TEAMS_BUILDER_DRAFT
    );
    if (storedDraft) {
      try {
        const parsedDraft = JSON.parse(storedDraft) as unknown;
        const partialTeam = getPastedTeamPatch(parsedDraft);
        if (partialTeam) {
          const hydratedTeam = normalizeTeamFromPartial(
            partialTeam,
            createFallbackTeam()
          );
          queueMicrotask(() => {
            loadFromTeam(hydratedTeam);
          });
        } else {
          window.localStorage.removeItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT);
      }
    }

    queueMicrotask(() => setDraftHydrated(true));
  }, [initialData, loadFromTeam]);

  const deferredName = useDeferredValue(state.meta.name);
  const deferredAuthor = useDeferredValue(state.meta.author);
  const deferredDescription = useDeferredValue(state.meta.description);
  const deferredContentType = useDeferredValue(state.meta.contentType);
  const deferredFaction = useDeferredValue(state.meta.faction);

  const overdriveOrderBySlot = useMemo(() => {
    const orderBySlot = new Map<number, number>();
    state.overdriveSequence.forEach((slotIndex, orderIndex) => {
      if (state.slots[slotIndex]) {
        orderBySlot.set(slotIndex, orderIndex + 1);
      }
    });
    return orderBySlot;
  }, [state.overdriveSequence, state.slots]);

  const teamNames = useMemo(() => {
    const names = new Set<string>();
    for (const slotValue of state.slots) {
      if (slotValue) names.add(slotValue);
    }
    return names;
  }, [state.slots]);

  const teamSize = teamNames.size;
  const factionColor = state.meta.faction
    ? FACTION_COLOR[state.meta.faction]
    : 'blue';

  const hasAnyBuilderData = useMemo(
    () =>
      teamSize > 0 ||
      state.bench.length > 0 ||
      state.overdriveSequence.length > 0 ||
      state.slotNotes.some((note) => Boolean(normalizeNote(note))) ||
      Object.values(state.benchNotes).some((note) =>
        Boolean(normalizeNote(note))
      ) ||
      Object.values(state.teamWyrmspells).some((value) => Boolean(value)) ||
      state.meta.name.trim().length > 0 ||
      state.meta.author.trim().length > 0 ||
      state.meta.description.trim().length > 0 ||
      state.meta.faction !== null ||
      state.meta.contentType !== DEFAULT_CONTENT_TYPE,
    [state, teamSize]
  );

  const teamData = useMemo<Team>(() => {
    const members: TeamMember[] = [];
    let overdriveOrder = 1;

    for (const slotIndex of state.overdriveSequence) {
      const characterKey = state.slots[slotIndex];
      if (!characterKey) continue;
      const note = normalizeNote(state.slotNotes[slotIndex]);
      members.push({
        ...toCharacterReferenceFromKey(
          characterKey,
          charMap,
          characterByIdentity,
          characterNameCounts
        ),
        overdrive_order: overdriveOrder++,
        position: { row: Math.floor(slotIndex / 3), col: slotIndex % 3 },
        ...(note ? { note } : {}),
      });
    }

    for (let slotIndex = 0; slotIndex < GRID_SIZE; slotIndex += 1) {
      const characterKey = state.slots[slotIndex];
      if (!characterKey || overdriveOrderBySlot.has(slotIndex)) continue;
      const note = normalizeNote(state.slotNotes[slotIndex]);
      members.push({
        ...toCharacterReferenceFromKey(
          characterKey,
          charMap,
          characterByIdentity,
          characterNameCounts
        ),
        overdrive_order: null,
        position: { row: Math.floor(slotIndex / 3), col: slotIndex % 3 },
        ...(note ? { note } : {}),
      });
    }

    const nextTeam: Team = {
      name: deferredName || DEFAULT_TEAM_NAME,
      author: deferredAuthor || DEFAULT_TEAM_AUTHOR,
      content_type: deferredContentType,
      description: deferredDescription,
      faction: deferredFaction || DEFAULT_TEAM_FACTION,
      members,
      last_updated: 0,
    };

    if (state.bench.length > 0) {
      nextTeam.bench = state.bench.map((characterKey) => {
        const reference = toCharacterReferenceFromKey(
          characterKey,
          charMap,
          characterByIdentity,
          characterNameCounts
        );
        const note = normalizeNote(state.benchNotes[characterKey]);
        return note ? { ...reference, note } : reference;
      });
    }

    const hasWyrmspells = Object.values(state.teamWyrmspells).some(Boolean);
    if (hasWyrmspells) {
      nextTeam.wyrmspells = state.teamWyrmspells;
    }

    return nextTeam;
  }, [
    charMap,
    characterByIdentity,
    characterNameCounts,
    deferredAuthor,
    deferredContentType,
    deferredDescription,
    deferredFaction,
    deferredName,
    overdriveOrderBySlot,
    state.bench,
    state.benchNotes,
    state.overdriveSequence,
    state.slotNotes,
    state.slots,
    state.teamWyrmspells,
  ]);

  const json = useMemo(() => JSON.stringify(teamData, null, 2), [teamData]);

  useEffect(() => {
    if (!draftHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT, json);
  }, [draftHydrated, json]);

  const usedNames = useMemo(() => {
    const names = new Set<string>();
    for (const slotValue of state.slots) {
      if (slotValue) names.add(slotValue);
    }
    for (const benchKey of state.bench) {
      names.add(benchKey);
    }
    return names;
  }, [state.bench, state.slots]);

  const availableCharacters = useMemo(
    () =>
      characters.filter(
        (character) => !usedNames.has(getCharacterIdentityKey(character))
      ),
    [characters, usedNames]
  );

  const synergy = useMemo(() => {
    const roster = state.slots
      .filter((slotValue): slotValue is string => Boolean(slotValue))
      .map((slotValue) => getCharacterFromKey(slotValue))
      .filter((character): character is Character => Boolean(character));

    return computeTeamSynergy({
      roster,
      faction: state.meta.faction,
      contentType: state.meta.contentType,
      overdriveCount: state.overdriveSequence.length,
      teamWyrmspells: state.teamWyrmspells,
      wyrmspells,
    });
  }, [
    getCharacterFromKey,
    state.meta.contentType,
    state.meta.faction,
    state.overdriveSequence.length,
    state.slots,
    state.teamWyrmspells,
    wyrmspells,
  ]);

  const getCharacterPath = useCallback(
    (characterName: string, characterQuality?: string | null) => {
      const character = resolveCharacterByNameAndQuality(
        characterName,
        characterQuality,
        charMap,
        characterByIdentity
      );
      if (!character) return getCharacterRoutePathByName(characterName);
      return getCharacterRoutePath(character, characterNameCounts);
    },
    [charMap, characterByIdentity, characterNameCounts]
  );

  const updateMeta = useCallback((patch: Partial<TeamBuilderMetaState>) => {
    dispatch({ type: 'UPDATE_META', patch });
  }, []);

  const handleContentTypeChange = useCallback(
    (value: string | null) => {
      updateMeta({
        contentType: normalizeContentType(value, DEFAULT_CONTENT_TYPE),
      });
    },
    [updateMeta]
  );

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

  const handleDescriptionCommit = useCallback(
    (description: string) => {
      updateMeta({ description });
    },
    [updateMeta]
  );

  const handleFactionChange = useCallback(
    (value: string | null) => {
      updateMeta({ faction: parseFactionName(value) });
    },
    [updateMeta]
  );

  const handleWyrmspellChange = useCallback(
    (key: keyof TeamWyrmspells, value: string | null) => {
      dispatch({ type: 'SET_WYRMSPELL', key, value: value || undefined });
    },
    []
  );

  const removeOverdriveSlot = useCallback(
    (slotIndex: number) => {
      dispatch({
        type: 'SET_OVERDRIVE_SEQUENCE',
        payload: state.overdriveSequence.filter((index) => index !== slotIndex),
      });
    },
    [state.overdriveSequence]
  );

  const swapOverdriveSlots = useCallback(
    (firstIndex: number, secondIndex: number) => {
      dispatch({
        type: 'SET_OVERDRIVE_SEQUENCE',
        payload: state.overdriveSequence.map((index) => {
          if (index === firstIndex) return secondIndex;
          if (index === secondIndex) return firstIndex;
          return index;
        }),
      });
    },
    [state.overdriveSequence]
  );

  const moveOverdriveSlot = useCallback(
    (fromIndex: number, toIndex: number) => {
      dispatch({
        type: 'SET_OVERDRIVE_SEQUENCE',
        payload: state.overdriveSequence.map((index) =>
          index === fromIndex ? toIndex : index
        ),
      });
    },
    [state.overdriveSequence]
  );

  const isValidPlacement = useCallback(
    (characterKey: string, slotIndex: number) => {
      const character = getCharacterFromKey(characterKey);
      if (!character) return true;
      const row = Math.floor(slotIndex / 3);
      return getValidRows(character.character_class).includes(row);
    },
    [getCharacterFromKey]
  );

  const notifyInvalidPlacement = useCallback(
    (characterKey: string, slotIndex: number) => {
      const character = getCharacterFromKey(characterKey);
      const displayName = character?.name ?? characterKey;
      const targetRowLabel =
        ROW_LABELS[Math.floor(slotIndex / 3)] || 'that row';

      showWarningToast({
        id: 'teambuilder-invalid-placement',
        title: 'Invalid slot placement',
        message: character
          ? `${displayName} (${character.character_class}) cannot be placed in ${targetRowLabel}.`
          : `${displayName} cannot be placed in ${targetRowLabel}.`,
        autoClose: 2400,
      });
    },
    [getCharacterFromKey]
  );

  const notifyTeamFull = useCallback(() => {
    showWarningToast({
      id: 'teambuilder-team-full',
      title: 'Team is full',
      message: `A team can have up to ${MAX_ROSTER_SIZE} members. Remove one before adding another.`,
      autoClose: 2400,
    });
  }, []);

  const notifyNoValidSwapRoom = useCallback(
    (characterKey: string) => {
      const displayName =
        getCharacterFromKey(characterKey)?.name ?? characterKey;
      showWarningToast({
        id: 'teambuilder-no-valid-swap-room',
        title: 'No valid slot available',
        message: `${displayName} cannot be moved because no valid empty row is available.`,
        autoClose: 2400,
      });
    },
    [getCharacterFromKey]
  );

  const findValidEmptySlotForCharacter = useCallback(
    (characterKey: string) => {
      const character = getCharacterFromKey(characterKey);
      const validRows = character
        ? getValidRows(character.character_class)
        : [0, 1, 2];

      for (const row of validRows) {
        for (let col = 0; col < 3; col += 1) {
          const slotIndex = row * 3 + col;
          if (!state.slots[slotIndex]) return slotIndex;
        }
      }

      return -1;
    },
    [getCharacterFromKey, state.slots]
  );

  const findCharacterLocation = useCallback(
    (characterKey: string): CharacterLocationInBuilder => {
      const slotIndex = state.slots.indexOf(characterKey);
      if (slotIndex !== -1) return { zone: 'slot', index: slotIndex };

      const benchIndex = state.bench.indexOf(characterKey);
      if (benchIndex !== -1) return { zone: 'bench', index: benchIndex };

      return { zone: 'available' };
    },
    [state.bench, state.slots]
  );

  const handleAddToNextSlot = useCallback(
    (characterKey: string) => {
      if (teamSize >= MAX_ROSTER_SIZE) {
        notifyTeamFull();
        return;
      }

      const targetIndex = findValidEmptySlotForCharacter(characterKey);
      const displayName =
        getCharacterFromKey(characterKey)?.name ?? characterKey;
      if (targetIndex === -1) {
        showWarningToast({
          id: 'teambuilder-no-valid-slot',
          title: 'No valid slot available',
          message: `${displayName} has no empty valid row right now. Move someone first.`,
          autoClose: 2400,
        });
        return;
      }

      dispatch({ type: 'SET_SLOT', slotIndex: targetIndex, characterKey });
      removeOverdriveSlot(targetIndex);
    },
    [
      findValidEmptySlotForCharacter,
      getCharacterFromKey,
      notifyTeamFull,
      removeOverdriveSlot,
      teamSize,
    ]
  );

  const handleOverdriveOrderChange = useCallback(
    (slotIndex: number, value: number | null) => {
      if (!state.slots[slotIndex]) return;

      const withoutCurrent = state.overdriveSequence.filter(
        (index) => index !== slotIndex
      );
      if (value == null || !Number.isFinite(value)) {
        dispatch({ type: 'SET_OVERDRIVE_SEQUENCE', payload: withoutCurrent });
        return;
      }

      const slotCap = state.slots.filter(Boolean).length;
      const maxOrder = Math.min(MAX_ROSTER_SIZE, Math.max(1, slotCap));
      const clampedOrder = Math.min(Math.max(Math.round(value), 1), maxOrder);
      const nextOrder = [...withoutCurrent];
      nextOrder.splice(clampedOrder - 1, 0, slotIndex);

      dispatch({
        type: 'SET_OVERDRIVE_SEQUENCE',
        payload: nextOrder.slice(0, MAX_ROSTER_SIZE),
      });
    },
    [state.overdriveSequence, state.slots]
  );

  const handleRemoveFromTeam = useCallback(
    (slotIndex: number) => {
      const characterKey = state.slots[slotIndex];
      if (!characterKey) return;
      dispatch({ type: 'SET_SLOT', slotIndex, characterKey: null });
      dispatch({ type: 'SET_SLOT_NOTE', slotIndex, note: '' });
      removeOverdriveSlot(slotIndex);
    },
    [removeOverdriveSlot, state.slots]
  );

  const handleSlotNoteChange = useCallback(
    (slotIndex: number, note: string) => {
      dispatch({
        type: 'SET_SLOT_NOTE',
        slotIndex,
        note: normalizeNote(note) || '',
      });
    },
    []
  );

  const handleBenchNoteChange = useCallback(
    (characterKey: string, note: string) => {
      dispatch({
        type: 'SET_BENCH_NOTE',
        characterKey,
        note: normalizeNote(note) || undefined,
      });
    },
    []
  );

  const handlePasteApply = useCallback(
    (pasteText: string) => {
      try {
        const parsed = JSON.parse(pasteText) as unknown;
        const partialTeam = getPastedTeamPatch(parsed);
        if (!partialTeam) {
          return 'Invalid team JSON: expected an object or a members array.';
        }

        const mergedTeam = normalizeTeamFromPartial(partialTeam, teamData);
        loadFromTeam(mergedTeam);
        return null;
      } catch {
        return 'Could not parse JSON. Paste a JSON object, a one-item team array, or a members array.';
      }
    },
    [loadFromTeam, teamData]
  );

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

      const from = findCharacterLocation(characterKey);
      const isSlotTarget = overId.startsWith('slot-');
      const targetSlotIndex = isSlotTarget
        ? Number.parseInt(overId.replace('slot-', ''), 10)
        : -1;

      if (isSlotTarget) {
        if (!isValidPlacement(characterKey, targetSlotIndex)) {
          notifyInvalidPlacement(characterKey, targetSlotIndex);
          return;
        }

        const occupant = state.slots[targetSlotIndex];

        if (from.zone === 'bench' && occupant) {
          const incomingBenchNote = state.benchNotes[characterKey] || '';
          const outgoingSlotNote = state.slotNotes[targetSlotIndex] || '';

          dispatch({
            type: 'SET_SLOT',
            slotIndex: targetSlotIndex,
            characterKey,
          });
          dispatch({
            type: 'SET_SLOT_NOTE',
            slotIndex: targetSlotIndex,
            note: incomingBenchNote,
          });
          removeOverdriveSlot(targetSlotIndex);

          const nextBench = [...state.bench];
          const benchIndex = nextBench.indexOf(characterKey);
          if (benchIndex !== -1) {
            nextBench[benchIndex] = occupant;
          }
          dispatch({
            type: 'SET_BENCH',
            bench: nextBench,
            benchNotes: {
              ...Object.fromEntries(
                Object.entries(state.benchNotes).filter(
                  ([key]) => key !== characterKey
                )
              ),
              [occupant]: outgoingSlotNote,
            },
          });
          return;
        }

        if (from.zone === 'available' || from.zone === 'bench') {
          const incomingNote =
            from.zone === 'bench' ? state.benchNotes[characterKey] || '' : '';

          if (occupant && teamSize >= MAX_ROSTER_SIZE) {
            dispatch({
              type: 'SET_SLOT',
              slotIndex: targetSlotIndex,
              characterKey,
            });
            dispatch({
              type: 'SET_SLOT_NOTE',
              slotIndex: targetSlotIndex,
              note: incomingNote,
            });
            removeOverdriveSlot(targetSlotIndex);
          } else if (occupant) {
            const emptySlotIndex = findValidEmptySlotForCharacter(occupant);
            if (emptySlotIndex === -1) {
              notifyNoValidSwapRoom(occupant);
              return;
            }

            const nextSlots = [...state.slots];
            nextSlots[targetSlotIndex] = characterKey;
            nextSlots[emptySlotIndex] = occupant;

            const nextSlotNotes = [...state.slotNotes];
            nextSlotNotes[emptySlotIndex] = nextSlotNotes[targetSlotIndex];
            nextSlotNotes[targetSlotIndex] = incomingNote;

            dispatch({
              type: 'LOAD_TEAM',
              payload: { ...state, slots: nextSlots, slotNotes: nextSlotNotes },
            });
            moveOverdriveSlot(targetSlotIndex, emptySlotIndex);
          } else {
            if (teamSize >= MAX_ROSTER_SIZE) {
              notifyTeamFull();
              return;
            }

            dispatch({
              type: 'SET_SLOT',
              slotIndex: targetSlotIndex,
              characterKey,
            });
            dispatch({
              type: 'SET_SLOT_NOTE',
              slotIndex: targetSlotIndex,
              note: incomingNote,
            });
            removeOverdriveSlot(targetSlotIndex);
          }

          if (from.zone === 'bench') {
            dispatch({
              type: 'SET_BENCH',
              bench: removeItem(state.bench, characterKey),
              benchNotes: Object.fromEntries(
                Object.entries(state.benchNotes).filter(
                  ([key]) => key !== characterKey
                )
              ),
            });
          }

          return;
        }

        if (from.zone === 'slot' && from.index !== undefined) {
          if (from.index === targetSlotIndex) return;
          if (occupant && !isValidPlacement(occupant, from.index)) {
            notifyInvalidPlacement(occupant, from.index);
            return;
          }

          const nextSlots = [...state.slots];
          nextSlots[from.index] = occupant;
          nextSlots[targetSlotIndex] = characterKey;

          const nextSlotNotes = [...state.slotNotes];
          const fromNote = nextSlotNotes[from.index];
          nextSlotNotes[from.index] = nextSlotNotes[targetSlotIndex];
          nextSlotNotes[targetSlotIndex] = fromNote;

          dispatch({
            type: 'LOAD_TEAM',
            payload: { ...state, slots: nextSlots, slotNotes: nextSlotNotes },
          });
          swapOverdriveSlots(from.index, targetSlotIndex);
        }

        return;
      }

      if (overId === 'available') {
        if (from.zone === 'slot' && from.index !== undefined) {
          dispatch({
            type: 'SET_SLOT',
            slotIndex: from.index,
            characterKey: null,
          });
          dispatch({ type: 'SET_SLOT_NOTE', slotIndex: from.index, note: '' });
          removeOverdriveSlot(from.index);
        } else if (from.zone === 'bench') {
          dispatch({
            type: 'SET_BENCH',
            bench: removeItem(state.bench, characterKey),
            benchNotes: Object.fromEntries(
              Object.entries(state.benchNotes).filter(
                ([key]) => key !== characterKey
              )
            ),
          });
        }
        return;
      }

      if (overId.startsWith('bench-item-')) {
        const targetKey = overId.replace('bench-item-', '');
        if (!state.bench.includes(targetKey)) return;

        if (from.zone === 'bench') {
          if (characterKey === targetKey) return;
          const fromIndex = state.bench.indexOf(characterKey);
          const toIndex = state.bench.indexOf(targetKey);
          if (fromIndex === -1 || toIndex === -1) return;

          const nextBench = [...state.bench];
          [nextBench[fromIndex], nextBench[toIndex]] = [
            nextBench[toIndex],
            nextBench[fromIndex],
          ];
          dispatch({ type: 'SET_BENCH', bench: nextBench });
          return;
        }

        if (from.zone === 'slot' && from.index !== undefined) {
          if (!isValidPlacement(targetKey, from.index)) {
            notifyInvalidPlacement(targetKey, from.index);
            return;
          }

          const movedSlotNote = state.slotNotes[from.index] || '';
          const incomingBenchNote = state.benchNotes[targetKey] || '';

          dispatch({
            type: 'SET_SLOT',
            slotIndex: from.index,
            characterKey: targetKey,
          });
          dispatch({
            type: 'SET_SLOT_NOTE',
            slotIndex: from.index,
            note: incomingBenchNote,
          });
          removeOverdriveSlot(from.index);

          const nextBench = [...state.bench];
          const targetIndex = nextBench.indexOf(targetKey);
          if (targetIndex !== -1) {
            nextBench[targetIndex] = characterKey;
          }

          dispatch({
            type: 'SET_BENCH',
            bench: nextBench,
            benchNotes: {
              ...Object.fromEntries(
                Object.entries(state.benchNotes).filter(
                  ([key]) => key !== targetKey
                )
              ),
              [characterKey]: movedSlotNote,
            },
          });
          return;
        }

        if (from.zone === 'available') {
          dispatch({
            type: 'SET_BENCH',
            bench: insertUniqueBefore(state.bench, characterKey, targetKey),
            benchNotes: {
              ...state.benchNotes,
              [characterKey]: state.benchNotes[characterKey] || '',
            },
          });
        }

        return;
      }

      if (overId === 'bench') {
        if (from.zone === 'slot' && from.index !== undefined) {
          const movedSlotNote = state.slotNotes[from.index] || '';
          dispatch({
            type: 'SET_SLOT',
            slotIndex: from.index,
            characterKey: null,
          });
          dispatch({ type: 'SET_SLOT_NOTE', slotIndex: from.index, note: '' });
          removeOverdriveSlot(from.index);

          dispatch({
            type: 'SET_BENCH',
            bench: state.bench.includes(characterKey)
              ? state.bench
              : [...state.bench, characterKey],
            benchNotes: {
              ...state.benchNotes,
              [characterKey]: state.benchNotes[characterKey]?.trim().length
                ? state.benchNotes[characterKey]
                : movedSlotNote,
            },
          });
          return;
        }

        if (from.zone === 'available') {
          dispatch({
            type: 'SET_BENCH',
            bench: state.bench.includes(characterKey)
              ? state.bench
              : [...state.bench, characterKey],
            benchNotes: {
              ...state.benchNotes,
              [characterKey]: state.benchNotes[characterKey] || '',
            },
          });
        }
      }
    },
    [
      findCharacterLocation,
      findValidEmptySlotForCharacter,
      isValidPlacement,
      moveOverdriveSlot,
      notifyInvalidPlacement,
      notifyNoValidSwapRoom,
      notifyTeamFull,
      removeOverdriveSlot,
      state,
      swapOverdriveSlots,
      teamSize,
    ]
  );

  return {
    activeId,
    availableCharacters,
    bench: state.bench,
    benchNotes: state.benchNotes,
    characterByIdentity,
    characterNameCounts,
    factionColor,
    getCharacterFromKey,
    getCharacterPath,
    handleAddToNextSlot,
    handleAuthorCommit,
    handleBenchNoteChange,
    handleClear,
    handleContentTypeChange,
    handleDescriptionCommit,
    handleDragEnd,
    handleDragStart,
    handleFactionChange,
    handleNameCommit,
    handleOverdriveOrderChange,
    handlePasteApply,
    handleRemoveFromTeam,
    handleSlotNoteChange,
    handleWyrmspellChange,
    hasAnyBuilderData,
    json,
    meta: state.meta,
    overdriveOrderBySlot,
    slotNotes: state.slotNotes,
    slots: state.slots,
    synergy,
    teamData,
    teamSize,
    teamWyrmspells: state.teamWyrmspells,
  };
}
