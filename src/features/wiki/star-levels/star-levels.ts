import type { StarLevel, StarTier, StarTierData } from './types';

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

export function buildStarLevels(data: StarTierData[]): StarLevel[] {
  let cumulativeCopies = 0;
  let cumulativeFodder = 0;
  let cumulativeDivineCrystals = 0;
  const result: StarLevel[] = [];

  for (const tier of data) {
    const starTier = TIER_NAME_MAP[tier.name] ?? 'base';
    for (const level of tier.levels) {
      cumulativeCopies += level.copies;
      cumulativeFodder += level.fodder;
      cumulativeDivineCrystals += level.divine_crystals;
      result.push({
        label: getLevelLabel(tier.name, level.stars),
        stars: level.stars,
        value: getLevelValue(tier.name, level.stars),
        copies: cumulativeCopies,
        fodder: cumulativeFodder,
        divineCrystals: cumulativeDivineCrystals,
        tier: starTier,
      });
    }
  }

  return result;
}
