import { useCallback, useMemo } from 'react';
import { FACTION_COLOR } from '@/constants/colors';
import { normalizeContentType } from '@/constants/content-types';
import type { Artifact } from '@/features/wiki/artifacts/types';
import type { Character } from '@/features/characters/types';
import type { Faction } from '@/types/faction';
import type { Team } from '@/features/teams/types';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import {
  getCharacterRoutePath,
  getCharacterRoutePathByName,
  resolveCharacterByNameAndQuality,
} from '@/features/characters/utils/character-route';
import { computeTeamSynergy } from '@/features/teams/utils/team-synergy';

interface UseTeamDetailDataParams {
  team: Team | null;
  factions: Faction[];
  artifacts: Artifact[];
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  characterNameCounts: Map<string, number>;
  wyrmspells: Wyrmspell[];
  fallbackFactionColor: string;
}

export function useTeamDetailData({
  team,
  factions,
  artifacts,
  charMap,
  characterByIdentity,
  characterNameCounts,
  wyrmspells,
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
      return getCharacterRoutePath(character, characterNameCounts);
    },
    [charMap, characterByIdentity, characterNameCounts]
  );

  const factionInfo = useMemo(() => {
    if (!team) return null;
    return factions.find((f) => f.name === team.faction) ?? null;
  }, [factions, team]);

  const artifactMap = useMemo(() => {
    const map = new Map<string, Artifact>();
    for (const artifact of artifacts) map.set(artifact.name, artifact);
    return map;
  }, [artifacts]);

  const factionColor = team
    ? FACTION_COLOR[team.faction]
    : fallbackFactionColor;

  const teamSynergy = useMemo(() => {
    if (!team) {
      return computeTeamSynergy({
        roster: [],
        faction: null,
        contentType: 'All',
        overdriveCount: 0,
        teamWyrmspells: {},
        wyrmspells,
      });
    }

    const roster = team.members
      .map((member) =>
        resolveCharacterByNameAndQuality(
          member.character_name,
          member.character_quality,
          charMap,
          characterByIdentity
        )
      )
      .filter((character): character is Character => Boolean(character));

    return computeTeamSynergy({
      roster,
      faction: team.faction,
      contentType: normalizeContentType(team.content_type, 'All'),
      overdriveCount: team.members.filter(
        (member) => member.overdrive_order != null
      ).length,
      teamWyrmspells: team.wyrmspells || {},
      wyrmspells,
    });
  }, [team, charMap, characterByIdentity, wyrmspells]);

  return {
    getCharacterPath,
    factionInfo,
    artifactMap,
    factionColor,
    teamSynergy,
  };
}
