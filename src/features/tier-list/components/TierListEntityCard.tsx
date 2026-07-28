import { getNoblePhantasmIcon } from '@/assets';
import NoteTooltipIcon from '@/components/ui/NoteTooltipIcon';
import QualityIcon from '@/components/ui/QualityIcon';
import SafeImage from '@/components/ui/SafeImage';
import { CHARACTER_CARD } from '@/constants/ui';
import CharacterCard from '@/features/characters/components/CharacterCard';
import type { TierListRankableEntity } from '@/features/tier-list/types';
import { Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { Link } from 'react-router-dom';

interface TierListEntityCardProps {
  entity?: TierListRankableEntity;
  fallbackName: string;
  disableLink?: boolean;
  note?: string;
  size?: number;
  clampName?: boolean;
}

export default function TierListEntityCard({
  entity,
  fallbackName,
  disableLink = false,
  note,
  size = CHARACTER_CARD.PORTRAIT_SIZE,
  clampName = true,
}: TierListEntityCardProps) {
  if (entity?.character) {
    return (
      <CharacterCard
        name={entity.character.name}
        quality={entity.character.quality}
        routePath={`/characters/${entity.character.slug}`}
        disableLink={disableLink}
        note={note}
        size={size}
        clampName={clampName}
      />
    );
  }

  const noblePhantasm = entity?.noblePhantasm;
  const name = noblePhantasm?.name ?? fallbackName;
  const routePath = noblePhantasm
    ? `/noble-phantasms/${noblePhantasm.slug}`
    : undefined;
  const content = (
    <Stack gap={2} align="center">
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <SafeImage
          src={
            noblePhantasm
              ? getNoblePhantasmIcon(noblePhantasm.slug)
              : undefined
          }
          alt={name}
          w={size}
          h={size}
          fit="contain"
          radius="sm"
          loading="lazy"
        />
        {note && (
          <NoteTooltipIcon
            note={note}
            ariaLabel={`Show note for ${name}`}
            stopPropagation
            wrapperStyle={{ position: 'absolute', top: 0, right: 0 }}
          />
        )}
      </div>
      <Group gap={4} justify="center" wrap="nowrap" style={{ maxWidth: '100%' }}>
        <Text
          size="xs"
          fw={500}
          ta="center"
          lineClamp={clampName ? 1 : undefined}
          c={disableLink ? 'dimmed' : undefined}
          className={disableLink ? undefined : 'dt-link-text'}
          style={{ minWidth: 0 }}
        >
          {name}
        </Text>
        {noblePhantasm && (
          <QualityIcon quality={noblePhantasm.quality} size={16} />
        )}
      </Group>
    </Stack>
  );

  if (disableLink || !routePath) return content;
  return (
    <UnstyledButton component={Link} to={routePath}>
      {content}
    </UnstyledButton>
  );
}
