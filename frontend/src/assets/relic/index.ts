import { normalizeKey } from '@/assets/utils';

const relicModules = import.meta.glob<{ default: string }>('./*.png', {
  eager: true,
});

const oracleScrollModules = import.meta.glob<{ default: string }>(
  './oracle_scroll/*.png',
  { eager: true }
);

const relicIcons = new Map<string, string>();
for (const [path, module] of Object.entries(relicModules)) {
  const match = path.match(/\.\/(.+)\.png$/);
  if (!match) continue;
  relicIcons.set(normalizeKey(match[1]), module.default);
}

const oracleScrollImages = new Map<string, string>();
for (const [path, module] of Object.entries(oracleScrollModules)) {
  const match = path.match(/\/oracle_scroll\/(.+)\.png$/);
  if (!match) continue;
  oracleScrollImages.set(normalizeKey(match[1]), module.default);
}

export function getRelicIcon(name: string): string | undefined {
  return relicIcons.get(normalizeKey(name));
}

export function getOracleScrollImage(name: string): string | undefined {
  return oracleScrollImages.get(normalizeKey(name));
}
