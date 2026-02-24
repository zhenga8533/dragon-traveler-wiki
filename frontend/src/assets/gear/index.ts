import type { GearType } from '../../types/gear';
import { normalizeKey } from '../utils';
import accessoryIcon from './icons/accessory.png';
import bootsIcon from './icons/boots.png';
import bracersIcon from './icons/bracers.png';
import chestplateIcon from './icons/chestplate.png';
import headgearIcon from './icons/headgear.png';
import weaponIcon from './icons/weapon.png';

export const GEAR_TYPE_ICON_MAP: Record<GearType, string> = {
  Headgear: headgearIcon,
  Chestplate: chestplateIcon,
  Bracers: bracersIcon,
  Boots: bootsIcon,
  Weapon: weaponIcon,
  Accessory: accessoryIcon,
};

const iconModules = import.meta.glob<{ default: string }>('./**/*.png', {
  eager: true,
});

const gearIcons = new Map<string, string>();

for (const [path, module] of Object.entries(iconModules)) {
  const match = path.match(/\.\/([^/]+)\/(.+)\.png$/);
  if (!match) continue;
  const [, typeDir, fileName] = match;
  gearIcons.set(
    `${typeDir.toLowerCase()}/${fileName.toLowerCase()}`,
    module.default
  );
}

export function getGearIcon(type: string, name: string): string | undefined {
  const typeKey = normalizeKey(type);
  const nameKey = normalizeKey(name);
  return gearIcons.get(`${typeKey}/${nameKey}`);
}
