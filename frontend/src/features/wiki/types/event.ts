export interface GameEvent {
  name: string;
  active: boolean;
  event_id?: string;
  tag?: string;
  description?: string;
  start_date?: string;
  end_date: string | null;
  last_updated?: number;
}
