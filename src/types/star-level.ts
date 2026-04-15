export type StarTier = 'base' | 'purple' | 'red' | 'legendary' | 'divine';

export interface StarLevelEntry {
  stars: number;
  copies: number;
  fodder: number;
  divine_crystals: number;
}

export interface StarTierData {
  name: string;
  levels: StarLevelEntry[];
}

export interface StarLevel {
  label: string;
  stars: number;
  value: string;
  copies: number;
  fodder: number;
  divineCrystals: number;
  tier: StarTier;
}

const TIER_NAME_MAP: Record<string, StarTier> = {
  Base: 'base',
  Purple: 'purple',
  Red: 'red',
  Diamond: 'legendary',
  Divinity: 'divine',
};

function getLevelLabel(tierName: string, stars: number): string {
  if (tierName === 'Base') return stars === 5 ? '5 Star' : '6 Star';
  if (tierName === 'Diamond') return 'Legendary';
  if (tierName === 'Divinity') return `Divine ${stars}`;
  return `${tierName} ${stars}`;
}

function getLevelValue(tierName: string, stars: number): string {
  if (tierName === 'Base') return String(stars);
  if (tierName === 'Diamond') return 'legendary';
  if (tierName === 'Purple') return `p${stars}`;
  if (tierName === 'Red') return `r${stars}`;
  if (tierName === 'Divinity') return `d${stars}`;
  return `${tierName.toLowerCase()}${stars}`;
}

/**
 * Transforms incremental star-levels.json data into a flat array with
 * cumulative resource totals (copies, fodder, divine crystals) from 5 Star base.
 */
export function buildStarLevels(data: StarTierData[]): StarLevel[] {
  let cumCopies = 0;
  let cumFodder = 0;
  let cumDivineCrystals = 0;
  const result: StarLevel[] = [];

  for (const tier of data) {
    const starTier = TIER_NAME_MAP[tier.name] ?? 'base';
    for (const level of tier.levels) {
      cumCopies += level.copies;
      cumFodder += level.fodder;
      cumDivineCrystals += level.divine_crystals;
      result.push({
        label: getLevelLabel(tier.name, level.stars),
        stars: level.stars,
        value: getLevelValue(tier.name, level.stars),
        copies: cumCopies,
        fodder: cumFodder,
        divineCrystals: cumDivineCrystals,
        tier: starTier,
      });
    }
  }

  return result;
}
