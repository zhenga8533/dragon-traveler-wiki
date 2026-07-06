export interface GuessComparison {
  classStatus: 'exact' | 'none';
  qualityStatus: 'exact' | 'higher' | 'lower';
  factionStatus: 'exact' | 'partial' | 'none';
  originStatus: 'exact' | 'none';
  heightStatus: 'exact' | 'higher' | 'lower';
  weightStatus: 'exact' | 'higher' | 'lower';
}

export interface DtdleGameState {
  date: string;
  guessedSlugs: string[];
  solved: boolean;
}

export interface DtdleStats {
  currentStreak: number;
  maxStreak: number;
  gamesPlayed: number;
  lastPlayedDate: string | null;
}
