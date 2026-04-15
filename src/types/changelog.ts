export interface ChangelogChange {
  type: 'added' | 'updated' | 'fixed' | 'removed';
  category: string;
  description: string;
}

export interface ChangelogEntry {
  date: string;
  version?: string;
  changes: ChangelogChange[];
  last_updated?: number;
}
