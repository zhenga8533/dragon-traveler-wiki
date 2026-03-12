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
  ActionIcon,
  Badge,
  Box,
  Button,
  CopyButton,
  Group,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  IoCheckmark,
  IoClipboardOutline,
  IoCopy,
  IoDownload,
  IoOpenOutline,
  IoSave,
  IoTrash,
} from 'react-icons/io5';
import { FACTION_COLOR } from '@/constants/colors';
import {
  DEFAULT_CONTENT_TYPE,
  normalizeContentType,
  type ContentType,
} from '@/constants/content-types';
import { STORAGE_KEY } from '@/constants/ui';
import {
  useCharacterResolution,
  useDarkMode,
  useGradientAccent,
  useIsMobile,
  useMobileTooltip,
} from '@/hooks';
import { BattlefieldGrid } from '@/features/teams/components/BattlefieldGrid';
import { BenchSection } from '@/features/teams/components/BenchSection';
import type { Character } from '@/features/characters/types';
import type { FactionName } from '@/types/faction';
import type { Team, TeamMember, TeamWyrmspells } from '@/features/teams/types';
import type { Wyrmspell } from '@/features/wiki/types/wyrmspell';
import {
  getCharacterBaseSlug,
  getCharacterByReferenceKey,
  getCharacterIdentityKey,
  getCharacterRoutePath,
  getCharacterRoutePathByName,
  resolveCharacterByNameAndQuality,
  resolveCharacterReferenceKey,
  toCharacterReferenceFromKey,
} from '@/features/characters/utils/character-route';
import { insertUniqueBefore, removeItem } from '@/features/teams/utils/dnd-list';
import { toEntitySlug } from '@/utils/entity-slug';
import { downloadElementAsPng } from '@/utils/export-image';
import { buildSuggestionIssueUrls } from '@/utils/github-issues';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryNote,
  getTeamBenchEntryQuality,
} from '@/features/teams/utils/team-bench';
import { computeTeamSynergy } from '@/features/teams/utils/team-synergy';
import { showSuccessToast, showWarningToast } from '@/utils/toast';
import CharacterCard from '@/features/characters/components/CharacterCard';
import FilterableCharacterPool from '@/features/characters/components/FilterableCharacterPool';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import TeamSynergyAssistant from '@/features/teams/components/TeamSynergyAssistant';
import {
  AvailablePool,
  BenchPool,
  DraggableCharCard,
  PasteJsonModal,
  SlotsGrid,
  TeamMetaFields,
  WyrmspellSelector,
} from './components';
import {
  getPastedTeamPatch,
  getValidRows,
  GRID_SIZE,
  MAX_ROSTER_SIZE,
  normalizeNote,
  normalizeTeamFromPartial,
  ROW_LABELS,
} from './utils';

interface TeamBuilderProps {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: Team | null;
  wyrmspells?: Wyrmspell[];
}

/* ── Main TeamBuilder ── */

export default function TeamBuilder({
  characters,
  charMap,
  initialData,
  wyrmspells = [],
}: TeamBuilderProps) {
  const { accent } = useGradientAccent();
  // Team grid: 3×3 = 9 slots (indexed row*3+col)
  const [slots, setSlots] = useState<(string | null)[]>(
    Array(GRID_SIZE).fill(null)
  );
  // Ordered slot indexes representing overdrive order (index 0 => OD 1)
  const [overdriveSequence, setOverdriveSequence] = useState<number[]>([]);
  // Track bench characters (team-level)
  const [bench, setBench] = useState<string[]>([]);
  // Track notes for bench characters
  const [benchNotes, setBenchNotes] = useState<Record<string, string>>({});
  // Track notes for each slot
  const [slotNotes, setSlotNotes] = useState<string[]>(
    Array(GRID_SIZE).fill('')
  );
  // Track wyrmspells
  const [teamWyrmspells, setTeamWyrmspells] = useState<TeamWyrmspells>({});
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [contentType, setContentType] =
    useState<ContentType>(DEFAULT_CONTENT_TYPE);
  const [description, setDescription] = useState('');
  const [faction, setFaction] = useState<FactionName | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pasteModalOpened, { open: openPasteModal, close: closePasteModal }] =
    useDisclosure(false);

  const [
    clearConfirmOpened,
    { open: openClearConfirm, close: closeClearConfirm },
  ] = useDisclosure(false);
  const isMobile = useIsMobile();
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pendingSaveOverwrite, setPendingSaveOverwrite] = useState<
    string | null
  >(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode();
  const tooltipProps = useMobileTooltip();

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

  const handleContentTypeChange = useCallback((value: string | null) => {
    setContentType(normalizeContentType(value, DEFAULT_CONTENT_TYPE));
  }, []);
  const handleFactionChange = useCallback((value: string | null) => {
    setFaction(value as FactionName | null);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    })
  );

  const loadFromTeam = useCallback(
    (data: Team) => {
      setName(data.name || '');
      setAuthor(data.author || '');
      setContentType(normalizeContentType(data.content_type));
      setDescription(data.description || '');
      setFaction(data.faction || null);

      const newSlots: (string | null)[] = Array(GRID_SIZE).fill(null);
      const parsedOverdriveEntries: Array<{
        slotIndex: number;
        order: number;
      }> = [];
      const newNotes: string[] = Array(GRID_SIZE).fill('');
      const usedKeys = new Set<string>();

      for (const member of data.members) {
        const characterKey = getCharacterKeyFromReference(
          member.character_name,
          member.character_quality
        );
        if (usedKeys.has(characterKey)) continue;

        let idx: number;
        if (member.position) {
          idx = member.position.row * 3 + member.position.col;
        } else {
          idx = newSlots.findIndex((slotValue) => slotValue === null);
        }

        if (idx >= 0 && idx < GRID_SIZE && newSlots[idx] === null) {
          newSlots[idx] = characterKey;
          usedKeys.add(characterKey);
          if (member.overdrive_order != null) {
            parsedOverdriveEntries.push({
              slotIndex: idx,
              order: member.overdrive_order,
            });
          }
          newNotes[idx] = normalizeNote(member.note) || '';
        }
      }

      parsedOverdriveEntries.sort((a, b) => a.order - b.order);
      const normalizedOverdriveSequence = parsedOverdriveEntries
        .map((entry) => entry.slotIndex)
        .slice(0, MAX_ROSTER_SIZE);

      const seenBenchKeys = new Set<string>();
      const normalizedBenchEntries = (data.bench || [])
        .map((benchEntry) => {
          const benchName = getTeamBenchEntryName(benchEntry);
          const benchQuality = getTeamBenchEntryQuality(benchEntry);
          const benchKey = getCharacterKeyFromReference(
            benchName,
            benchQuality
          );
          const benchNote = normalizeNote(getTeamBenchEntryNote(benchEntry));
          return { benchKey, benchNote };
        })
        .filter((entry) => {
          if (!entry.benchKey) return false;
          if (usedKeys.has(entry.benchKey)) return false;
          if (seenBenchKeys.has(entry.benchKey)) return false;
          seenBenchKeys.add(entry.benchKey);
          return true;
        });

      const normalizedBench = normalizedBenchEntries.map(
        (entry) => entry.benchKey
      );
      const normalizedBenchNotes: Record<string, string> = Object.fromEntries(
        normalizedBenchEntries
          .map((entry) => [entry.benchKey, entry.benchNote] as const)
          .filter((entry): entry is readonly [string, string] => {
            const [, note] = entry;
            return Boolean(note);
          })
      );

      setTeamWyrmspells(data.wyrmspells || {});
      setBench(normalizedBench);
      setBenchNotes(normalizedBenchNotes);
      setSlots(newSlots);
      setOverdriveSequence(normalizedOverdriveSequence);
      setSlotNotes(newNotes);
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
      queueMicrotask(() => {
        setDraftHydrated(true);
      });
      return;
    }

    const storedDraft = window.localStorage.getItem(
      STORAGE_KEY.TEAMS_BUILDER_DRAFT
    );
    if (storedDraft) {
      try {
        const parsedDraft = JSON.parse(storedDraft) as Team;
        if (Array.isArray(parsedDraft.members)) {
          queueMicrotask(() => {
            loadFromTeam(parsedDraft);
          });
        } else {
          window.localStorage.removeItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT);
      }
    }

    queueMicrotask(() => {
      setDraftHydrated(true);
    });
  }, [initialData, loadFromTeam]);

  const deferredName = useDeferredValue(name);
  const deferredAuthor = useDeferredValue(author);
  const deferredDescription = useDeferredValue(description);
  const deferredContentType = useDeferredValue(contentType);
  const deferredFaction = useDeferredValue(faction);

  const overdriveOrderBySlot = useMemo(() => {
    const map = new Map<number, number>();
    overdriveSequence.forEach((slotIndex, orderIdx) => {
      if (slots[slotIndex]) {
        map.set(slotIndex, orderIdx + 1);
      }
    });
    return map;
  }, [overdriveSequence, slots]);

  const factionColor = faction ? FACTION_COLOR[faction] : 'blue';

  // Set of all names currently on the team
  const teamNames = useMemo(() => {
    const s = new Set<string>();
    for (const n of slots) {
      if (n) s.add(n);
    }
    return s;
  }, [slots]);

  const teamSize = teamNames.size;

  const hasAnyBuilderData = useMemo(
    () =>
      teamSize > 0 ||
      bench.length > 0 ||
      overdriveSequence.length > 0 ||
      slotNotes.some((note) => Boolean(normalizeNote(note))) ||
      Object.values(benchNotes).some((note) => Boolean(normalizeNote(note))) ||
      Object.values(teamWyrmspells).some((value) => Boolean(value)) ||
      name.trim().length > 0 ||
      author.trim().length > 0 ||
      description.trim().length > 0 ||
      faction !== null ||
      contentType !== DEFAULT_CONTENT_TYPE,
    [
      author,
      bench.length,
      benchNotes,
      contentType,
      description,
      faction,
      name,
      overdriveSequence.length,
      slotNotes,
      teamSize,
      teamWyrmspells,
    ]
  );

  const json = (() => {
    const members: TeamMember[] = [];
    let overdriveOrder = 1;

    // Add members with overdrive first (in grid order, row by row)
    for (const slotIndex of overdriveSequence) {
      const n = slots[slotIndex];
      if (n) {
        const slotNote = normalizeNote(slotNotes[slotIndex]);
        members.push({
          ...toCharacterReferenceFromKey(
            n,
            charMap,
            characterByIdentity,
            characterNameCounts
          ),
          overdrive_order: overdriveOrder++,
          position: { row: Math.floor(slotIndex / 3), col: slotIndex % 3 },
          ...(slotNote ? { note: slotNote } : {}),
        });
      }
    }

    // Then add members without overdrive
    for (let i = 0; i < GRID_SIZE; i++) {
      const n = slots[i];
      if (n && !overdriveOrderBySlot.has(i)) {
        const slotNote = normalizeNote(slotNotes[i]);
        members.push({
          ...toCharacterReferenceFromKey(
            n,
            charMap,
            characterByIdentity,
            characterNameCounts
          ),
          overdrive_order: null,
          position: { row: Math.floor(i / 3), col: i % 3 },
          ...(slotNote ? { note: slotNote } : {}),
        });
      }
    }

    const result: Team = {
      name: deferredName || 'My Team',
      author: deferredAuthor || 'Anonymous',
      content_type: deferredContentType,
      description: deferredDescription,
      faction: deferredFaction || 'Elemental Echo',
      members,
      last_updated: 0,
    };

    if (bench.length > 0) {
      result.bench = bench.map((characterKey) => {
        const reference = toCharacterReferenceFromKey(
          characterKey,
          charMap,
          characterByIdentity,
          characterNameCounts
        );
        const note = normalizeNote(benchNotes[characterKey]);
        return note ? { ...reference, note } : reference;
      });
    }

    // Add wyrmspells if any are selected
    const hasWyrmspells =
      teamWyrmspells.breach ||
      teamWyrmspells.refuge ||
      teamWyrmspells.wildcry ||
      teamWyrmspells.dragons_call;
    if (hasWyrmspells) {
      result.wyrmspells = teamWyrmspells;
    }

    return JSON.stringify(result, null, 2);
  })();

  useEffect(() => {
    if (!draftHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY.TEAMS_BUILDER_DRAFT, json);
  }, [draftHydrated, json]);

  const teamData = useMemo(() => JSON.parse(json) as Team, [json]);

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

  useEffect(() => {
    if (!isCapturing) return;
    const el = exportRef.current;
    if (!el) return;

    const run = async () => {
      // Brief delay so portrait images (already cached) can paint
      await new Promise((r) => setTimeout(r, 150));
      try {
        await downloadElementAsPng(el, teamData.name || 'team', isDark);
      } finally {
        setIsCapturing(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCapturing]);

  const usedNames = useMemo(() => {
    const s = new Set<string>();
    for (const n of slots) if (n) s.add(n);
    for (const n of bench) s.add(n);
    return s;
  }, [slots, bench]);

  const handlePasteApply = useCallback(
    (pasteText: string): string | null => {
      try {
        const parsed = JSON.parse(pasteText) as unknown;
        const partialTeam = getPastedTeamPatch(parsed);
        if (!partialTeam) {
          return 'Invalid team JSON: expected an object or a members array.';
        }
        const currentTeam = JSON.parse(json) as Team;
        const mergedTeam = normalizeTeamFromPartial(partialTeam, currentTeam);
        loadFromTeam(mergedTeam);
        closePasteModal();
        return null;
      } catch {
        return 'Could not parse JSON. Paste a JSON object, a one-item team array, or a members array.';
      }
    },
    [json, closePasteModal, loadFromTeam]
  );

  const availableCharacters = useMemo(() => {
    return characters.filter((c) => !usedNames.has(getCharacterIdentityKey(c)));
  }, [characters, usedNames]);

  const handleWyrmspellChange = useCallback(
    (key: keyof TeamWyrmspells, value: string | null) => {
      setTeamWyrmspells((prev) => ({ ...prev, [key]: value || undefined }));
    },
    []
  );

  const synergy = useMemo(() => {
    const roster = slots
      .filter((slotName): slotName is string => Boolean(slotName))
      .map((slotName) => getCharacterFromKey(slotName))
      .filter((c): c is Character => Boolean(c));

    return computeTeamSynergy({
      roster,
      faction,
      contentType,
      overdriveCount: overdriveSequence.length,
      teamWyrmspells,
      wyrmspells,
    });
  }, [
    slots,
    getCharacterFromKey,
    faction,
    contentType,
    overdriveSequence,
    teamWyrmspells,
    wyrmspells,
  ]);

  const { issueUrl: teamIssueUrl, emptyIssueUrl: teamEmptyIssueUrl } = useMemo(
    () =>
      buildSuggestionIssueUrls({
        title: '[Team] New team suggestion',
        json,
        entityType: 'team',
      }),
    [json]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function removeOverdriveSlot(slotIndex: number) {
    setOverdriveSequence((prev) => prev.filter((idx) => idx !== slotIndex));
  }

  function swapOverdriveSlots(firstIndex: number, secondIndex: number) {
    setOverdriveSequence((prev) =>
      prev.map((idx) => {
        if (idx === firstIndex) return secondIndex;
        if (idx === secondIndex) return firstIndex;
        return idx;
      })
    );
  }

  function moveOverdriveSlot(fromIndex: number, toIndex: number) {
    setOverdriveSequence((prev) =>
      prev.map((idx) => (idx === fromIndex ? toIndex : idx))
    );
  }

  function isValidPlacement(charName: string, slotIndex: number): boolean {
    const char = getCharacterFromKey(charName);
    if (!char) return true;
    const row = Math.floor(slotIndex / 3);
    return getValidRows(char.character_class).includes(row);
  }

  function notifyInvalidPlacement(charName: string, slotIndex: number) {
    const char = getCharacterFromKey(charName);
    const displayName = char?.name ?? charName;
    const targetRow = Math.floor(slotIndex / 3);
    const targetRowLabel = ROW_LABELS[targetRow] || 'that row';

    showWarningToast({
      id: 'teambuilder-invalid-placement',
      title: 'Invalid slot placement',
      message: char
        ? `${displayName} (${char.character_class}) cannot be placed in ${targetRowLabel}.`
        : `${displayName} cannot be placed in ${targetRowLabel}.`,
      autoClose: 2400,
    });
  }

  function notifyTeamFull() {
    showWarningToast({
      id: 'teambuilder-team-full',
      title: 'Team is full',
      message: `A team can have up to ${MAX_ROSTER_SIZE} members. Remove one before adding another.`,
      autoClose: 2400,
    });
  }

  function notifyNoValidSwapRoom(charName: string) {
    const displayName = getCharacterFromKey(charName)?.name ?? charName;
    showWarningToast({
      id: 'teambuilder-no-valid-swap-room',
      title: 'No valid slot available',
      message: `${displayName} cannot be moved because no valid empty row is available.`,
      autoClose: 2400,
    });
  }

  function findValidEmptySlotForCharacter(charName: string): number {
    const char = getCharacterFromKey(charName);
    const validRows = char ? getValidRows(char.character_class) : [0, 1, 2];

    for (const row of validRows) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        if (!slots[idx]) return idx;
      }
    }
    return -1;
  }

  function findCharLocation(
    charName: string
  ):
    | { zone: 'slot'; index: number }
    | { zone: 'bench'; index: number }
    | { zone: 'available' } {
    const slotIdx = slots.indexOf(charName);
    if (slotIdx !== -1) return { zone: 'slot', index: slotIdx };
    const benchIdx = bench.indexOf(charName);
    if (benchIdx !== -1) return { zone: 'bench', index: benchIdx };
    return { zone: 'available' };
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const charName = event.active.id as string;
    const overId = event.over?.id as string | undefined;
    if (!overId) return;

    const from = findCharLocation(charName);

    // Determine target
    const isSlotTarget = overId.startsWith('slot-');
    const targetSlotIndex = isSlotTarget
      ? parseInt(overId.replace('slot-', ''), 10)
      : -1;

    // ── Drop onto a slot ──
    if (isSlotTarget) {
      if (!isValidPlacement(charName, targetSlotIndex)) {
        notifyInvalidPlacement(charName, targetSlotIndex);
        return;
      }
      const occupant = slots[targetSlotIndex];

      if (from.zone === 'bench' && occupant) {
        const incomingBenchNote = benchNotes[charName] || '';
        const outgoingSlotNote = slotNotes[targetSlotIndex] || '';

        setSlots((prev) => {
          const next = [...prev];
          next[targetSlotIndex] = charName;
          return next;
        });
        removeOverdriveSlot(targetSlotIndex);
        setSlotNotes((prev) => {
          const next = [...prev];
          next[targetSlotIndex] = incomingBenchNote;
          return next;
        });
        setBench((prev) => {
          const next = [...prev];
          const benchIndex = next.indexOf(charName);
          if (benchIndex !== -1) {
            next[benchIndex] = occupant;
          }
          return next;
        });
        setBenchNotes((prev) => {
          const next = { ...prev };
          delete next[charName];
          next[occupant] = outgoingSlotNote;
          return next;
        });
        return;
      }

      if (from.zone === 'available' || from.zone === 'bench') {
        const incomingNote =
          from.zone === 'bench' ? benchNotes[charName] || '' : '';
        // Available → slot
        if (occupant && teamSize >= MAX_ROSTER_SIZE) {
          // Team full, swap occupant back to available — clear occupant's notes
          setSlots((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = charName;
            return next;
          });
          removeOverdriveSlot(targetSlotIndex);
          setSlotNotes((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = incomingNote;
            return next;
          });
        } else if (occupant) {
          // Slot occupied but team not full — move occupant (with its notes) to empty slot
          const emptyIdx = findValidEmptySlotForCharacter(occupant);
          if (emptyIdx === -1) {
            notifyNoValidSwapRoom(occupant);
            return;
          }

          setSlots((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = charName;
            next[emptyIdx] = occupant;
            return next;
          });
          moveOverdriveSlot(targetSlotIndex, emptyIdx);
          setSlotNotes((prev) => {
            const next = [...prev];
            next[emptyIdx] = next[targetSlotIndex]; // Move occupant's note
            next[targetSlotIndex] = incomingNote;
            return next;
          });
        } else {
          // Slot empty — check team size
          if (teamSize >= MAX_ROSTER_SIZE) {
            notifyTeamFull();
            return;
          }
          setSlots((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = charName;
            return next;
          });
          removeOverdriveSlot(targetSlotIndex);
          setSlotNotes((prev) => {
            const next = [...prev];
            next[targetSlotIndex] = incomingNote;
            return next;
          });
        }

        if (from.zone === 'bench') {
          setBench((prev) => removeItem(prev, charName));
          setBenchNotes((prev) => {
            const next = { ...prev };
            delete next[charName];
            return next;
          });
        }
      } else if (from.zone === 'slot') {
        // Slot → different slot: swap
        const fromIndex = from.index;
        if (fromIndex === targetSlotIndex) return;
        if (occupant && !isValidPlacement(occupant, fromIndex)) {
          notifyInvalidPlacement(occupant, fromIndex);
          return;
        }
        setSlots((prev) => {
          const next = [...prev];
          next[fromIndex] = occupant;
          next[targetSlotIndex] = charName;
          return next;
        });
        swapOverdriveSlots(fromIndex, targetSlotIndex);
        setSlotNotes((prev) => {
          const next = [...prev];
          const temp = next[fromIndex];
          next[fromIndex] = next[targetSlotIndex];
          next[targetSlotIndex] = temp;
          return next;
        });
      }
      return;
    }

    // ── Drop onto available pool ──
    if (overId === 'available') {
      if (from.zone === 'slot') {
        setSlots((prev) => {
          const next = [...prev];
          next[from.index] = null;
          return next;
        });
        removeOverdriveSlot(from.index);
        setSlotNotes((prev) => {
          const next = [...prev];
          next[from.index] = '';
          return next;
        });
      } else if (from.zone === 'bench') {
        setBench((prev) => removeItem(prev, charName));
        setBenchNotes((prev) => {
          const next = { ...prev };
          delete next[charName];
          return next;
        });
      }
      return;
    }

    // ── Drop onto a bench character (insert/reorder) ──
    if (overId.startsWith('bench-item-')) {
      const targetName = overId.replace('bench-item-', '');
      if (!bench.includes(targetName)) return;

      if (from.zone === 'bench') {
        if (charName === targetName) return;
        setBench((prev) => {
          const fromIndex = prev.indexOf(charName);
          const toIndex = prev.indexOf(targetName);
          if (fromIndex === -1 || toIndex === -1) return prev;
          const next = [...prev];
          [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
          return next;
        });
        return;
      }

      if (from.zone === 'slot') {
        if (!isValidPlacement(targetName, from.index)) {
          notifyInvalidPlacement(targetName, from.index);
          return;
        }

        const movedSlotNote = slotNotes[from.index] || '';
        const incomingBenchNote = benchNotes[targetName] || '';

        setSlots((prev) => {
          const next = [...prev];
          next[from.index] = targetName;
          return next;
        });
        removeOverdriveSlot(from.index);
        setSlotNotes((prev) => {
          const next = [...prev];
          next[from.index] = incomingBenchNote;
          return next;
        });
        setBench((prev) => {
          const next = [...prev];
          const targetIndex = next.indexOf(targetName);
          if (targetIndex !== -1) {
            next[targetIndex] = charName;
          }
          return next;
        });
        setBenchNotes((prev) => {
          const next = { ...prev };
          delete next[targetName];
          next[charName] = movedSlotNote;
          return next;
        });
        return;
      }

      if (from.zone === 'available') {
        setBench((prev) => insertUniqueBefore(prev, charName, targetName));
        setBenchNotes((prev) => ({
          ...prev,
          [charName]: prev[charName] || '',
        }));
      }

      return;
    }

    // ── Drop onto bench ──
    if (overId === 'bench') {
      if (from.zone === 'slot') {
        const movedSlotNote = slotNotes[from.index];
        setSlots((prev) => {
          const next = [...prev];
          next[from.index] = null;
          return next;
        });
        removeOverdriveSlot(from.index);
        setSlotNotes((prev) => {
          const next = [...prev];
          next[from.index] = '';
          return next;
        });
        setBenchNotes((prev) => ({
          ...prev,
          [charName]: prev[charName]?.trim().length
            ? prev[charName]
            : movedSlotNote,
        }));
      }

      if (from.zone === 'available' || from.zone === 'slot') {
        setBench((prev) =>
          prev.includes(charName) ? prev : [...prev, charName]
        );
        setBenchNotes((prev) => ({
          ...prev,
          [charName]: prev[charName] || '',
        }));
      }

      return;
    }
  }

  function executeSaveToMySaved(key: string) {
    try {
      const data = JSON.parse(json) as Team;
      const now = Math.floor(Date.now() / 1000);
      const normalized: Team = { ...data, last_updated: now };
      const stored = window.localStorage.getItem(STORAGE_KEY.TEAMS_MY_SAVED);
      const saves: Record<string, Team> = stored
        ? (JSON.parse(stored) as Record<string, Team>)
        : {};
      saves[key] = normalized;
      window.localStorage.setItem(
        STORAGE_KEY.TEAMS_MY_SAVED,
        JSON.stringify(saves)
      );
      showSuccessToast({
        title: 'Saved!',
        message: `"${key}" saved to My Saved Teams.`,
      });
    } catch {
      // ignore
    }
  }

  function handleSaveToMySaved() {
    try {
      const data = JSON.parse(json) as Team;
      const key = toEntitySlug(data.name?.trim() || 'Untitled');
      const stored = window.localStorage.getItem(STORAGE_KEY.TEAMS_MY_SAVED);
      const saves: Record<string, Team> = stored
        ? (JSON.parse(stored) as Record<string, Team>)
        : {};
      if (saves[key]) {
        setPendingSaveOverwrite(key);
        return;
      }
      executeSaveToMySaved(key);
    } catch {
      // ignore
    }
  }

  function handleAddToNextSlot(charName: string) {
    if (teamSize >= MAX_ROSTER_SIZE) {
      notifyTeamFull();
      return;
    }
    const targetIdx = findValidEmptySlotForCharacter(charName);
    const displayName = getCharacterFromKey(charName)?.name ?? charName;

    if (targetIdx === -1) {
      showWarningToast({
        id: 'teambuilder-no-valid-slot',
        title: 'No valid slot available',
        message: `${displayName} has no empty valid row right now. Move someone first.`,
        autoClose: 2400,
      });
      return;
    }

    setSlots((prev) => {
      const next = [...prev];
      next[targetIdx] = charName;
      return next;
    });
    removeOverdriveSlot(targetIdx);
  }

  function handleOverdriveOrderChange(slotIndex: number, value: number | null) {
    if (!slots[slotIndex]) return; // No character in slot
    setOverdriveSequence((prev) => {
      const withoutCurrent = prev.filter((idx) => idx !== slotIndex);

      if (value == null || !Number.isFinite(value)) {
        return withoutCurrent;
      }

      const slotCap = slots.filter(Boolean).length;
      const maxOrder = Math.min(MAX_ROSTER_SIZE, Math.max(1, slotCap));
      const clampedOrder = Math.min(Math.max(Math.round(value), 1), maxOrder);
      const insertAt = clampedOrder - 1;
      const next = [...withoutCurrent];
      next.splice(insertAt, 0, slotIndex);
      return next.slice(0, MAX_ROSTER_SIZE);
    });
  }

  function handleRemoveFromTeam(slotIndex: number) {
    const charName = slots[slotIndex];
    if (!charName) return;
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    removeOverdriveSlot(slotIndex);
    setSlotNotes((prev) => {
      const next = [...prev];
      next[slotIndex] = '';
      return next;
    });
  }

  function handleSlotNoteChange(slotIndex: number, note: string) {
    const normalized = normalizeNote(note) || '';
    setSlotNotes((prev) => {
      const next = [...prev];
      next[slotIndex] = normalized;
      return next;
    });
  }

  function handleBenchNoteChange(charName: string, note: string) {
    const normalized = normalizeNote(note);
    setBenchNotes((prev) => {
      const next = { ...prev };
      if (normalized) {
        next[charName] = normalized;
      } else {
        delete next[charName];
      }
      return next;
    });
  }

  function handleSubmitSuggestion() {
    if (!teamIssueUrl) {
      window.open(teamEmptyIssueUrl, '_blank');
      showWarningToast({
        title: 'Team JSON is too large',
        message:
          'Please copy the JSON using the Copy JSON button and paste it into the GitHub issue body.',
        autoClose: 8000,
      });
      return;
    }
    window.open(teamIssueUrl, '_blank');
  }

  function handleClear() {
    setSlots(Array(GRID_SIZE).fill(null));
    setOverdriveSequence([]);
    setSlotNotes(Array(GRID_SIZE).fill(''));
    setBench([]);
    setBenchNotes({});
    setTeamWyrmspells({});
    setName('');
    setAuthor('');
    setContentType(DEFAULT_CONTENT_TYPE);
    setDescription('');
    setFaction(null);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Stack gap="md">
          <TeamMetaFields
            name={name}
            author={author}
            contentType={contentType}
            faction={faction}
            description={description}
            onNameCommit={setName}
            onAuthorCommit={setAuthor}
            onContentTypeChange={handleContentTypeChange}
            onFactionChange={handleFactionChange}
            onDescriptionCommit={setDescription}
          />

          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Group gap="xs" wrap="nowrap">
              <CopyButton value={json}>
                {({ copied, copy }) =>
                  isMobile ? (
                    <Tooltip label={copied ? 'Copied!' : 'Copy JSON'} withArrow>
                      <ActionIcon
                        variant="light"
                        color={copied ? accent.secondary : accent.primary}
                        onClick={copy}
                      >
                        {copied ? (
                          <IoCheckmark size={16} />
                        ) : (
                          <IoCopy size={16} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="light"
                      color={copied ? accent.secondary : accent.primary}
                      size="sm"
                      leftSection={
                        copied ? (
                          <IoCheckmark size={16} />
                        ) : (
                          <IoCopy size={16} />
                        )
                      }
                      onClick={copy}
                    >
                      {copied ? 'Copied' : 'Copy JSON'}
                    </Button>
                  )
                }
              </CopyButton>
              {isMobile ? (
                <Tooltip label="Paste JSON" withArrow>
                  <ActionIcon
                    variant="light"
                    color={accent.primary}
                    onClick={openPasteModal}
                  >
                    <IoClipboardOutline size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Button
                  variant="light"
                  color={accent.primary}
                  size="sm"
                  leftSection={<IoClipboardOutline size={16} />}
                  onClick={openPasteModal}
                >
                  Paste JSON
                </Button>
              )}
              {isMobile ? (
                <Tooltip label="Save to My Saved" withArrow>
                  <ActionIcon
                    variant="light"
                    color={accent.primary}
                    onClick={handleSaveToMySaved}
                  >
                    <IoSave size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Button
                  variant="light"
                  color={accent.primary}
                  size="sm"
                  leftSection={<IoSave size={16} />}
                  onClick={handleSaveToMySaved}
                >
                  Save
                </Button>
              )}
            </Group>
            <Group gap="xs" wrap="nowrap">
              {isMobile ? (
                <Tooltip label="Export as Image" withArrow>
                  <ActionIcon
                    variant="light"
                    color={accent.primary}
                    disabled={teamSize === 0}
                    loading={isCapturing}
                    onClick={() => setIsCapturing(true)}
                  >
                    <IoDownload size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Button
                  variant="light"
                  color={accent.primary}
                  size="sm"
                  leftSection={<IoDownload size={16} />}
                  onClick={() => setIsCapturing(true)}
                  loading={isCapturing}
                  disabled={teamSize === 0}
                >
                  Export Image
                </Button>
              )}
              {isMobile ? (
                <Tooltip label="Submit Suggestion" withArrow>
                  <ActionIcon
                    variant="light"
                    color={accent.primary}
                    disabled={teamSize === 0}
                    onClick={handleSubmitSuggestion}
                  >
                    <IoOpenOutline size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Button
                  variant="light"
                  color={accent.primary}
                  size="sm"
                  leftSection={<IoOpenOutline size={16} />}
                  onClick={handleSubmitSuggestion}
                  disabled={teamSize === 0}
                >
                  Submit Suggestion
                </Button>
              )}
              {isMobile ? (
                <Tooltip label="Clear All" withArrow>
                  <ActionIcon
                    variant="light"
                    color="red"
                    disabled={!hasAnyBuilderData}
                    onClick={openClearConfirm}
                  >
                    <IoTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Button
                  variant="light"
                  color="red"
                  size="sm"
                  leftSection={<IoTrash size={16} />}
                  onClick={openClearConfirm}
                  disabled={!hasAnyBuilderData}
                >
                  Clear All
                </Button>
              )}
              <Badge
                variant="light"
                color={accent.secondary}
                size="lg"
                radius="sm"
              >
                {teamSize} / {MAX_ROSTER_SIZE}
              </Badge>
            </Group>
          </Group>

          <TeamSynergyAssistant synergy={synergy} />

          <WyrmspellSelector
            wyrmspells={wyrmspells}
            teamWyrmspells={teamWyrmspells}
            onChange={handleWyrmspellChange}
          />

          <SlotsGrid
            slots={slots}
            overdriveOrderBySlot={overdriveOrderBySlot}
            slotNotes={slotNotes}
            charMap={characterByIdentity}
            onOverdriveOrderChange={handleOverdriveOrderChange}
            onRemove={handleRemoveFromTeam}
            onNoteChange={handleSlotNoteChange}
            activeId={activeId}
            nameCounts={characterNameCounts}
          />

          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Bench
            </Text>
            <BenchPool
              bench={bench}
              charMap={characterByIdentity}
              benchNotes={benchNotes}
              onBenchNoteChange={handleBenchNoteChange}
              nameCounts={characterNameCounts}
            />
          </Stack>

          <FilterableCharacterPool characters={availableCharacters}>
            {(filtered, filterHeader, paginationControl) => (
              <AvailablePool
                filterHeader={filterHeader}
                paginationControl={paginationControl}
              >
                {filtered.map((c) => (
                  <DraggableCharCard
                    key={getCharacterIdentityKey(c)}
                    name={c.name}
                    charKey={getCharacterIdentityKey(c)}
                    char={c}
                    size={isMobile ? 56 : undefined}
                    nameCounts={characterNameCounts}
                    onClick={() =>
                      handleAddToNextSlot(getCharacterIdentityKey(c))
                    }
                  />
                ))}
              </AvailablePool>
            )}
          </FilterableCharacterPool>
        </Stack>

        {typeof document !== 'undefined'
          ? createPortal(
              <DragOverlay dropAnimation={null}>
                {activeId
                  ? (() => {
                      const activeChar = getCharacterFromKey(activeId);
                      const isDuplicate =
                        activeChar &&
                        (characterNameCounts.get(
                          getCharacterBaseSlug(activeChar.name)
                        ) ?? 1) > 1;
                      return (
                        <div style={{ cursor: 'grabbing' }}>
                          <CharacterCard
                            name={activeChar?.name ?? activeId}
                            label={
                              isDuplicate && activeChar
                                ? `${activeChar.name} (${activeChar.quality})`
                                : undefined
                            }
                            quality={activeChar?.quality}
                            disableLink
                            routePath={
                              activeChar
                                ? getCharacterRoutePath(
                                    activeChar,
                                    characterNameCounts
                                  )
                                : undefined
                            }
                          />
                        </div>
                      );
                    })()
                  : null}
              </DragOverlay>,
              document.body
            )
          : null}

        <PasteJsonModal
          opened={pasteModalOpened}
          onClose={closePasteModal}
          onApply={handlePasteApply}
        />

        <ConfirmActionModal
          opened={clearConfirmOpened}
          onCancel={closeClearConfirm}
          title="Clear team builder?"
          message="This will remove all team slots, bench entries, notes, overdrive order, selected wyrmspells, and metadata fields (name, author, content type, faction, and description) in the builder."
          confirmLabel="Clear All"
          confirmColor="red"
          onConfirm={() => {
            handleClear();
            closeClearConfirm();
          }}
        />

        <ConfirmActionModal
          opened={pendingSaveOverwrite !== null}
          onCancel={() => setPendingSaveOverwrite(null)}
          title="Overwrite saved team?"
          message={`A saved team named "${pendingSaveOverwrite ?? ''}" already exists. Overwrite it?`}
          confirmLabel="Overwrite"
          confirmColor="blue"
          onConfirm={() => {
            if (pendingSaveOverwrite)
              executeSaveToMySaved(pendingSaveOverwrite);
            setPendingSaveOverwrite(null);
          }}
        />
      </DndContext>

      {/* Temporary container rendered only during export — matches team page style */}
      {/* opacity:0 on the wrapper hides it visually; the ref is on the inner Box so
        getComputedStyle sees opacity:1 (opacity is not inherited in CSS) */}
      {isCapturing && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <Box
            ref={exportRef}
            style={{
              width: 900,
              backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
              padding: 16,
            }}
          >
            <Stack gap="md">
              <BattlefieldGrid
                members={teamData.members}
                charMap={charMap}
                characterByIdentity={characterByIdentity}
                characterNameCounts={characterNameCounts}
                getCharacterPath={getCharacterPath}
                factionColor={factionColor}
                isDark={isDark}
                tooltipProps={tooltipProps}
                disableNameClamp
              />
              {teamData.bench && teamData.bench.length > 0 && (
                <BenchSection
                  bench={teamData.bench}
                  charMap={charMap}
                  characterByIdentity={characterByIdentity}
                  characterNameCounts={characterNameCounts}
                  getCharacterPath={getCharacterPath}
                  factionColor={factionColor}
                  tooltipProps={tooltipProps}
                  disableNameClamp
                />
              )}
            </Stack>
          </Box>
        </div>
      )}
    </>
  );
}
