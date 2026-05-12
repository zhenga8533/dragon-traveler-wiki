import type { FieldDef } from '@/components/tools/SuggestModal';
import { RELIC_TYPE_ORDER, QUALITY_ORDER } from '@/constants/colors';

export const RELIC_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Relic name',
  },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: [...RELIC_TYPE_ORDER],
  },
  {
    name: 'quality',
    label: 'Quality',
    type: 'select',
    required: true,
    options: [...QUALITY_ORDER],
  },
  {
    name: 'oracle_scroll',
    label: 'Oracle Scroll',
    type: 'text',
    placeholder: 'Oracle scroll name (leave blank if none)',
  },
  {
    name: 'lore',
    label: 'Lore',
    type: 'textarea',
    required: true,
    placeholder: 'Relic lore text',
  },
];
