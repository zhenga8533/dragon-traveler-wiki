import { useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GEAR_TYPE_ICON_MAP, getGearIcon } from '@/assets/gear';
import { getSubclassIcon } from '@/assets/subclass';
import { TierListReferenceContext } from '@/contexts';
import type { ChangesFile } from '@/types/changes';
import type {
  ActivatedSetBonus,
  Character,
  RecommendedGearDetail,
  RecommendedGearEntry,
  RecommendedSubclassEntry,
} from '@/features/characters/types';
import type { Gear, GearSet } from '@/features/wiki/types/gear';
import type { NoblePhantasm } from '@/features/wiki/types/noble-phantasm';
import type { StatusEffect } from '@/features/wiki/types/status-effect';
import type { Subclass } from '@/features/wiki/types/subclass';
import type { Team } from '@/features/teams/types';
import {
  getCharacterIdentityKey,
  getCharacterRoutePath,
  getCharacterRouteSlug,
  resolveCharacterRoute,
} from '@/features/characters/utils/character-route';
import { compareCharactersByQualityThenName } from '@/features/characters/utils/filter-characters';
import { useCharacterResolution } from './use-character-resolution';
import {
  useCharacterChanges,
  useCharacters,
  useGear,
  useGearSets,
  useNoblePhantasms,
  useStatusEffects,
  useSubclasses,
  useTeams,
} from '@/hooks/use-common-data';

const GEAR_SLOT_CONFIG: Array<{
  slot: keyof NonNullable<Character['recommended_gear']>;
  label: string;
  type: RecommendedGearEntry['type'];
  fallbackIcon: string;
}> = [
  {
    slot: 'headgear',
    label: 'Headgear',
    type: 'Headgear',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Headgear,
  },
  {
    slot: 'chestplate',
    label: 'Chestplate',
    type: 'Chestplate',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Chestplate,
  },
  {
    slot: 'bracers',
    label: 'Bracers',
    type: 'Bracers',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Bracers,
  },
  {
    slot: 'boots',
    label: 'Boots',
    type: 'Boots',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Boots,
  },
  {
    slot: 'weapon',
    label: 'Weapon',
    type: 'Weapon',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Weapon,
  },
  {
    slot: 'accessory',
    label: 'Accessory',
    type: 'Accessory',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Accessory,
  },
];

export interface CharacterPageData {
  loading: boolean;
  character: Character | null | undefined;
  sameNameVariants: Character[];
  routeBaseSlug: string | null;
  characterNameCounts: Map<string, number>;
  characterAssetKey: string | undefined;
  isPreferredCharacterForNameReferences: boolean;
  tierLabel: string | null;
  tierListCharacterNote: string | null;
  selectedTierListName: string | null;
  linkedNoblePhantasm: NoblePhantasm | null;
  subclassByName: Map<string, Subclass>;
  recommendedGearDetails: RecommendedGearDetail[];
  recommendedSubclassEntries: RecommendedSubclassEntry[];
  activatedSetBonuses: ActivatedSetBonus[];
  teams: Team[];
  statusEffects: StatusEffect[];
  changesData: ChangesFile;
  previousCharacter: Character | null;
  nextCharacter: Character | null;
  orderedCharacters: Character[];
}

export function useCharacterPageData(
  name: string | undefined
): CharacterPageData {
  const navigate = useNavigate();
  const { tierLists, selectedTierListName } = useContext(
    TierListReferenceContext
  );

  const { data: characters, loading } = useCharacters();
  const { data: statusEffects } = useStatusEffects();
  const { data: noblePhantasms } = useNoblePhantasms();
  const { data: subclasses } = useSubclasses();
  const { data: gear } = useGear();
  const { data: gearSets } = useGearSets();
  const { data: teams } = useTeams();
  const { data: changesData } = useCharacterChanges();

  const {
    preferredByName: preferredCharacterByName,
    nameCounts: characterNameCounts,
  } = useCharacterResolution(characters);

  const routeMatch = useMemo(
    () => resolveCharacterRoute(characters, name, characterNameCounts),
    [characters, name, characterNameCounts]
  );

  const character = routeMatch.character;

  const sameNameVariants = useMemo(
    () => [...routeMatch.variants].sort(compareCharactersByQualityThenName),
    [routeMatch.variants]
  );

  useEffect(() => {
    if (!name) return;

    if (character) {
      const canonicalSlug = getCharacterRouteSlug(
        character,
        characterNameCounts
      );
      if (routeMatch.incomingSlug === canonicalSlug) return;
      navigate(`/characters/${canonicalSlug}`, { replace: true });
      return;
    }

    if (sameNameVariants.length > 1 && routeMatch.baseSlug) {
      if (routeMatch.incomingSlug === routeMatch.baseSlug) return;
      navigate(`/characters/${routeMatch.baseSlug}`, { replace: true });
    }
  }, [
    character,
    characterNameCounts,
    name,
    navigate,
    routeMatch.baseSlug,
    routeMatch.incomingSlug,
    sameNameVariants.length,
  ]);

  const selectedTierList = useMemo(() => {
    if (!selectedTierListName) return null;
    return tierLists.find((list) => list.name === selectedTierListName) ?? null;
  }, [tierLists, selectedTierListName]);

  const isPreferredCharacterForNameReferences = useMemo(() => {
    if (!character) return false;
    const preferred = preferredCharacterByName.get(character.name);
    if (!preferred) return false;
    return (
      getCharacterIdentityKey(preferred) === getCharacterIdentityKey(character)
    );
  }, [character, preferredCharacterByName]);

  const selectedTierListEntry = useMemo(() => {
    if (
      !selectedTierList ||
      !character ||
      !isPreferredCharacterForNameReferences
    )
      return null;
    return (
      selectedTierList.entries.find(
        (entry) =>
          entry.character_name.toLowerCase() === character.name.toLowerCase()
      ) ?? null
    );
  }, [selectedTierList, character, isPreferredCharacterForNameReferences]);

  const tierLabel = useMemo(() => {
    if (!selectedTierListName || !selectedTierList || !character) return null;
    return selectedTierListEntry?.tier ?? 'Unranked';
  }, [
    selectedTierListName,
    selectedTierList,
    selectedTierListEntry,
    character,
  ]);

  const tierListCharacterNote = useMemo(() => {
    const note = selectedTierListEntry?.note?.trim();
    return note ? note : null;
  }, [selectedTierListEntry]);

  // Match list page order: sort by quality, then name
  const orderedCharacters = useMemo(
    () => [...characters].sort(compareCharactersByQualityThenName),
    [characters]
  );

  const characterIndex = useMemo(() => {
    if (!character) return -1;
    const identity = getCharacterIdentityKey(character);
    return orderedCharacters.findIndex(
      (entry) => getCharacterIdentityKey(entry) === identity
    );
  }, [orderedCharacters, character]);

  const previousCharacter =
    characterIndex > 0 ? orderedCharacters[characterIndex - 1] : null;
  const nextCharacter =
    characterIndex >= 0 && characterIndex < orderedCharacters.length - 1
      ? orderedCharacters[characterIndex + 1]
      : null;

  const characterAssetKey = useMemo(() => {
    if (!character) return undefined;
    return getCharacterRouteSlug(character, characterNameCounts);
  }, [character, characterNameCounts]);

  const linkedNoblePhantasm = useMemo(() => {
    if (!character?.noble_phantasm) return null;
    return (
      noblePhantasms.find(
        (np) => np.name.toLowerCase() === character.noble_phantasm.toLowerCase()
      ) ?? null
    );
  }, [character, noblePhantasms]);

  const subclassByName = useMemo(() => {
    const map = new Map<string, Subclass>();
    for (const subclass of subclasses) {
      map.set(subclass.name, subclass);
    }
    return map;
  }, [subclasses]);

  const recommendedGearEntries = useMemo(() => {
    if (!character?.recommended_gear) return [];
    const entries: Array<
      RecommendedGearEntry & { label: string; icon: string; slotIcon: string }
    > = [];
    for (const cfg of GEAR_SLOT_CONFIG) {
      const gearName = (character.recommended_gear[cfg.slot] ?? '').trim();
      if (!gearName) continue;
      entries.push({
        slot: cfg.slot,
        type: cfg.type,
        name: gearName,
        label: cfg.label,
        icon: getGearIcon(cfg.type, gearName) ?? cfg.fallbackIcon,
        slotIcon: cfg.fallbackIcon,
      });
    }
    return entries;
  }, [character]);

  const recommendedSubclassEntries = useMemo<RecommendedSubclassEntry[]>(() => {
    return (character?.recommended_subclasses ?? [])
      .map((subclassName) => subclassName.trim())
      .filter((subclassName) => subclassName.length > 0)
      .map((subclassName) => {
        const details = subclassByName.get(subclassName);
        return {
          name: subclassName,
          icon: getSubclassIcon(subclassName),
          tier: details?.tier,
          className: details?.class,
          bonuses: details?.bonuses ?? [],
          effect: details?.effect,
        };
      });
  }, [character, subclassByName]);

  const gearByName = useMemo(() => {
    const map = new Map<string, Gear>();
    for (const item of gear) {
      map.set(item.name.toLowerCase(), item);
    }
    return map;
  }, [gear]);

  const gearSetByName = useMemo(() => {
    const map = new Map<string, GearSet>();
    for (const item of gearSets) {
      map.set(item.name.toLowerCase(), item);
    }
    return map;
  }, [gearSets]);

  const recommendedGearDetails = useMemo<RecommendedGearDetail[]>(() => {
    return recommendedGearEntries.map((entry) => {
      const gearItem = gearByName.get(entry.name.toLowerCase());
      const setName = gearItem?.set?.trim() ?? '';
      const setData = setName ? gearSetByName.get(setName.toLowerCase()) : null;
      const setBonus = setData?.set_bonus ?? gearItem?.set_bonus ?? null;
      return {
        ...entry,
        setName: setName || null,
        setBonus,
        quality: gearItem?.quality,
        lore: gearItem?.lore,
        stats: gearItem?.stats,
      };
    });
  }, [recommendedGearEntries, gearByName, gearSetByName]);

  const activatedSetBonuses = useMemo<ActivatedSetBonus[]>(() => {
    const sets = new Map<
      string,
      {
        setName: string;
        pieces: number;
        requiredPieces: number;
        description: string;
      }
    >();

    for (const entry of recommendedGearDetails) {
      if (!entry.setName) continue;
      const key = entry.setName.toLowerCase();
      const existing = sets.get(key);
      const requiredPieces = entry.setBonus?.quantity ?? 0;
      const description = (entry.setBonus?.description ?? '').trim();

      if (!existing) {
        sets.set(key, {
          setName: entry.setName,
          pieces: 1,
          requiredPieces,
          description,
        });
      } else {
        existing.pieces += 1;
        if (existing.requiredPieces <= 0 && requiredPieces > 0)
          existing.requiredPieces = requiredPieces;
        if (!existing.description && description)
          existing.description = description;
      }
    }

    return [...sets.values()]
      .map((entry) => ({
        ...entry,
        activations:
          entry.requiredPieces > 0
            ? Math.floor(entry.pieces / entry.requiredPieces)
            : 0,
      }))
      .filter((entry) => entry.activations > 0 && entry.description.length > 0)
      .sort((a, b) => {
        if (b.activations !== a.activations)
          return b.activations - a.activations;
        if (b.pieces !== a.pieces) return b.pieces - a.pieces;
        return a.setName.localeCompare(b.setName);
      });
  }, [recommendedGearDetails]);

  return {
    loading,
    character,
    sameNameVariants,
    routeBaseSlug: routeMatch.baseSlug,
    characterNameCounts,
    characterAssetKey,
    isPreferredCharacterForNameReferences,
    tierLabel,
    tierListCharacterNote,
    selectedTierListName,
    linkedNoblePhantasm,
    subclassByName,
    recommendedGearDetails,
    recommendedSubclassEntries,
    activatedSetBonuses,
    teams,
    statusEffects,
    changesData,
    previousCharacter,
    nextCharacter,
    orderedCharacters,
  };
}

/** Returns the route paths for prev/next character navigation. */
export function getCharacterNavPaths(
  previousCharacter: Character | null,
  nextCharacter: Character | null,
  characterNameCounts: Map<string, number>
) {
  return {
    previousItem: previousCharacter
      ? {
          label: previousCharacter.name,
          path: getCharacterRoutePath(previousCharacter, characterNameCounts),
        }
      : null,
    nextItem: nextCharacter
      ? {
          label: nextCharacter.name,
          path: getCharacterRoutePath(nextCharacter, characterNameCounts),
        }
      : null,
  };
}
