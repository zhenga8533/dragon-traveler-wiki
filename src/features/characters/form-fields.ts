import type { FieldDef } from '@/components/tools/SuggestModal';
import { CLASS_ORDER, QUALITY_ORDER } from '@/constants/colors';

export const CHARACTER_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Character name',
  },
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    placeholder: 'Character title',
  },
  {
    name: 'quality',
    label: 'Quality',
    type: 'select',
    required: true,
    options: QUALITY_ORDER,
  },
  {
    name: 'character_class',
    label: 'Class',
    type: 'select',
    required: true,
    options: CLASS_ORDER,
  },
  {
    name: 'factions',
    label: 'Factions',
    type: 'text',
    placeholder: 'e.g. Elemental Echo, Wild Spirit',
  },
  { name: 'is_global', label: 'Available on Global server', type: 'boolean' },
  {
    name: 'additional_info',
    label: 'Additional Info (optional)',
    type: 'textarea',
    placeholder: 'Any extra details about this character',
  },
];
