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
  (SUPPORTED_LOCALES as readonly string[]).includes(option.value)
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

export const PALETTE_SWATCHES: {
  value: GradientPalette;
  label: string;
  gradient: string;
}[] = [
  {
    value: 'violet',
    label: 'Arcane',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #4338ca 100%)',
  },
  {
    value: 'ocean',
    label: 'Abyss',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0891b2 100%)',
  },
  {
    value: 'sunset',
    label: 'Golden Hour',
    gradient: 'linear-gradient(135deg, #b45309 0%, #f97316 50%, #ca8a04 100%)',
  },
  {
    value: 'forest',
    label: 'Ancient Grove',
    gradient: 'linear-gradient(135deg, #065f46 0%, #0f766e 50%, #134e4a 100%)',
  },
  {
    value: 'ember',
    label: 'Dragon Fire',
    gradient: 'linear-gradient(135deg, #be123c 0%, #f43f5e 50%, #c026d3 100%)',
  },
  {
    value: 'dusk',
    label: 'Northern Lights',
    gradient: 'linear-gradient(135deg, #0f766e 0%, #7c3aed 50%, #312e81 100%)',
  },
  {
    value: 'frost',
    label: 'Glacial',
    gradient: 'linear-gradient(135deg, #38bdf8 0%, #7dd3fc 50%, #a5f3fc 100%)',
  },
  {
    value: 'blossom',
    label: 'Night Garden',
    gradient: 'linear-gradient(135deg, #831843 0%, #db2777 50%, #6b21a8 100%)',
  },
];
