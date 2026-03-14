export interface GameEvent {
  name: string;
  event_id: string | null;
  type: string;
  description: string;
  characters: string[];
  is_global: boolean;
  start_date?: string;
  end_date: string | null;
  last_updated?: number;
}
