import type { ContentType } from '../constants/content-types';
import type { Character } from '../types/character';
import type { FactionName } from '../types/faction';
import type { TeamWyrmspells } from '../types/team';
import type { Wyrmspell } from '../types/wyrmspell';

export type SynergySignal = {
  label: string;
  score: number;
  weight: number;
  detail: string;
};

export type TeamSynergyResult = {
  score: number;
  grade: string;
  signals: SynergySignal[];
  recommendations: string[];
  classCounts: Map<string, number>;
  overdriveCount: number;
};

const SLOT_COUNT = 6;

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function toRatio(current: number, target: number): number {
  if (target <= 0) return 0;
  return clamp01(current / target);
}

function getSynergyGrade(score: number): string {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

function normalizeFactionValue(value: string): string {
  return value.trim().toLowerCase();
}

function getCharacterCombatText(character: Character): string {
  const skillText = character.skills
    .map((skill) => `${skill.name} ${skill.description}`)
    .join(' ')
    .toLowerCase();
  const talentText = (character.talent?.talent_levels || [])
    .map((level) => level.effect)
    .join(' ')
    .toLowerCase();
  return `${skillText} ${talentText}`;
}

function hasCombatKeyword(character: Character, regex: RegExp): boolean {
  return regex.test(getCharacterCombatText(character));
}

const FACTION_MECHANIC_REGEX: Record<FactionName, RegExp> = {
  'Elemental Echo':
    /ignite|shock|chill|detonation|evaporation|elemental reaction/i,
  'Wild Spirit': /wild|rage/i,
  'Arcane Wisdom': /awakening/i,
  'Sanctum Glory': /grace|morale|fervor/i,
  'Otherworld Return': /deathrattle|summon|whelp|revive/i,
  'Illusion Veil': /punishment|energy consumption|overdrive energy/i,
};

export function computeTeamSynergy({
  roster,
  faction,
  contentType,
  overdriveCount,
  teamWyrmspells,
  wyrmspells,
}: {
  roster: Character[];
  faction: FactionName | null;
  contentType: ContentType;
  overdriveCount: number;
  teamWyrmspells: TeamWyrmspells;
  wyrmspells: Wyrmspell[];
}): TeamSynergyResult {
  const rosterSize = roster.length;
  const classCounts = new Map<string, number>();
  for (const c of roster) {
    classCounts.set(
      c.character_class,
      (classCounts.get(c.character_class) || 0) + 1
    );
  }

  const normalizedSelectedFaction = faction
    ? normalizeFactionValue(faction)
    : null;

  const matchingFactionCount = normalizedSelectedFaction
    ? roster.filter((c) =>
        c.factions.some(
          (memberFaction) =>
            normalizeFactionValue(memberFaction) === normalizedSelectedFaction
        )
      ).length
    : 0;

  const frontlineCount = roster.filter(
    (c) => c.character_class === 'Guardian' || c.character_class === 'Warrior'
  ).length;
  const sustainCount = roster.filter(
    (c) => c.character_class === 'Priest'
  ).length;
  const damageCount = roster.filter(
    (c) =>
      c.character_class === 'Assassin' ||
      c.character_class === 'Archer' ||
      c.character_class === 'Mage' ||
      c.character_class === 'Warrior'
  ).length;

  const controlRegex =
    /stun|silence|sleep|freeze|taunt|bind|control|interrupt|knock/i;
  const debuffRegex =
    /debuff|reduce|weaken|vulnerab|armor break|breach|resistance down|def down|atk down/i;
  const supportRegex =
    /heal|shield|barrier|buff|cleanse|regen|recovery|restore/i;
  const aoeRegex =
    /all enemies|large circular area|small circular area|area|aoe|within a .*area|multiple enemies|ricochet|bounce/i;
  const singleTargetRegex =
    /single target|enemy with the highest|enemy with the lowest|current target|nearest enemy/i;
  const burstRegex = /overdrive damage|critical damage|burst|execute|finisher/i;

  const hasControl = roster.some((c) => hasCombatKeyword(c, controlRegex));
  const hasDebuff = roster.some((c) => hasCombatKeyword(c, debuffRegex));
  const hasSupport = roster.some((c) => hasCombatKeyword(c, supportRegex));
  const hasAoe = roster.some((c) => hasCombatKeyword(c, aoeRegex));
  const hasSingleTarget = roster.some((c) =>
    hasCombatKeyword(c, singleTargetRegex)
  );
  const hasBurst = roster.some((c) => hasCombatKeyword(c, burstRegex));

  const factionMechanicRegex = faction ? FACTION_MECHANIC_REGEX[faction] : null;
  const factionMechanicMatches = factionMechanicRegex
    ? roster.filter((c) => hasCombatKeyword(c, factionMechanicRegex)).length
    : 0;

  const selectedWyrmspells = [
    teamWyrmspells.breach,
    teamWyrmspells.refuge,
    teamWyrmspells.wildcry,
    teamWyrmspells.dragons_call,
  ].filter((name): name is string => Boolean(name));

  const selectedWyrmspellCount = selectedWyrmspells.length;

  const dragonsCallSpell = teamWyrmspells.dragons_call
    ? wyrmspells.find((spell) => spell.name === teamWyrmspells.dragons_call)
    : null;

  const dragonsCallFactionMatch =
    Boolean(dragonsCallSpell && faction) &&
    dragonsCallSpell?.exclusive_faction === faction;

  const isPvP = contentType === 'PvP';
  const isPvE = contentType === 'PvE';
  const isBoss = contentType === 'Boss';

  const rosterSignal: SynergySignal = {
    label: 'Roster size',
    weight: 15,
    score: 15 * toRatio(rosterSize, SLOT_COUNT),
    detail: `${rosterSize}/${SLOT_COUNT} members slotted`,
  };

  const factionSignal: SynergySignal = {
    label: 'Faction cohesion',
    weight: 15,
    score:
      rosterSize > 0 && faction
        ? 15 * toRatio(matchingFactionCount, rosterSize)
        : rosterSize > 0
          ? 6
          : 0,
    detail: faction
      ? `${matchingFactionCount}/${rosterSize || 0} members match ${faction}`
      : 'Set a faction for tighter guidance',
  };

  const classSignal: SynergySignal = {
    label: 'Class coverage',
    weight: 10,
    score: 10 * toRatio(classCounts.size, 4),
    detail: `${classCounts.size} unique classes represented`,
  };

  const frontlineSignal: SynergySignal = {
    label: 'Frontline & sustain',
    weight: 12,
    score: (() => {
      if (frontlineCount > 0 && sustainCount > 0) return 12;
      if (frontlineCount > 0 || sustainCount > 0) return 6;
      return 0;
    })(),
    detail: `Frontline ${frontlineCount} • Sustain ${sustainCount}`,
  };

  const damageSignal: SynergySignal = {
    label: 'Damage pressure',
    weight: 12,
    score: 12 * toRatio(damageCount, 3),
    detail: `${damageCount} burst/DPS-oriented members`,
  };

  const utilitySignal: SynergySignal = {
    label: 'Buff/debuff/control mix',
    weight: 10,
    score:
      ((hasSupport ? 1 : 0) + (hasDebuff ? 1 : 0) + (hasControl ? 1 : 0)) *
      (10 / 3),
    detail: `${hasSupport ? 'Support' : 'No support'} • ${hasDebuff ? 'Debuff' : 'No debuff'} • ${hasControl ? 'Control' : 'No control'}`,
  };

  const factionMechanicSignal: SynergySignal = {
    label: 'Faction mechanic alignment',
    weight: 12,
    score:
      rosterSize > 0 && faction
        ? 12 * toRatio(factionMechanicMatches, Math.min(4, rosterSize))
        : rosterSize > 0
          ? 5
          : 0,
    detail: faction
      ? `${factionMechanicMatches}/${rosterSize || 0} members support ${faction} mechanics`
      : 'Select a faction to evaluate mechanic alignment',
  };

  const wyrmspellFitBase = (() => {
    if (selectedWyrmspellCount === 0) return 0;
    const slotScore = selectedWyrmspellCount >= 4 ? 3 : selectedWyrmspellCount;
    const dragonsCallScore = teamWyrmspells.dragons_call
      ? dragonsCallFactionMatch
        ? 2
        : 0
      : 1;
    return slotScore + dragonsCallScore;
  })();

  const wyrmspellSignal: SynergySignal = {
    label: 'Wyrmspell fit',
    weight: 8,
    score: 8 * toRatio(wyrmspellFitBase, 5),
    detail: teamWyrmspells.dragons_call
      ? dragonsCallFactionMatch
        ? `Dragon's Call matches ${faction}`
        : `Dragon's Call does not match ${faction || 'selected faction'}`
      : selectedWyrmspellCount > 0
        ? `${selectedWyrmspellCount}/4 Wyrmspells selected`
        : 'Select Wyrmspells for more team throughput',
  };

  const contentFitBase = (() => {
    if (rosterSize === 0) return 0;
    if (isPvP) {
      return (
        (hasControl ? 2 : 0) +
        (hasBurst ? 1 : 0) +
        (damageCount >= 2 ? 1 : 0) +
        (frontlineCount >= 1 ? 1 : 0)
      );
    }
    if (isPvE) {
      return (
        (sustainCount >= 1 ? 2 : 0) +
        (damageCount >= 2 ? 1 : 0) +
        (frontlineCount >= 1 ? 1 : 0) +
        (hasAoe ? 1 : 0)
      );
    }
    if (isBoss) {
      return (
        (sustainCount >= 1 ? 1 : 0) +
        (hasDebuff ? 1 : 0) +
        (hasSingleTarget ? 2 : 0) +
        (frontlineCount >= 1 ? 1 : 0)
      );
    }
    return 3;
  })();

  const contentSignal: SynergySignal = {
    label: 'Content type fit',
    weight: 6,
    score: 6 * toRatio(contentFitBase, 5),
    detail: contentType
      ? `Evaluated for ${contentType}`
      : 'Set content type for stronger recommendations',
  };

  const signals: SynergySignal[] = [
    rosterSignal,
    factionSignal,
    classSignal,
    frontlineSignal,
    damageSignal,
    utilitySignal,
    factionMechanicSignal,
    wyrmspellSignal,
    contentSignal,
  ];

  const totalScore = Math.round(
    signals.reduce((sum, signal) => sum + signal.score, 0)
  );

  const recommendations: string[] = [];
  if (rosterSize < SLOT_COUNT) {
    recommendations.push('Fill all 6 slots to maximize consistency.');
  }
  if (!faction) {
    recommendations.push(
      'Pick a faction to evaluate faction synergy and buffs.'
    );
  } else if (
    rosterSize > 0 &&
    matchingFactionCount < Math.ceil(rosterSize / 2)
  ) {
    recommendations.push(
      'Consider more members from your selected faction for stronger cohesion.'
    );
  }
  if (sustainCount === 0) {
    recommendations.push('Add a Priest or a stronger sustain option.');
  }
  if (frontlineCount === 0) {
    recommendations.push(
      'Add a frontline (Guardian/Warrior) to stabilize damage intake.'
    );
  }
  if (!hasDebuff) {
    recommendations.push(
      'Add at least one debuff source to improve team damage efficiency.'
    );
  }
  if (faction && factionMechanicMatches === 0) {
    recommendations.push(
      `Current roster has weak ${faction} mechanic coverage. Add heroes that trigger its core status loop.`
    );
  }
  if (teamWyrmspells.dragons_call && faction && !dragonsCallFactionMatch) {
    recommendations.push(
      `Use a Dragon's Call that matches ${faction} for stronger faction scaling.`
    );
  }
  if (!hasControl && isPvP) {
    recommendations.push(
      'For PvP, include crowd control to improve tempo and pick potential.'
    );
  }
  if (isPvE && !hasAoe) {
    recommendations.push('For PvE wave clear, include at least one AoE carry.');
  }
  if (isBoss && !hasSingleTarget) {
    recommendations.push(
      'For Boss content, include stronger single-target damage sources.'
    );
  }

  return {
    score: totalScore,
    grade: getSynergyGrade(totalScore),
    signals,
    recommendations,
    classCounts,
    overdriveCount,
  };
}
