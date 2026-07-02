import WikiHowlkinBadge from '@/features/wiki/howlkins/components/HowlkinBadge';
import { useHowlkins } from '@/features/wiki/hooks/use-wiki-data';
import type { MantineSize } from '@mantine/core';

export interface ResolvedHowlkinBadgeProps {
  /** Howlkin slug (e.g. "black_dragon") — the canonical key in howlkins.json. */
  slug: string;
  size?: MantineSize;
}

/** Resolves Howlkin data by slug before rendering the feature badge. */
export default function ResolvedHowlkinBadge({
  slug,
  size = 'sm',
}: ResolvedHowlkinBadgeProps) {
  const { data: howlkins } = useHowlkins();
  const howlkin = howlkins.find((entry) => entry.slug === slug);

  return <WikiHowlkinBadge name={howlkin?.name ?? slug} howlkin={howlkin} size={size} />;
}
