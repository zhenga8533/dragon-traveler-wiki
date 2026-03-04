export interface FieldDiff {
  // Scalar change
  old?: unknown;
  new?: unknown;
  // Array change (entries, members, bench, etc.)
  added?: string[];
  removed?: string[];
  modified?: string[] | Record<string, unknown>; // items with same identity but changed content
  changed?: Record<string, { old: unknown; new: unknown }>;
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
