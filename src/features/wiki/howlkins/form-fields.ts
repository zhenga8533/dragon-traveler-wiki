import type { ArrayFieldDef, FieldDef } from '@/components/tools/SuggestModal';
import { QUALITY_ORDER } from '@/constants/quality';

export const HOWLKIN_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Howlkin name',
  },
  {
    name: 'quality',
    label: 'Quality',
    type: 'select',
    required: true,
    options: QUALITY_ORDER,
  },
  {
    name: 'passive_effects',
    label: 'Passive Effects',
    type: 'textarea',
    required: true,
    placeholder: 'Describe the passive effect(s), one per line',
  },
];

export const HOWLKIN_STATS_FIELDS: ArrayFieldDef[] = [
  {
    name: 'basic_stats',
    label: 'Basic Stats',
    minItems: 1,
    fields: [
      {
        name: 'stat',
        label: 'Stat',
        type: 'text',
        required: true,
        placeholder: 'e.g. Belligerence',
      },
      {
        name: 'value',
        label: 'Value',
        type: 'text',
        required: true,
        placeholder: 'e.g. 108',
      },
    ],
  },
];

export const GOLDEN_ALLIANCE_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Alliance Name',
    type: 'text',
    required: true,
    placeholder: 'Golden alliance name',
  },
  {
    name: 'howlkins',
    label: 'Members',
    type: 'textarea',
    required: true,
    placeholder: 'One Howlkin name per line',
  },
];

export const GOLDEN_ALLIANCE_EFFECTS_FIELDS: ArrayFieldDef[] = [
  {
    name: 'effects',
    label: 'Alliance Effects',
    minItems: 1,
    fields: [
      {
        name: 'level',
        label: 'Level',
        type: 'number',
        required: true,
        placeholder: 'e.g. 1',
      },
      {
        name: 'stats',
        label: 'Stats',
        type: 'textarea',
        required: true,
        placeholder: 'List stats for this level (comma or newline separated)',
      },
    ],
  },
];
