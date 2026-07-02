import { useCallback, useMemo } from 'react';
import { FACTION_COLOR } from '@/constants/faction-colors';
import type { Artifact } from '@/features/wiki/artifacts/types';
import type { Character } from '@/features/characters/types';
import type { Faction } from '@/types/faction';
import type { Team } from '@/features/teams/types';
import {
  getCharacterRoutePath,
  getCharacterRoutePathByName,
  resolveCharacterByNameAndQuality,
} from '@/features/characters/utils/character-route';

interface UseTeamDetailDataParams {
  team: Team | null;
  factions: Faction[];
  artifacts: Artifact[];
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  fallbackFactionColor: string;
}

export function useTeamDetailData({
  team,
  factions,
  artifacts,
  charMap,
  characterByIdentity,
  fallbackFactionColor,
}: UseTeamDetailDataParams) {
  const getCharacterPath = useCallback(
    (characterName: string, characterQuality?: string | null) => {
      const character = resolveCharacterByNameAndQuality(
        characterName,
        characterQuality,
        charMap,
        characterByIdentity
      );
      if (!character) return getCharacterRoutePathByName(characterName);
      return getCharacterRoutePath(character);
    },
    [charMap, characterByIdentity]
  );

  const factionInfo = useMemo(() => {
    if (!team) return null;
    return factions.find((f) => f.slug === team.faction) ?? null;
  }, [factions, team]);

  const artifactMap = useMemo(() => {
    const map = new Map<string, Artifact>();
    for (const artifact of artifacts) map.set(artifact.slug, artifact);
    return map;
  }, [artifacts]);

  const factionColor = team
    ? FACTION_COLOR[team.faction]
    : fallbackFactionColor;

  return {
    getCharacterPath,
    factionInfo,
    artifactMap,
    factionColor,
  };
}
