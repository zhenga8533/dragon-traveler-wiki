import type { CharacterClass } from '@/features/characters/types';
import type { GearType } from '@/features/wiki/gear/types';
import type { FactionName } from '@/types/faction';
import type { Quality } from '@/types/quality';
import { normalizeKey } from '@/assets/utils';

// ── Class ────────────────────────────────────────────────────────────────────

export const CLASS_ICON_MAP: Record<CharacterClass, string> = {
  Guardian: '/assets/class/guardian.png',
  Priest: '/assets/class/priest.png',
  Assassin: '/assets/class/assassin.png',
  Warrior: '/assets/class/warrior.png',
  Archer: '/assets/class/archer.png',
  Mage: '/assets/class/mage.png',
};

// ── Faction ──────────────────────────────────────────────────────────────────

export const FACTION_ICON_MAP: Record<FactionName, string> = {
  'Elemental Echo': '/assets/faction/elemental_echo.png',
  'Wild Spirit': '/assets/faction/wild_spirit.png',
  'Arcane Wisdom': '/assets/faction/arcane_wisdom.png',
  'Sanctum Glory': '/assets/faction/sanctum_glory.png',
  'Otherworld Return': '/assets/faction/otherworld_return.png',
  'Illusion Veil': '/assets/faction/illusion_veil.png',
};

// ── Quality ──────────────────────────────────────────────────────────────────

export const QUALITY_ICON_MAP: Record<Quality, string> = {
  UR: '/assets/quality/ur.png',
  'SSR EX': '/assets/quality/ssr_ex.png',
  'SSR+': '/assets/quality/ssr_plus.png',
  SSR: '/assets/quality/ssr.png',
  SR: '/assets/quality/sr.png',
  R: '/assets/quality/r.png',
  N: '/assets/quality/n.png',
  C: '/assets/quality/c.png',
};

// ── Wyrms ────────────────────────────────────────────────────────────────────

export const FACTION_WYRM_MAP: Record<FactionName, string> = {
  'Elemental Echo': '/assets/wyrms/fire_whelp.png',
  'Wild Spirit': '/assets/wyrms/emerald_whelp.png',
  'Arcane Wisdom': '/assets/wyrms/butterfly_whelp.png',
  'Sanctum Glory': '/assets/wyrms/light_whelp.png',
  'Otherworld Return': '/assets/wyrms/shadow_whelp.png',
  'Illusion Veil': '/assets/wyrms/dark_whelp.png',
};

// ── Artifacts ────────────────────────────────────────────────────────────────

export function getArtifactIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `/assets/artifacts/${normalizeKey(name)}/artifact.png`;
}

export function getTreasureIcon(artifactName: string, treasureName: string): string | undefined {
  if (!artifactName || !treasureName) return undefined;
  return `/assets/artifacts/${normalizeKey(artifactName)}/treasures/${normalizeKey(treasureName)}.png`;
}

// ── Gear ─────────────────────────────────────────────────────────────────────

export const GEAR_TYPE_ICON_MAP: Record<GearType, string> = {
  Headgear: '/assets/gear/icons/headgear.png',
  Chestplate: '/assets/gear/icons/chestplate.png',
  Bracers: '/assets/gear/icons/bracers.png',
  Boots: '/assets/gear/icons/boots.png',
  Weapon: '/assets/gear/icons/weapon.png',
  Accessory: '/assets/gear/icons/accessory.png',
};

export function getGearIcon(type: string, name: string): string | undefined {
  if (!type || !name) return undefined;
  return `/assets/gear/${normalizeKey(type)}/${normalizeKey(name)}.png`;
}

// ── Howlkin ──────────────────────────────────────────────────────────────────

export function getHowlkinIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `/assets/howlkin/${normalizeKey(name)}.png`;
}

// ── Noble Phantasm ───────────────────────────────────────────────────────────

export function getNoblePhantasmIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `/assets/noble_phantasm/${normalizeKey(name)}.png`;
}

// ── Relic ────────────────────────────────────────────────────────────────────

export function getRelicIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `/assets/relic/${normalizeKey(name)}.png`;
}

export function getOracleScrollImage(name: string): string | undefined {
  if (!name) return undefined;
  return `/assets/relic/oracle_scroll/${normalizeKey(name)}.png`;
}

// ── Resource ─────────────────────────────────────────────────────────────────

export function getResourceIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `/assets/resource/${normalizeKey(name)}.png`;
}

// ── Skill ────────────────────────────────────────────────────────────────────

export function getSkillIcon(skillName: string): string | undefined {
  if (!skillName) return undefined;
  return `/assets/skill/${normalizeKey(skillName)}.png`;
}

// ── Status Effect ────────────────────────────────────────────────────────────

export function getStatusEffectIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `/assets/status_effect/${normalizeKey(name)}.png`;
}

// ── Subclass ─────────────────────────────────────────────────────────────────

export function getSubclassIcon(subclassName: string, characterClass?: string): string | undefined {
  if (!subclassName) return undefined;
  const subclassKey = normalizeKey(subclassName);
  if (characterClass) {
    return `/assets/subclass/${normalizeKey(characterClass)}/${subclassKey}.png`;
  }
  return `/assets/subclass/${subclassKey}.png`;
}

// ── Wyrmspell ────────────────────────────────────────────────────────────────

export function getWyrmspellIcon(name: string): string | undefined {
  if (!name) return undefined;
  return `/assets/wyrmspell/${normalizeKey(name)}.png`;
}

// ── Event ────────────────────────────────────────────────────────────────────

function toEventSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export const placeholderEventImage = '/assets/event/placeholder.webp';

export function getEventImage(eventName: string): string {
  return `/assets/event/${toEventSlug(eventName)}.webp`;
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
    manifestPromise = fetch('/assets/character-manifest.json').then((r) => r.json());
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
  return `/assets/character/${key}/portrait.png`;
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
    src: `/assets/character/${key}/illustrations/${e.file}`,
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
  return `/assets/character/${key}/talent.png`;
}

export async function getCharacterSkillIcon(
  characterName: string,
  skillName: string,
  characterKey?: string
): Promise<string | undefined> {
  if (!characterName || !skillName) return undefined;
  const key = resolveAssetKey(characterName, characterKey);
  return `/assets/character/${key}/skills/${normalizeKey(skillName)}.png`;
}
