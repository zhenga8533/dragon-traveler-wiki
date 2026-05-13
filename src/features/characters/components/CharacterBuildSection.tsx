import { useMemo } from 'react';
import ExpandableText from '@/components/ui/ExpandableText';
import { getNoblePhantasmIcon } from '@/assets';
import RichText from '@/components/common/RichText';
import ClassTag from '@/components/ui/ClassTag';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import QualityIcon from '@/components/ui/QualityIcon';
import {
  getCardHoverProps,
  RICH_TOOLTIP_STYLES,
} from '@/constants/styles';
import { IMAGE_SIZE, TRANSITION } from '@/constants/ui';
import CharacterReferenceSection from '@/features/characters/components/CharacterReferenceSection';
import type {
  ActivatedSetBonus,
  Character,
  RecommendedGearDetail,
  RecommendedSubclassEntry,
} from '@/features/characters/types';
import type { Team } from '@/features/teams/types';
import GearTypeTag from '@/features/wiki/gear/components/GearTypeTag';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useDarkMode, useGradientAccent, useMobileTooltip } from '@/hooks';
import { toEntitySlug } from '@/utils/entity-slug';
import { toQuality } from '@/utils/quality';
import { getLoreGlassStyles } from '@/constants/glass';
import {
  Badge,
  Box,
  Center,
  Collapse,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import SafeImage from '@/components/ui/SafeImage';
import { IoChevronDown } from 'react-icons/io5';
import { Link } from 'react-router-dom';

interface CharacterPageBuildSectionProps {
  character: Character;
  teams: Team[];
  enableNameBasedReferences?: boolean;
  selectedTierListName: string | null;
  tierLabel: string | null;
  tierListCharacterNote: string | null;
  statusEffects: StatusEffect[];
  recommendedGearDetails: RecommendedGearDetail[];
  recommendedSubclassEntries: RecommendedSubclassEntry[];
  activatedSetBonuses: ActivatedSetBonus[];
  linkedNoblePhantasm: NoblePhantasm | null;
  scrollToSkill: (skillName: string) => void;
  scrollToTalent: () => void;
}

function QuoteCard({ text, attribution, label }: { text: string; attribution: string; label?: string }) {
  const isDark = useDarkMode();
  const glassStyles = getLoreGlassStyles(isDark);

  return (
    <Stack gap={4}>
      {label && (
        <Text fw={600} size="sm">
          {label}
        </Text>
      )}
      <Paper p="md" radius="md" style={glassStyles}>
        <Stack gap={8}>
          <Text
            fs="italic"
            size="sm"
            c={isDark ? 'gray.3' : 'dark.4'}
            style={{ lineHeight: 1.7 }}
          >
            "{text}"
          </Text>
          <Text size="xs" c="dimmed" fw={500} ta="right">
            — {attribution}
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}

interface LoreBlockProps {
  lore: string | string[];
  showLabel: boolean;
  statusEffects: StatusEffect[];
  skills: Character['skills'];
  talent: Character['talent'] | null;
  onSkillClick: (skillName: string) => void;
  onTalentClick: () => void;
}

function LoreBlock({ lore, showLabel, statusEffects, skills, talent, onSkillClick, onTalentClick }: LoreBlockProps) {
  const isDark = useDarkMode();
  const [expanded, { toggle }] = useDisclosure(false);

  const entries = useMemo(() => {
    if (Array.isArray(lore)) return lore;
    // Split by double newline or multiple newlines with optional whitespace
    return lore.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  }, [lore]);

  const firstEntry = entries[0] || '';
  const remaining = entries.slice(1);
  const hasMore = remaining.length > 0;

  const richTextProps = {
    statusEffects,
    skills,
    talent: talent ?? null,
    onSkillClick,
    onTalentClick,
    italic: true,
    lineHeight: 1.8,
  } as const;

  const glassStyles = getLoreGlassStyles(isDark);

  return (
    <Stack gap={4}>
      {showLabel && (
        <Text fw={600} size="sm">
          Lore
        </Text>
      )}
      <Paper p="md" radius="md" style={glassStyles}>
        <Stack gap="md">
          <Box style={{ position: 'relative' }}>
            <RichText text={firstEntry} {...richTextProps} />
            {hasMore && !expanded && (
              <Box
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 48,
                  background: `linear-gradient(to bottom, transparent, ${isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'})`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </Box>
          {hasMore && (
            <>
              <Collapse in={expanded}>
                <Stack gap="lg" pt="xs">
                  {remaining.map((entry, i) => (
                    <RichText key={i} text={entry} {...richTextProps} />
                  ))}
                </Stack>
              </Collapse>
              <UnstyledButton
                onClick={toggle}
                style={{ width: '100%' }}
                aria-expanded={expanded}
              >
                <Group gap="xs" wrap="nowrap">
                  <Box style={{ flex: 1, height: 1, background: 'var(--mantine-color-default-border)', opacity: 0.5 }} />
                  <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                    <Text size="xs" fw={600} c="dimmed">
                      {expanded ? 'Show less' : `${remaining.length} more paragraph${remaining.length === 1 ? '' : 's'}`}
                    </Text>
                    <Box
                      aria-hidden="true"
                      style={{
                        display: 'inline-flex',
                        color: 'var(--mantine-color-dimmed)',
                        transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <IoChevronDown size={IMAGE_SIZE.ICON_SM} />
                    </Box>
                  </Group>
                  <Box style={{ flex: 1, height: 1, background: 'var(--mantine-color-default-border)', opacity: 0.5 }} />
                </Group>
              </UnstyledButton>
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default function CharacterPageBuildSection({
  character,
  teams,
  enableNameBasedReferences = true,
  selectedTierListName,
  tierLabel,
  tierListCharacterNote,
  statusEffects,
  recommendedGearDetails,
  recommendedSubclassEntries,
  activatedSetBonuses,
  linkedNoblePhantasm,
  scrollToSkill,
  scrollToTalent,
}: CharacterPageBuildSectionProps) {
  const { accent } = useGradientAccent();
  const mobileTooltip = useMobileTooltip();

  return (
    <>
      {/* Lore Section */}
      {(character.lore || character.summary) && (
        <CollapsibleSectionCard
          header={
            <Stack gap={2}>
              <Title order={2} size="h3">
                About
              </Title>
              <Text size="sm" c="dimmed">
                Character overview, lore, quote, origin, and noble phantasm details.
              </Text>
            </Stack>
          }
        >
          <Stack gap="md">
            {character.summary && (
              <Stack gap={4}>
                <Group gap="xs" align="center">
                  <Text fw={600} size="sm">
                    Overview
                  </Text>
                  <Badge variant="light" color="gray" size="xs">
                    AI-generated
                  </Badge>
                </Group>
                <RichText
                  text={character.summary}
                  statusEffects={statusEffects}
                  skills={character.skills}
                  talent={character.talent ?? null}
                  onSkillClick={scrollToSkill}
                  onTalentClick={scrollToTalent}
                  lineHeight={1.7}
                />
              </Stack>
            )}

            {character.lore && (
              <LoreBlock
                lore={character.lore}
                showLabel={true}
                statusEffects={statusEffects}
                skills={character.skills}
                talent={character.talent ?? null}
                onSkillClick={scrollToSkill}
                onTalentClick={scrollToTalent}
              />
            )}

            {(character.ssr_quote || character.quote) && (
              <SimpleGrid cols={{ base: 1, sm: (character.ssr_quote && character.quote) ? 2 : 1 }} spacing="md">
                {character.ssr_quote && (
                  <QuoteCard
                    text={character.ssr_quote}
                    attribution={character.name}
                    label="Summon Quote"
                  />
                )}
                {character.quote && (
                  <QuoteCard
                    text={character.quote}
                    attribution={character.name}
                    label="In-Game Quote"
                  />
                )}
              </SimpleGrid>
            )}
          </Stack>
        </CollapsibleSectionCard>
      )}

      <CharacterReferenceSection
        character={character}
        teams={teams}
        enableNameBasedReferences={enableNameBasedReferences}
        selectedTierListName={selectedTierListName}
        tierLabel={tierLabel}
        tierListCharacterNote={tierListCharacterNote}
      />

      {/* Recommended Build */}
      {(recommendedGearDetails.length > 0 ||
        recommendedSubclassEntries.length > 0 ||
        linkedNoblePhantasm !== null) && (
        <CollapsibleSectionCard
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
            {linkedNoblePhantasm && (() => {
              const npIcon = getNoblePhantasmIcon(linkedNoblePhantasm.name);
              const topEffect = linkedNoblePhantasm.effects[0];
              return (
                <Stack gap="sm">
                  <Text fw={600} size="sm">
                    Recommended Noble Phantasm
                  </Text>
                  <Link
                    to={`/noble-phantasms/${toEntitySlug(linkedNoblePhantasm.name)}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Paper p="sm" radius="md" withBorder {...getCardHoverProps()}>
                      <Group gap="sm" wrap="nowrap">
                        {npIcon && (
                          <SafeImage
                            src={npIcon}
                            alt={linkedNoblePhantasm.name}
                            w={48}
                            h={48}
                            fit="contain"
                            loading="lazy"
                          />
                        )}
                        <Stack gap={2} style={{ minWidth: 0 }}>
                          <Text size="sm" fw={600} truncate>
                            {linkedNoblePhantasm.name}
                          </Text>
                          {topEffect && (
                            <ExpandableText size="xs">
                              <RichText text={topEffect.description} statusEffects={statusEffects} />
                            </ExpandableText>
                          )}
                        </Stack>
                      </Group>
                    </Paper>
                  </Link>
                </Stack>
              );
            })()}

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
                            <Badge
                              variant="light"
                              color={accent.primary}
                              size="xs"
                            >
                              Tier {entry.tier}
                            </Badge>
                          )}
                          {entry.className && (
                            <ClassTag
                              characterClass={entry.className}
                              size="xs"
                            />
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
                          <Text
                            size="xs"
                            c="dimmed"
                            style={{ lineHeight: 1.4 }}
                          >
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
                        maw={300}
                        styles={RICH_TOOLTIP_STYLES}
                        {...mobileTooltip}
                      >
                        <Paper
                          p="sm"
                          radius="md"
                          withBorder
                          {...getCardHoverProps()}
                        >
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
                                  <Badge
                                    variant="light"
                                    color={accent.primary}
                                    size="xs"
                                  >
                                    Tier {entry.tier}
                                  </Badge>
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
                        </Paper>
                      </Tooltip>
                    );
                  })}
                </SimpleGrid>
              </Stack>
            )}

            {recommendedGearDetails.length > 0 && (
              <Stack gap="xs">
                <Text fw={600} size="sm">
                  Recommended Gear
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                  {recommendedGearDetails.map((entry) => {
                    const entryQuality = toQuality(entry.quality);
                    const statsEntries = entry.stats
                      ? Object.entries(entry.stats).filter(
                          ([statName, statValue]) =>
                            Boolean(statName) &&
                            statValue !== null &&
                            statValue !== undefined
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
                            <Text
                              fw={700}
                              size="sm"
                              style={{ lineHeight: 1.25 }}
                            >
                              {entry.name}
                            </Text>
                            {(entry.setName || entry.quality) && (
                              <Group gap={4} wrap="wrap">
                                {entry.setName && (
                                  <Badge
                                    variant="light"
                                    color={accent.secondary}
                                    size="xs"
                                  >
                                    {entry.setName} Set
                                  </Badge>
                                )}
                                {entryQuality && (
                                  <QualityIcon
                                    quality={entryQuality}
                                    size={16}
                                  />
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
                        maw={340}
                        styles={RICH_TOOLTIP_STYLES}
                        {...mobileTooltip}
                      >
                        {entry.setName ? (
                          <Link
                            to={`/gear-sets/${toEntitySlug(entry.setName)}`}
                            style={{ textDecoration: 'none', width: '100%', display: 'block' }}
                          >
                            <Paper
                              p="sm"
                              radius="md"
                              withBorder
                              {...getCardHoverProps()}
                            >
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
                                  <Text size="xs" c="dimmed" truncate>
                                    {entry.setName} Set
                                  </Text>
                                </Stack>
                              </Group>
                            </Paper>
                          </Link>
                        ) : (
                          <Paper
                            p="sm"
                            radius="md"
                            withBorder
                            {...getCardHoverProps()}
                          >
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
                                {entry.setName && (
                                  <Text size="xs" c="dimmed" truncate>
                                    {entry.setName} Set
                                  </Text>
                                )}
                              </Stack>
                            </Group>
                          </Paper>
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
                          {setBonus.setName} Set
                        </Text>
                        <Divider />
                        <Group gap={6} wrap="wrap">
                          <Badge variant="light" color="gray" size="xs">
                            Pieces: {setBonus.pieces}/{setBonus.requiredPieces}
                          </Badge>
                          <Badge
                          variant="light"
                          color={accent.primary}
                          size="xs"
                          >
                          Activations: ×{setBonus.activations}
                          </Badge>                        </Group>
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
                        maw={320}
                        styles={RICH_TOOLTIP_STYLES}
                        {...mobileTooltip}
                      >
                        <Paper
                          p="sm"
                          radius="md"
                          withBorder
                          {...getCardHoverProps()}
                        >
                          <Stack gap={4}>
                            <Group justify="space-between" gap="xs">
                              <Text fw={600} size="sm" truncate>
                                {setBonus.setName}
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
                              <RichText text={setBonus.description} statusEffects={statusEffects} />
                            </ExpandableText>
                          </Stack>
                        </Paper>
                      </Tooltip>
                    );
                  })}
                </SimpleGrid>
              </Stack>
            )}
          </Stack>
        </CollapsibleSectionCard>
      )}
    </>
  );
}
