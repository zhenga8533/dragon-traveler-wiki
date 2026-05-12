import type { ArrayFieldDef, FieldDef } from '@/components/tools/SuggestModal';
import { QUALITY_ORDER } from '@/constants/colors';

export const ARTIFACT_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Artifact name',
  },
  {
    name: 'quality',
    label: 'Quality',
    type: 'select',
    required: true,
    options: QUALITY_ORDER,
  },
  {
    name: 'is_global',
    label: 'Available on Global server',
    type: 'boolean',
  },
  {
    name: 'lore',
    label: 'Lore',
    type: 'textarea',
    placeholder: 'Artifact lore text',
  },
  {
    name: 'columns',
    label: 'Columns',
    type: 'number',
    required: true,
    placeholder: 'e.g. 2',
  },
  {
    name: 'rows',
    label: 'Rows',
    type: 'number',
    required: true,
    placeholder: 'e.g. 2',
  },
];

export const ARTIFACT_EFFECT_ARRAY_FIELDS: ArrayFieldDef[] = [
  {
    name: 'effect',
    label: 'Effects',
    minItems: 1,
    fields: [
      {
        name: 'level',
        label: 'Level',
        type: 'number',
        required: true,
        placeholder: 'e.g. 0',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        placeholder: 'Effect description at this level',
      },
    ],
  },
];
