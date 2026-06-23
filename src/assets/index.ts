import type { CharacterClass } from '@/features/characters/types';
import type { GearType } from '@/features/wiki/gear/types';
import type { FactionSlug } from '@/types/faction';
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

export const FACTION_ICON_MAP: Record<FactionSlug, string> = {
  elemental_echo: `${BASE}faction/elemental_echo.png`,
  wild_spirit: `${BASE}faction/wild_spirit.png`,
  arcane_wisdom: `${BASE}faction/arcane_wisdom.png`,
  sanctum_glory: `${BASE}faction/sanctum_glory.png`,
  otherworld_return: `${BASE}faction/otherworld_return.png`,
  illusion_veil: `${BASE}faction/illusion_veil.png`,
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

export const FACTION_WYRM_MAP: Record<FactionSlug, string> = {
  elemental_echo: `${BASE}wyrm/blazing_dragon/portrait.png`,
  wild_spirit: `${BASE}wyrm/jade_dragon/portrait.png`,
  arcane_wisdom: `${BASE}wyrm/nymph_dragon/portrait.png`,
  sanctum_glory: `${BASE}wyrm/heavenglow_dragon/portrait.png`,
  otherworld_return: `${BASE}wyrm/nethercrypt_dragon/portrait.png`,
  illusion_veil: `${BASE}wyrm/shadowbane_dragon/portrait.png`,
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

/** Build a resource icon path using the resource's stable slug. */
export function getResourceIcon(slug: string, category: string): string | undefined {
  if (!slug || !category) return undefined;
  return `${BASE}resource/${category.toLowerCase()}/${slug}.png`;
}

// ── Skill ────────────────────────────────────────────────────────────────────

export function getSkillIcon(skillName: string): string | undefined {
  if (!skillName) return undefined;
  return `${BASE}skill/${normalizeKey(skillName)}.png`;
}

// ── Status Effect ────────────────────────────────────────────────────────────

/** Build a status-effect icon path using the effect's stable slug. */
export function getStatusEffectIcon(slug: string, type: string): string | undefined {
  if (!slug || !type) return undefined;
  return `${BASE}status_effect/${normalizeKey(type)}/${slug}.png`;
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

/** Build an event banner path using the event's stable slug. */
export function getEventImage(slug: string): string {
  return `${BASE}event/${slug}.webp`;
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
