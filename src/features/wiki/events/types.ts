export interface GameEvent {
  slug: string;
  name: string;
  event_id: string | null;
  type: string;
  description: string;
  /** Character slugs (e.g. "tamamo_ssr_plus") — canonical keys in characters.json. */
  characters: string[];
  is_global: boolean;
  start_date?: string;
  end_date: string | null;
  last_updated?: number;
}
