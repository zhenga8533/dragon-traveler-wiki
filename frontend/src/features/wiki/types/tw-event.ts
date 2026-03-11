export interface TwEvent {
  name: string;
  type: string; // "Release" | "Skin" | "Mythic Ascension" | "Rerun"
  characters: string[];
  start_date: string;
  end_date: string;
  last_updated?: number;
}
