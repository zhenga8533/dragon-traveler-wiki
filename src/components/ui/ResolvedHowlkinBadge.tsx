import WikiHowlkinBadge from '@/features/wiki/howlkins/components/HowlkinBadge';
import { useHowlkins } from '@/features/wiki/hooks/use-wiki-data';
import { normalizeName } from '@/utils';
import type { MantineSize } from '@mantine/core';

export interface ResolvedHowlkinBadgeProps {
  name: string;
  size?: MantineSize;
}

/** Resolves Howlkin data by name before rendering the feature badge. */
export default function ResolvedHowlkinBadge({
  name,
  size = 'sm',
}: ResolvedHowlkinBadgeProps) {
  const { data: howlkins } = useHowlkins();
  const howlkin = howlkins.find(
    (entry) => normalizeName(entry.name) === normalizeName(name)
  );

  return <WikiHowlkinBadge name={name} howlkin={howlkin} size={size} />;
}
