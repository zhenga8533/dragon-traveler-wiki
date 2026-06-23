import ExpandableText from '@/components/ui/ExpandableText';
import { getWyrmspellIcon } from '@/assets';
import RichText from '@/components/common/RichText';
import { WYRMSPELL_TYPE_COLOR, getStableTagColor } from '@/constants/colors';
import { getCardHoverProps } from '@/constants/styles';
import { LINK_BLOCK_RESET_STYLE } from '@/constants/styles';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import { getMaxQuality } from '@/features/wiki/wyrmspells/types';
import { useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import SafeImage from '@/components/ui/SafeImage';
import { Link } from 'react-router-dom';

interface WyrmspellCardProps {
  name: string;
  type?: string;
  wyrmspells?: Wyrmspell[];
}

export default function WyrmspellCard({
  name,
  type,
  wyrmspells = [],
}: WyrmspellCardProps) {
  const { data: statusEffects } = useStatusEffects();
  const wyrmspell = wyrmspells.find(
    (w) => w.slug === name || w.name === name
  );
  if (!wyrmspell) return null;

  const displayType = type || wyrmspell.type || 'Unknown';
  const iconSrc = getWyrmspellIcon(wyrmspell.slug, displayType);
  const maxQuality = getMaxQuality(wyrmspell);

  return (
    <Paper
      component={Link}
      to={`/wyrmspells/${wyrmspell.slug}`}
      p="sm"
      radius="md"
      withBorder
      {...getCardHoverProps({ interactive: true, style: LINK_BLOCK_RESET_STYLE })}
    >
      <Stack gap="xs" align="center">
        {iconSrc && (
          <SafeImage
            src={iconSrc}
            alt={wyrmspell.name}
            w={48}
            h={48}
            fit="contain"
            loading="lazy"
          />
        )}
        <Group gap={4} justify="center" align="center">
          <Text size="sm" fw={600} ta="center" className="dt-link-text">
            {wyrmspell.name}
          </Text>
          {maxQuality && <QualityIcon quality={maxQuality.quality} />}
        </Group>
        <Group gap={4} justify="center">
          <Badge
            variant="light"
            size="sm"
            color={
              WYRMSPELL_TYPE_COLOR[
                displayType as keyof typeof WYRMSPELL_TYPE_COLOR
              ] ?? getStableTagColor(displayType)
            }
          >
            {displayType}
          </Badge>
          {wyrmspell.exclusive_faction && (
            <FactionTag faction={wyrmspell.exclusive_faction} size="xs" />
          )}
        </Group>
        {maxQuality && (
          <ExpandableText size="xs" ta="center">
            <RichText text={maxQuality.effect} statusEffects={statusEffects} />
          </ExpandableText>
        )}
      </Stack>
    </Paper>
  );
}
