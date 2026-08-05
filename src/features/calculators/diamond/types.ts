export type DiamondSourceType = 'gain' | 'spend';

export interface DiamondSourceRow {
  id: string;
  label: string;
  amount: number | null;
  cadenceDays: number | null;
  isCustom: boolean;
  enabled: boolean;
}

export interface DiamondCalculatorState {
  bank: number | null;
  targetDate: string;
  gainSources: DiamondSourceRow[];
  spendSources: DiamondSourceRow[];
  pointsLeagueRank: string;
  arenaDaily: string;
  colosseumBiweekly: string;
  wildHuntBiweekly: string;
  includeSupremeCard: boolean;
}
