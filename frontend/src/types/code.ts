export interface Code {
  code: string;
  rewards?: Record<string, number>;
  active: boolean;
  last_updated: number;
}
