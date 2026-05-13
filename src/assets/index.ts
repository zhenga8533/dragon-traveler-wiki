import type { CharacterClass } from '@/features/characters/types';
import type { GearType } from '@/features/wiki/gear/types';
import type { FactionName } from '@/types/faction';
import type { Quality } from '@/types/quality';
import { normalizeKey, normalizeQualityKey } from '@/assets/utils';

const rawBase: string = import.meta.env.VITE_ASSETS_BASE ?? import.meta.env.BASE_URL;
const BASE = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

// ── Class ────────────────────────────────────────────────────────────────────

export const CLASS_ICON_MAP: Record<CharacterClass, string> = {
  Guardian: `${BASE}class/guardian.png`,
  Priest: `${BASE}class/priest.png`,
  Assassin: `${BASE}class/assassin.png`,
  Warrior: `${BASE}class/warrior.png`,
  Archer: `${BASE}class/archer.png`,
  Mage: `${BASE}class/mage.png`,
};

// ── Faction ──────────────────────────────────────────────────────────────────

export const FACTION_ICON_MAP: Record<FactionName, string> = {
  'Elemental Echo': `${BASE}faction/elemental_echo.png`,
  'Wild Spirit': `${BASE}faction/wild_spirit.png`,
  'Arcane Wisdom': `${BASE}faction/arcane_wisdom.png`,
  'Sanctum Glory': `${BASE}faction/sanctum_glory.png`,
  'Otherworld Return': `${BASE}faction/otherworld_return.png`,
  'Illusion Veil': `${BASE}faction/illusion_veil.png`,
};

// ── Quality ──────────────────────────────────────────────────────────────────

export const QUALITY_ICON_MAP: Record<Quality, string> = {
  UR: `${BASE}quality/ur.png`,
  'SSR EX': `${BASE}quality/ssr_ex.png`,
  'SSR+': `${BASE}quality/ssr_plus.png`,
  SSR: `${BASE}quality/ssr.png`,
  SR: `${BASE}quality/sr.png`,
  R: `${BASE}quality/r.png`,
  N: `${BASE}quality/n.png`,
  C: `${BASE}quality/c.png`,
};

// ── Wyrms ────────────────────────────────────────────────────────────────────

export function getWyrmIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}wyrm/${normalizeKey(name)}/avatar.png`;
}

export function getWyrmPortrait(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}wyrm/${normalizeKey(name)}/portrait.png`;
}

export function getWyrmIllustration(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}wyrm/${normalizeKey(name)}/illustration.png`;
}

export function getWyrmSkillIcon(wyrmName: string, skillName: string): string | undefined {
  if (!wyrmName || !skillName) return undefined;
  return `${BASE}wyrm/${normalizeKey(wyrmName)}/skills/${normalizeKey(skillName)}.png`;
}

export const FACTION_WYRM_MAP: Record<FactionName, string> = {
  'Elemental Echo': `${BASE}wyrm/blazing_dragon/portrait.png`,
  'Wild Spirit': `${BASE}wyrm/jade_dragon/portrait.png`,
  'Arcane Wisdom': `${BASE}wyrm/nymph_dragon/portrait.png`,
  'Sanctum Glory': `${BASE}wyrm/heavenglow_dragon/portrait.png`,
  'Otherworld Return': `${BASE}wyrm/nethercrypt_dragon/portrait.png`,
  'Illusion Veil': `${BASE}wyrm/shadowbane_dragon/portrait.png`,
};

// ── Artifacts ────────────────────────────────────────────────────────────────

export function getArtifactIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}artifacts/${normalizeKey(name)}/artifact.png`;
}

export function getTreasureIcon(artifactName: string, treasureName: string): string | undefined {
  if (!artifactName || !treasureName) return undefined;
  return `${BASE}artifacts/${normalizeKey(artifactName)}/treasures/${normalizeKey(treasureName)}.png`;
}

// ── Gear ─────────────────────────────────────────────────────────────────────

export const GEAR_TYPE_ICON_MAP: Record<GearType, string> = {
  Headgear: `${BASE}gear/icons/headgear.png`,
  Chestplate: `${BASE}gear/icons/chestplate.png`,
  Bracers: `${BASE}gear/icons/bracers.png`,
  Boots: `${BASE}gear/icons/boots.png`,
  Weapon: `${BASE}gear/icons/weapon.png`,
  Accessory: `${BASE}gear/icons/accessory.png`,
};

export function getGearIcon(type: string, name: string): string | undefined {
  if (!type || !name) return undefined;
  return `${BASE}gear/${normalizeKey(type)}/${normalizeKey(name)}.png`;
}

// ── Howlkin ──────────────────────────────────────────────────────────────────

export function getHowlkinIcon(name: string, quality: string): string | undefined {
  if (!name || !quality) return undefined;
  return `${BASE}howlkin/${normalizeQualityKey(quality)}/${normalizeKey(name)}.png`;
}

// ── Noble Phantasm ───────────────────────────────────────────────────────────

export function getNoblePhantasmIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}noble_phantasm/${normalizeKey(name)}.png`;
}

// ── Relic ────────────────────────────────────────────────────────────────────

function normalizeRelicQualityKey(quality: string): string {
  const normalized = normalizeQualityKey(quality);
  return normalized === 'ssr_plus' ? 'ssr' : normalized;
}

export function getRelicIcon(name: string, quality: string): string | undefined {
  if (!name || !quality) return undefined;
  return `${BASE}relic/${normalizeRelicQualityKey(quality)}/${normalizeKey(name)}.png`;
}

export function getOracleScrollImage(name: string): string | undefined {
  if (!name) return undefined;
  return `${BASE}relic/oracle_scroll/${normalizeKey(name)}.png`;
}

// ── Resource ─────────────────────────────────────────────────────────────────

export function getResourceIcon(name: string, category: string): string | undefined {
  if (!name || !category) return undefined;
  return `${BASE}resource/${category.toLowerCase()}/${normalizeKey(name)}.png`;
}

// ── Skill ────────────────────────────────────────────────────────────────────

export function getSkillIcon(skillName: string): string | undefined {
  if (!skillName) return undefined;
  return `${BASE}skill/${normalizeKey(skillName)}.png`;
}

// ── Status Effect ────────────────────────────────────────────────────────────

export function getStatusEffectIcon(name: string, type: string): string | undefined {
  if (!name || !type) return undefined;
  return `${BASE}status_effect/${normalizeKey(type)}/${normalizeKey(name)}.png`;
}

// ── Subclass ─────────────────────────────────────────────────────────────────

export function getSubclassIcon(subclassName: string, characterClass?: string): string | undefined {
  if (!subclassName) return undefined;
  const subclassKey = normalizeKey(subclassName);
  if (characterClass) {
    return `${BASE}subclass/${normalizeKey(characterClass)}/${subclassKey}.png`;
  }
  return `${BASE}subclass/${subclassKey}.png`;
}

// ── Wyrmspell ────────────────────────────────────────────────────────────────

export function getWyrmspellIcon(name: string, type?: string): string | undefined {
  if (!name) return undefined;
  const nameKey = normalizeKey(name);
  if (type) {
    return `${BASE}wyrmspell/${normalizeKey(type)}/${nameKey}.png`;
  }
  return `${BASE}wyrmspell/${nameKey}.png`;
}

// ── Event ────────────────────────────────────────────────────────────────────


export const placeholderEventImage = `${BASE}event/placeholder.webp`;

export function getEventImage(eventName: string): string {
  return `${BASE}event/${normalizeKey(eventName)}.webp`;
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
    manifestPromise = fetch(`${BASE}character/manifest.json`).then((r) => r.json());
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
  return `${BASE}character/${key}/portrait.png`;
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
    src: `${BASE}character/${key}/illustrations/${e.file}`,
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
  return `${BASE}character/${key}/talent.png`;
}

export async function getCharacterSkillIcon(
  characterName: string,
  skillName: string,
  characterKey?: string
): Promise<string | undefined> {
  if (!characterName || !skillName) return undefined;
  const key = resolveAssetKey(characterName, characterKey);
  return `${BASE}character/${key}/skills/${normalizeKey(skillName)}.png`;
}
