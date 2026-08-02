import { useState } from 'react';
import { Link } from 'react-router';
import {
  Badge,
  Center,
  Divider,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import ExpandableText from '@/components/ui/ExpandableText';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import ClassTag from '@/components/ui/ClassTag';
import QualityIcon from '@/components/ui/QualityIcon';
import TierBadge from '@/components/ui/TierBadge';
import RichText from '@/components/common/RichText';
import SafeImage from '@/components/ui/SafeImage';
import { getNoblePhantasmIcon } from '@/assets';
import { StaticSurface } from '@/components/ui/Surface';
import { RICH_TOOLTIP_STYLES } from '@/constants/styles';
import { IMAGE_SIZE, POPOVER_MAX_WIDTH } from '@/constants/ui';
import GearTypeTag from '@/features/wiki/gear/components/GearTypeTag';
import type {
  RecommendedGearLoadoutData,
  RecommendedSubclassEntry,
} from '@/features/characters/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useGradientAccent, useMobileTooltip } from '@/hooks';
import { toQuality } from '@/utils/quality';

interface CharacterRecommendedBuildSectionProps {
  recommendedGearLoadouts: RecommendedGearLoadoutData[];
  recommendedSubclassEntries: RecommendedSubclassEntry[];
  linkedNoblePhantasms: NoblePhantasm[];
  statusEffects: StatusEffect[];
}

export default function CharacterRecommendedBuildSection({
  recommendedGearLoadouts,
  recommendedSubclassEntries,
  linkedNoblePhantasms,
  statusEffects,
}: CharacterRecommendedBuildSectionProps) {
  const { accent } = useGradientAccent();
  const mobileTooltip = useMobileTooltip();
  const [selectedLoadoutIndex, setSelectedLoadoutIndex] = useState(0);

  const activeLoadout =
    recommendedGearLoadouts[selectedLoadoutIndex] ?? recommendedGearLoadouts[0];
  const recommendedGearDetails = activeLoadout?.details ?? [];
  const activatedSetBonuses = activeLoadout?.activatedSetBonuses ?? [];

  if (
    recommendedGearLoadouts.length === 0 &&
    recommendedSubclassEntries.length === 0 &&
    linkedNoblePhantasms.length === 0
  ) {
    return null;
  }

  return (
    <CollapsibleSectionCard
      color={accent.primary}
      header={
        <Group align="flex-start" gap="sm">
          <Stack gap={2}>
            <Title order={2} size="h3">
              Recommended Build
            </Title>
            <Text size="sm" c="dimmed">
              Suggested setup based on current character data.
            </Text>
          </Stack>
        </Group>
      }
    >
      <Stack gap="md">
        {linkedNoblePhantasms.length > 0 && (
          <Stack gap="sm">
            <Text fw={600} size="sm">
              Recommended Noble Phantasms
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {linkedNoblePhantasms.map((noblePhantasm) => {
                const npIcon = getNoblePhantasmIcon(noblePhantasm.slug);
                const topEffect = noblePhantasm.effects[0];
                return (
                  <Link
                    key={noblePhantasm.slug}
                    to={`/noble-phantasms/${noblePhantasm.slug}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <StaticSurface p="sm">
                      <Group gap="sm" wrap="nowrap">
                        {npIcon && (
                          <SafeImage
                            src={npIcon}
                            alt={noblePhantasm.name}
                            w={IMAGE_SIZE.CARD_ICON_SM}
                            h={IMAGE_SIZE.CARD_ICON_SM}
                            fit="contain"
                            loading="lazy"
                          />
                        )}
                        <Stack gap={2} style={{ minWidth: 0 }}>
                          <Text size="sm" fw={600} truncate>
                            {noblePhantasm.name}
                          </Text>
                          {topEffect && (
                            <ExpandableText size="xs">
                              <RichText
                                text={topEffect.description}
                                statusEffects={statusEffects}
                              />
                            </ExpandableText>
                          )}
                        </Stack>
                      </Group>
                    </StaticSurface>
                  </Link>
                );
              })}
            </SimpleGrid>
          </Stack>
        )}

        {recommendedSubclassEntries.length > 0 && (
          <Stack gap="sm">
            <Text fw={600} size="sm">
              Recommended Subclasses
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {recommendedSubclassEntries.map((entry) => {
                const tooltipLabel = (
                  <Stack gap={6}>
                    <Text size="xs" fw={700}>
                      {entry.name}
                    </Text>
                    <Group gap={6} wrap="wrap">
                      {typeof entry.tier === 'number' && (
                        <TierBadge
                          tier={String(entry.tier)}
                          showPrefix
                          size="xs"
                        />
                      )}
                      {entry.className && (
                        <ClassTag characterClass={entry.className} size="xs" />
                      )}
                    </Group>
                    {entry.effect && (
                      <RichText
                        text={entry.effect}
                        statusEffects={statusEffects}
                        disablePopovers
                      />
                    )}
                    {entry.bonuses.length > 0 && (
                      <Text size="xs" c="dimmed">
                        Bonuses: {entry.bonuses.join(', ')}
                      </Text>
                    )}
                  </Stack>
                );

                return (
                  <Tooltip
                    key={entry.name}
                    label={tooltipLabel}
                    multiline
                    maw={POPOVER_MAX_WIDTH}
                    styles={RICH_TOOLTIP_STYLES}
                    {...mobileTooltip}
                  >
                    <StaticSurface p="sm">
                      <Group gap="sm" align="flex-start" wrap="nowrap">
                        {entry.icon && (
                          <Center
                            style={{
                              width: 56,
                              minWidth: 56,
                              height: 52,
                              borderRadius: 8,
                              border:
                                '1px solid var(--mantine-color-default-border)',
                            }}
                          >
                            <SafeImage
                              src={entry.icon}
                              alt={entry.name}
                              w={50}
                              h={46}
                              fit="contain"
                              loading="lazy"
                            />
                          </Center>
                        )}

                        <Stack gap={4} style={{ minWidth: 0 }}>
                          <Group gap={6} wrap="wrap">
                            <Text fw={600} size="sm" truncate>
                              {entry.name}
                            </Text>
                            {typeof entry.tier === 'number' && (
                              <TierBadge
                                tier={String(entry.tier)}
                                showPrefix
                                size="xs"
                              />
                            )}
                            {entry.className && (
                              <ClassTag
                                characterClass={entry.className}
                                size="xs"
                              />
                            )}
                          </Group>
                          {entry.bonuses.length > 0 && (
                            <ExpandableText size="xs">
                              Bonuses: {entry.bonuses.join(', ')}
                            </ExpandableText>
                          )}
                        </Stack>
                      </Group>
                    </StaticSurface>
                  </Tooltip>
                );
              })}
            </SimpleGrid>
          </Stack>
        )}

        {recommendedGearLoadouts.length > 0 && (
          <Stack gap="xs">
            <Group justify="space-between" align="center" gap="sm" wrap="wrap">
              <Text fw={600} size="sm">
                Recommended Gear
              </Text>
              {recommendedGearLoadouts.length > 1 && (
                <SegmentedControl
                  size="xs"
                  value={String(selectedLoadoutIndex)}
                  onChange={(val) => setSelectedLoadoutIndex(Number(val))}
                  data={recommendedGearLoadouts.map((l, i) => ({
                    label: l.loadout.label || `Build ${i + 1}`,
                    value: String(i),
                  }))}
                />
              )}
            </Group>
            {activeLoadout?.loadout.description && (
              <Text size="xs" c="dimmed">
                {activeLoadout.loadout.description}
              </Text>
            )}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
              {recommendedGearDetails.map((entry) => {
                const entryQuality = toQuality(entry.quality);
                const statsEntries = entry.stats
                  ? Object.entries(entry.stats).filter(
                      ([statName, statValue]) =>
                        Boolean(statName) &&
                        statValue !== null &&
                        statValue !== undefined,
                    )
                  : [];

                const tooltipLabel = (
                  <Stack gap="xs">
                    <Group gap="sm" align="center" wrap="nowrap">
                      <SafeImage
                        src={entry.slotIcon}
                        alt={entry.label}
                        w={24}
                        h={24}
                        fit="contain"
                        style={{ flexShrink: 0, opacity: 0.85 }}
                      />
                      <Stack gap={2} style={{ minWidth: 0 }}>
                        <Text fw={700} size="sm" style={{ lineHeight: 1.25 }}>
                          {entry.name}
                        </Text>
                        {(entry.setDisplayName || entry.quality) && (
                          <Group gap={4} wrap="wrap">
                            {entry.setDisplayName && (
                              <Badge
                                variant="light"
                                color={accent.secondary}
                                size="xs"
                              >
                                {entry.setDisplayName} Set
                              </Badge>
                            )}
                            {entryQuality && (
                              <QualityIcon quality={entryQuality} size={16} />
                            )}
                          </Group>
                        )}
                      </Stack>
                    </Group>
                    <Divider />
                    {entry.setBonus &&
                      entry.setBonus.quantity > 0 &&
                      entry.setBonus.description && (
                        <Stack gap={2}>
                          <Badge
                            variant="light"
                            color={accent.primary}
                            size="xs"
                            w="fit-content"
                          >
                            Set Bonus: {entry.setBonus.quantity} Piece
                            {entry.setBonus.quantity > 1 ? 's' : ''}
                          </Badge>
                          <RichText
                            text={entry.setBonus.description}
                            statusEffects={statusEffects}
                            disablePopovers
                          />
                        </Stack>
                      )}
                    {statsEntries.length > 0 && (
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed" fw={600}>
                          Stats
                        </Text>
                        <Group gap={6} wrap="wrap">
                          {statsEntries.map(([statName, statValue]) => (
                            <Badge
                              key={`${entry.slot}-${statName}`}
                              variant="light"
                              color={accent.tertiary}
                              size="xs"
                            >
                              {statName}: {String(statValue)}
                            </Badge>
                          ))}
                        </Group>
                      </Stack>
                    )}
                    {entry.lore && (
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed" fw={600}>
                          Lore
                        </Text>
                        <RichText
                          text={entry.lore}
                          statusEffects={statusEffects}
                          disablePopovers
                        />
                      </Stack>
                    )}
                  </Stack>
                );

                return (
                  <Tooltip
                    key={entry.slot}
                    label={tooltipLabel}
                    multiline
                    maw={POPOVER_MAX_WIDTH}
                    styles={RICH_TOOLTIP_STYLES}
                    {...mobileTooltip}
                  >
                    {entry.setName ? (
                      <Link
                        to={`/gear-sets/${entry.setName}`}
                        style={{
                          textDecoration: 'none',
                          width: '100%',
                          display: 'block',
                        }}
                      >
                        <StaticSurface p="sm">
                          <Group gap="sm" wrap="nowrap">
                            <SafeImage
                              src={entry.icon}
                              alt={`${entry.label}: ${entry.name}`}
                              w={IMAGE_SIZE.CARD_ICON_SM}
                              h={IMAGE_SIZE.CARD_ICON_SM}
                              fit="contain"
                              loading="lazy"
                            />
                            <Stack gap={2} style={{ minWidth: 0 }}>
                              <GearTypeTag type={entry.type} size="xs" />
                              <Text size="sm" fw={600} truncate>
                                {entry.name}
                              </Text>
                              {entry.setDisplayName && (
                                <Text size="xs" c="dimmed" truncate>
                                  {entry.setDisplayName} Set
                                </Text>
                              )}
                            </Stack>
                          </Group>
                        </StaticSurface>
                      </Link>
                    ) : (
                      <StaticSurface p="sm" style={{ width: '100%' }}>
                        <Group gap="sm" wrap="nowrap">
                          <SafeImage
                            src={entry.icon}
                            alt={`${entry.label}: ${entry.name}`}
                            w={48}
                            h={48}
                            fit="contain"
                            loading="lazy"
                          />
                          <Stack gap={2} style={{ minWidth: 0 }}>
                            <GearTypeTag type={entry.type} size="xs" />
                            <Text size="sm" fw={600} truncate>
                              {entry.name}
                            </Text>
                            {entry.setDisplayName && (
                              <Text size="xs" c="dimmed" truncate>
                                {entry.setDisplayName} Set
                              </Text>
                            )}
                          </Stack>
                        </Group>
                      </StaticSurface>
                    )}
                  </Tooltip>
                );
              })}
            </SimpleGrid>
          </Stack>
        )}

        {activatedSetBonuses.length > 0 && (
          <Stack gap="xs">
            <Text fw={600} size="sm">
              Activated Set Bonuses
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {activatedSetBonuses.map((setBonus) => {
                const tooltipLabel = (
                  <Stack gap="xs">
                    <Text fw={700} size="sm" style={{ lineHeight: 1.25 }}>
                      {setBonus.setDisplayName} Set
                    </Text>
                    <Divider />
                    <Group gap={6} wrap="wrap">
                      <Badge variant="light" color="gray" size="xs">
                        Pieces: {setBonus.pieces}/{setBonus.requiredPieces}
                      </Badge>
                      <Badge variant="light" color={accent.primary} size="xs">
                        Activations: ×{setBonus.activations}
                      </Badge>
                    </Group>
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" fw={600}>
                        Effect
                      </Text>
                      <RichText
                        text={setBonus.description}
                        statusEffects={statusEffects}
                        disablePopovers
                      />
                    </Stack>
                  </Stack>
                );

                return (
                  <Tooltip
                    key={setBonus.setName}
                    label={tooltipLabel}
                    multiline
                    maw={POPOVER_MAX_WIDTH}
                    styles={RICH_TOOLTIP_STYLES}
                    {...mobileTooltip}
                  >
                    <StaticSurface p="sm">
                      <Stack gap={4}>
                        <Group justify="space-between" gap="xs">
                          <Text fw={600} size="sm" truncate>
                            {setBonus.setDisplayName}
                          </Text>
                          <Badge
                            variant="filled"
                            color={accent.primary}
                            size="xs"
                          >
                            ×{setBonus.activations}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {setBonus.pieces}/{setBonus.requiredPieces} pieces
                        </Text>
                        <ExpandableText size="xs">
                          <RichText
                            text={setBonus.description}
                            statusEffects={statusEffects}
                          />
                        </ExpandableText>
                      </Stack>
                    </StaticSurface>
                  </Tooltip>
                );
              })}
            </SimpleGrid>
          </Stack>
        )}
      </Stack>
    </CollapsibleSectionCard>
  );
}
