import WikiHowlkinBadge from '@/features/wiki/howlkins/components/HowlkinBadge';
import type { Howlkin } from '@/features/wiki/howlkins/types';
import { useDataFetch } from '@/hooks';
import { normalizeName } from '@/utils';
import type { MantineSize } from '@mantine/core';

export interface HowlkinBadgeProps {
  name: string;
  size?: MantineSize;
}

export default function HowlkinBadge({ name, size = 'sm' }: HowlkinBadgeProps) {
  const { data: howlkins } = useDataFetch<Howlkin[]>('data/howlkins.json', []);

  const howlkin =
    howlkins.find(
      (entry) => normalizeName(entry.name) === normalizeName(name)
    ) ?? undefined;

  return <WikiHowlkinBadge name={name} howlkin={howlkin} size={size} />;
}
