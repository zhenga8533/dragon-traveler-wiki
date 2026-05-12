import type { ArrayFieldDef, FieldDef } from '@/components/tools/SuggestModal';

export const GEAR_SET_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Gear set name',
  },
  {
    name: 'bonus_quantity',
    label: 'Set Bonus Quantity',
    type: 'number',
    required: true,
    placeholder: 'e.g. 2 (use 0 for no set bonus)',
  },
  {
    name: 'bonus_description',
    label: 'Set Bonus Description',
    type: 'textarea',
    placeholder: 'Describe the set bonus effect',
  },
];

export const GEAR_STATS_ARRAY_FIELDS: ArrayFieldDef[] = [
  {
    name: 'stats',
    label: 'Stats',
    minItems: 1,
    toDict: { key: 'stat', value: 'value' },
    fields: [
      {
        name: 'stat',
        label: 'Stat Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. HP',
      },
      {
        name: 'value',
        label: 'Value',
        type: 'text',
        required: true,
        placeholder: 'e.g. 11810',
      },
    ],
  },
];
