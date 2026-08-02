import { SUPPORTED_LOCALES } from '@/utils/data-paths';
import type { GradientPalette } from '@/contexts';

export const RANDOM_MODE_LABEL: Record<'all' | 'png' | 'mp4', string> = {
  all: '',
  png: 'PNG ',
  mp4: 'MP4 ',
};

export const LOCALE_OPTIONS = [
  { value: 'enUS', label: 'English (US)' },
  { value: 'zhCN', label: '简体中文' },
  { value: 'zhTW', label: '繁體中文' },
  { value: 'jaJP', label: '日本語' },
  { value: 'koKR', label: '한국어' },
  { value: 'thTH', label: 'ภาษาไทย' },
  { value: 'viVN', label: 'Tiếng Việt' },
].filter((option) =>
  (SUPPORTED_LOCALES as readonly string[]).includes(option.value),
);

export const CUSTOM_COLOR_FIELDS: {
  key: 'colorA' | 'colorB';
  label: string;
  swatches: string[];
}[] = [
  {
    key: 'colorA',
    label: 'Color A',
    swatches: [
      '#7c3aed',
      '#1d4ed8',
      '#0f766e',
      '#be123c',
      '#b45309',
      '#065f46',
      '#831843',
      '#38bdf8',
    ],
  },
  {
    key: 'colorB',
    label: 'Color B',
    swatches: [
      '#9333ea',
      '#2563eb',
      '#0891b2',
      '#f43f5e',
      '#f97316',
      '#0f766e',
      '#db2777',
      '#7dd3fc',
    ],
  },
];

// Settings swatches must preview all 8 palettes at once, but `--dt-brand-gradient`
// (src/styles/theme-tokens.css) only reflects the *currently active* palette on
// <html>, so it can't drive an inactive preview without side effects. These hex
// stops are the literal Mantine default-theme values for the same color/shade
// pairs used in each palette's --dt-brand-gradient — keep both in sync when
// either changes.
export const PALETTE_SWATCHES: {
  value: GradientPalette;
  label: string;
  gradient: string;
}[] = [
  {
    value: 'violet',
    label: 'Arcane',
    // violet-3, grape-5, pink-5
    gradient: 'linear-gradient(120deg, #b197fc 0%, #cc5de8 50%, #f06595 100%)',
  },
  {
    value: 'ocean',
    label: 'Abyss',
    // blue-3, blue-6, cyan-5
    gradient: 'linear-gradient(120deg, #74c0fc 0%, #228be6 50%, #22b8cf 100%)',
  },
  {
    value: 'sunset',
    label: 'Golden Hour',
    // yellow-4, orange-4, yellow-6
    gradient: 'linear-gradient(120deg, #ffd43b 0%, #ffa94d 50%, #fab005 100%)',
  },
  {
    value: 'forest',
    label: 'Ancient Grove',
    // green-4, teal-6, green-6
    gradient: 'linear-gradient(120deg, #69db7c 0%, #12b886 50%, #40c057 100%)',
  },
  {
    value: 'ember',
    label: 'Dragon Fire',
    // red-4, pink-5, grape-5
    gradient: 'linear-gradient(120deg, #ff8787 0%, #f06595 50%, #cc5de8 100%)',
  },
  {
    value: 'dusk',
    label: 'Northern Lights',
    // teal-3, violet-5, indigo-5
    gradient: 'linear-gradient(120deg, #63e6be 0%, #845ef7 50%, #5c7cfa 100%)',
  },
  {
    value: 'frost',
    label: 'Glacial',
    // cyan-2, blue-3, cyan-4
    gradient: 'linear-gradient(120deg, #99e9f2 0%, #74c0fc 50%, #3bc9db 100%)',
  },
  {
    value: 'blossom',
    label: 'Night Garden',
    // pink-3, grape-5, pink-6
    gradient: 'linear-gradient(120deg, #faa2c1 0%, #cc5de8 50%, #e64980 100%)',
  },
];
