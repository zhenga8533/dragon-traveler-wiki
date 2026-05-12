import type { CharacterClass } from '@/features/characters/types';
import type { GearType } from '@/features/wiki/gear/types';
import type { FactionName } from '@/types/faction';
import type { Quality } from '@/types/quality';
import { normalizeKey, normalizeQualityKey } from '@/assets/utils';

const BASE = import.meta.env.BASE_URL;

// ── Class ────────────────────────────────────────────────────────────────────

export const CLASS_ICON_MAP: Record<CharacterClass, string> = {
  Guardian: `${BASE}assets/class/guardian.png`,
  Priest: `${BASE}assets/class/priest.png`,
  Assassin: `${BASE}assets/class/assassin.png`,
  Warrior: `${BASE}assets/class/warrior.png`,
  Archer: `${BASE}assets/class/archer.png`,
  Mage: `${BASE}assets/class/mage.png`,
};

// ── Faction ──────────────────────────────────────────────────────────────────

export const FACTION_ICON_MAP: Record<FactionName, string> = {
  'Elemental Echo': `${BASE}assets/faction/elemental_echo.png`,
  'Wild Spirit': `${BASE}assets/faction/wild_spirit.png`,
  'Arcane Wisdom': `${BASE}assets/faction/arcane_wisdom.png`,
  'Sanctum Glory': `${BASE}assets/faction/sanctum_glory.png`,
  'Otherworld Return': `${BASE}assets/faction/otherworld_return.png`,
  'Illusion Veil': `${BASE}assets/faction/illusion_veil.png`,
};

// ── Quality ──────────────────────────────────────────────────────────────────

export const QUALITY_ICON_MAP: Record<Quality, string> = {
  UR: `${BASE}assets/quality/ur.png`,
  'SSR EX': `${BASE}assets/quality/ssr_ex.png`,
  'SSR+': `${BASE}assets/quality/ssr_plus.png`,
  SSR: `${BASE}assets/quality/ssr.png`,
  SR: `${BASE}assets/quality/sr.png`,
  R: `${BASE}assets/quality/r.png`,
  N: `${BASE}assets/quality/n.png`,
  C: `${BASE}assets/quality/c.png`,
};

// ── Wyrms ────────────────────────────────────────────────────────────────────

export function getWyrmIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}assets/wyrm/${normalizeKey(name)}/avatar.png`;
}

export function getWyrmPortrait(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}assets/wyrm/${normalizeKey(name)}/portrait.png`;
}

export function getWyrmIllustration(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}assets/wyrm/${normalizeKey(name)}/illustration.png`;
}

export function getWyrmSkillIcon(wyrmName: string, skillName: string): string | undefined {
  if (!wyrmName || !skillName) return undefined;
  return `${BASE}assets/wyrm/${normalizeKey(wyrmName)}/skills/${normalizeKey(skillName)}.png`;
}

export const FACTION_WYRM_MAP: Record<FactionName, string> = {
  'Elemental Echo': `${BASE}assets/wyrm/blazing_dragon/portrait.png`,
  'Wild Spirit': `${BASE}assets/wyrm/jade_dragon/portrait.png`,
  'Arcane Wisdom': `${BASE}assets/wyrm/nymph_dragon/portrait.png`,
  'Sanctum Glory': `${BASE}assets/wyrm/heavenglow_dragon/portrait.png`,
  'Otherworld Return': `${BASE}assets/wyrm/nethercrypt_dragon/portrait.png`,
  'Illusion Veil': `${BASE}assets/wyrm/shadowbane_dragon/portrait.png`,
};

// ── Artifacts ────────────────────────────────────────────────────────────────

export function getArtifactIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}assets/artifacts/${normalizeKey(name)}/artifact.png`;
}

export function getTreasureIcon(artifactName: string, treasureName: string): string | undefined {
  if (!artifactName || !treasureName) return undefined;
  return `${BASE}assets/artifacts/${normalizeKey(artifactName)}/treasures/${normalizeKey(treasureName)}.png`;
}

// ── Gear ─────────────────────────────────────────────────────────────────────

export const GEAR_TYPE_ICON_MAP: Record<GearType, string> = {
  Headgear: `${BASE}assets/gear/icons/headgear.png`,
  Chestplate: `${BASE}assets/gear/icons/chestplate.png`,
  Bracers: `${BASE}assets/gear/icons/bracers.png`,
  Boots: `${BASE}assets/gear/icons/boots.png`,
  Weapon: `${BASE}assets/gear/icons/weapon.png`,
  Accessory: `${BASE}assets/gear/icons/accessory.png`,
};

export function getGearIcon(type: string, name: string): string | undefined {
  if (!type || !name) return undefined;
  return `${BASE}assets/gear/${normalizeKey(type)}/${normalizeKey(name)}.png`;
}

// ── Howlkin ──────────────────────────────────────────────────────────────────

export function getHowlkinIcon(name: string, quality: string): string | undefined {
  if (!name || !quality) return undefined;
  return `${BASE}assets/howlkin/${normalizeQualityKey(quality)}/${normalizeKey(name)}.png`;
}

// ── Noble Phantasm ───────────────────────────────────────────────────────────

export function getNoblePhantasmIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}assets/noble_phantasm/${normalizeKey(name)}.png`;
}

// ── Relic ────────────────────────────────────────────────────────────────────

function normalizeRelicQualityKey(quality: string): string {
  const normalized = normalizeQualityKey(quality);
  return normalized === 'ssr_plus' ? 'ssr' : normalized;
}

export function getRelicIcon(name: string, quality: string): string | undefined {
  if (!name || !quality) return undefined;
  return `${BASE}assets/relic/${normalizeRelicQualityKey(quality)}/${normalizeKey(name)}.png`;
}

export function getOracleScrollImage(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}assets/relic/oracle_scroll/${normalizeKey(name)}.png`;
}

// ── Resource ─────────────────────────────────────────────────────────────────

export function getResourceIcon(name: string, category: string): string | undefined {
  if (!name || !category) return undefined;
  return `${BASE}assets/resource/${category.toLowerCase()}/${normalizeKey(name)}.png`;
}

// ── Skill ────────────────────────────────────────────────────────────────────

export function getSkillIcon(skillName: string): string | undefined {
  if (!skillName) return undefined;
  return `${BASE}assets/skill/${normalizeKey(skillName)}.png`;
}

// ── Status Effect ────────────────────────────────────────────────────────────

export function getStatusEffectIcon(name: string, type: string): string | undefined {
  if (!name || !type) return undefined;
  return `${BASE}assets/status_effect/${normalizeKey(type)}/${normalizeKey(name)}.png`;
}

// ── Subclass ─────────────────────────────────────────────────────────────────

export function getSubclassIcon(subclassName: string, characterClass?: string): string | undefined {
  if (!subclassName) return undefined;
  const subclassKey = normalizeKey(subclassName);
  if (characterClass) {
    return `${BASE}assets/subclass/${normalizeKey(characterClass)}/${subclassKey}.png`;
  }
  return `${BASE}assets/subclass/${subclassKey}.png`;
}

// ── Wyrmspell ────────────────────────────────────────────────────────────────

export function getWyrmspellIcon(name: string, type?: string): string | undefined {
  if (!name) return undefined;
  const nameKey = normalizeKey(name);
  if (type) {
    return `${BASE}assets/wyrmspell/${normalizeKey(type)}/${nameKey}.png`;
  }
  return `${BASE}assets/wyrmspell/${nameKey}.png`;
}

// ── Event ────────────────────────────────────────────────────────────────────


export const placeholderEventImage = `${BASE}assets/event/placeholder.webp`;

export function getEventImage(eventName: string): string {
  return `${BASE}assets/event/${normalizeKey(eventName)}.webp`;
}

// ── Character ────────────────────────────────────────────────────────────────

export interface CharacterIllustration {
  name: string;
  src: string;
  type: 'image' | 'video';
}

interface ManifestEntry {
  name: string;
  file: string;
  type: 'image' | 'video';
}

type CharacterManifest = Record<string, ManifestEntry[]>;

let manifestPromise: Promise<CharacterManifest> | null = null;

function getManifest(): Promise<CharacterManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(`${BASE}assets/character/manifest.json`).then((r) => r.json());
  }
  return manifestPromise;
}

function resolveAssetKey(characterName: string, characterKey?: string): string {
  const explicitKey = (characterKey ?? '').trim();
  return normalizeKey(explicitKey || characterName);
}

export function getPortrait(
  characterName: string,
  characterKey?: string
): string | undefined {
  if (!characterName) return undefined;
  const key = resolveAssetKey(characterName, characterKey);
  return `${BASE}assets/character/${key}/portrait.png`;
}

export async function getIllustrations(
  characterName: string,
  characterKey?: string
): Promise<CharacterIllustration[]> {
  const key = resolveAssetKey(characterName, characterKey);
  const manifest = await getManifest();
  const entries = manifest[key];
  if (!entries || entries.length === 0) return [];
  return entries.map((e) => ({
    name: e.name,
    src: `${BASE}assets/character/${key}/illustrations/${e.file}`,
    type: e.type,
  }));
}

export async function getIllustration(
  characterName: string,
  characterKey?: string
): Promise<string | undefined> {
  const list = await getIllustrations(characterName, characterKey);
  return list.length > 0 ? list[0].src : undefined;
}

export async function getTalentIcon(
  characterName: string,
  characterKey?: string
): Promise<string | undefined> {
  if (!characterName) return undefined;
  const key = resolveAssetKey(characterName, characterKey);
  return `${BASE}assets/character/${key}/talent.png`;
}

export async function getCharacterSkillIcon(
  characterName: string,
  skillName: string,
  characterKey?: string
): Promise<string | undefined> {
  if (!characterName || !skillName) return undefined;
  const key = resolveAssetKey(characterName, characterKey);
  return `${BASE}assets/character/${key}/skills/${normalizeKey(skillName)}.png`;
}
