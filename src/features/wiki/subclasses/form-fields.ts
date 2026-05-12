import type { FieldDef } from '@/components/tools/SuggestModal';
import { CLASS_ORDER } from '@/constants/colors';

export const SUBCLASS_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Subclass name',
  },
  {
    name: 'class',
    label: 'Class',
    type: 'select',
    required: true,
    options: CLASS_ORDER,
  },
  {
    name: 'tier',
    label: 'Tier',
    type: 'number',
    required: true,
    placeholder: '1, 2, or 3',
  },
  {
    name: 'bonuses',
    label: 'Bonuses',
    type: 'textarea',
    required: true,
    placeholder: 'One bonus per line',
  },
  {
    name: 'effect',
    label: 'Effect',
    type: 'textarea',
    required: true,
    placeholder: 'Describe the subclass effect',
  },
];
