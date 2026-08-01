import { getResourceIcon } from '@/assets';
import type {
  ArrayFieldDef,
  FieldDef,
} from '@/components/tools/SuggestModal';
import type { Resource } from '@/types/resource';

export const CODE_FIELDS: FieldDef[] = [
  {
    name: 'code',
    label: 'Code',
    type: 'text',
    required: true,
    placeholder: 'e.g. DRAGONCODE123',
  },
  {
    name: 'source',
    label: 'Source (optional)',
    type: 'text',
    placeholder: 'Where did you find this code?',
  },
];

export function buildCodeRewardFields(resources: Resource[]): ArrayFieldDef[] {
  const options = resources
    .map((resource) => ({ value: resource.slug, label: resource.name }))
    .sort((left, right) => left.label.localeCompare(right.label));
  const optionIcons: Record<string, string> = {};
  for (const resource of resources) {
    const icon = getResourceIcon(resource.slug, resource.category);
    if (icon) optionIcons[resource.slug] = icon;
  }

  return [
    {
      name: 'rewards',
      label: 'Rewards',
      toDict: { key: 'name', value: 'quantity' },
      fields: [
        {
          name: 'name',
          label: 'Reward Name',
          type: 'select',
          required: true,
          placeholder: 'Select a resource',
          options,
          optionIcons,
        },
        {
          name: 'quantity',
          label: 'Quantity',
          type: 'text',
          required: true,
          placeholder: 'e.g. 500',
        },
      ],
    },
  ];
}
