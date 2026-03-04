export interface FieldDiff {
  // Scalar change
  old?: string | number | boolean;
  new?: string | number | boolean;
  // Array change (entries, members, bench, etc.)
  added?: string[];
  removed?: string[];
  modified?: string[]; // items with same identity but changed content
  changed?: Record<string, { old: string | number | boolean; new: string | number | boolean }>;
}

export interface ChangeRecord {
  timestamp: number;
  type?: 'removed' | 'readded';
  fields?: Record<string, FieldDiff>;
}

export interface EntityChangeHistory {
  added: number;
  changes: ChangeRecord[];
}

export type ChangesFile = Record<string, EntityChangeHistory>;
