export interface FieldDiff {
  old?: unknown;
  new?: unknown;
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
