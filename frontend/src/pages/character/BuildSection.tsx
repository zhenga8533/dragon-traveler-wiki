import {
  Badge,
  Box,
  Center,
  Divider,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { RiDoubleQuotesL } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { getNoblePhantasmIcon } from '../../assets/noble_phantasm';
import ClassTag from '../../components/common/ClassTag';
import CollapsibleSectionCard from '../../components/common/CollapsibleSectionCard';
import GearTypeTag from '../../components/common/GearTypeTag';
import QualityIcon from '../../components/common/QualityIcon';
import RichText from '../../components/common/RichText';
import {
  getCardHoverProps,
  LINK_FIT_CONTENT_RESET_STYLE,
  RICH_TOOLTIP_STYLES,
} from '../../constants/styles';
import { IMAGE_SIZE } from '../../constants/ui';
import { useGradientAccent } from '../../hooks';
import type {
  ActivatedSetBonus,
  Character,
  RecommendedGearDetail,
  RecommendedSubclassEntry,
} from '../../types/character';
import type { NoblePhantasm } from '../../types/noble-phantasm';
import type { StatusEffect } from '../../types/status-effect';
import type { Team } from '../../types/team';
import { toEntitySlug } from '../../utils/entity-slug';
import { toQuality } from '../../utils/quality';
import CharacterReferenceSection from './CharacterReferenceSection.tsx';

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

  return (
    <>
      {/* Lore Section */}
      {character.lore && (
        <CollapsibleSectionCard
          header={
            <Stack gap={2}>
              <Title order={2} size="h3">
                About
              </Title>
              <Text size="sm" c="dimmed">
                Character lore, quote, origin, and noble phantasm details.
              </Text>
            </Stack>
          }
        >
          <Stack gap="md">
            <RichText
              text={character.lore}
              statusEffects={statusEffects}
              skills={character.skills}
              talent={character.talent ?? null}
              onSkillClick={scrollToSkill}
              onTalentClick={scrollToTalent}
              italic
              lineHeight={1.8}
            />

            {character.quote && (
              <Paper p="md" radius="md" withBorder {...getCardHoverProps()}>
                <Group gap="sm" align="flex-start" wrap="nowrap">
                  <Box
                    style={{
                      color: `var(--mantine-color-${accent.primary}-6)`,
                      fontSize: 28,
                      lineHeight: 1,
                      paddingTop: 2,
                    }}
                    aria-hidden="true"
                  >
                    <RiDoubleQuotesL />
                  </Box>
                  <Stack gap={4}>
                    <Text fs="italic" size="sm" style={{ lineHeight: 1.7 }}>
                      "{character.quote}"
                    </Text>
                    <Text size="xs" c="dimmed">
                      — {character.name}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            )}

            {character.origin && (
              <>
                <Divider />
                <div>
                  <Text fw={600} size="sm" mb="xs">
                    Origin
                  </Text>
                  <Text size="sm" c="dimmed">
                    {character.origin}
                  </Text>
                </div>
              </>
            )}

            {character.noble_phantasm && (
              <>
                <Divider />
                <div>
                  <Text fw={600} size="sm" mb="xs">
                    Noble Phantasm
                  </Text>
                  {linkedNoblePhantasm ? (
                    (() => {
                      const noblePhantasmIcon = getNoblePhantasmIcon(
                        linkedNoblePhantasm.name
                      );
                      return (
                        <Stack gap="xs">
                          <Link
                            to={`/noble-phantasms/${toEntitySlug(linkedNoblePhantasm.name)}`}
                            style={LINK_FIT_CONTENT_RESET_STYLE}
                          >
                            <Group gap="sm" wrap="nowrap">
                              {noblePhantasmIcon && (
                                <Box
                                  style={{
                                    width: IMAGE_SIZE.PORTRAIT_SM,
                                    height: IMAGE_SIZE.PORTRAIT_SM,
                                    borderRadius: 'var(--mantine-radius-sm)',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Image
                                    src={noblePhantasmIcon}
                                    alt={linkedNoblePhantasm.name}
                                    w={IMAGE_SIZE.PORTRAIT_SM}
                                    h={IMAGE_SIZE.PORTRAIT_SM}
                                    fit="cover"
                                    loading="lazy"
                                  />
                                </Box>
                              )}
                              <Badge
                                variant="light"
                                color={accent.primary}
                                size="lg"
                              >
                                {linkedNoblePhantasm.name}
                              </Badge>
                            </Group>
                          </Link>
                          {linkedNoblePhantasm.lore && (
                            <RichText
                              text={linkedNoblePhantasm.lore}
                              statusEffects={statusEffects}
                              skills={character.skills}
                              talent={character.talent ?? null}
                              onSkillClick={scrollToSkill}
                              onTalentClick={scrollToTalent}
                              color="dimmed"
                              italic
                              lineHeight={1.6}
                            />
                          )}
                        </Stack>
                      );
                    })()
                  ) : (
                    <Text size="sm">{character.noble_phantasm}</Text>
                  )}
                </div>
              </>
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
        recommendedSubclassEntries.length > 0) && (
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
                          <Text size="xs" style={{ lineHeight: 1.4 }}>
                            {entry.effect}
                          </Text>
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
                                <Image
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
                                <Text size="xs" c="dimmed" lineClamp={2}>
                                  Bonuses: {entry.bonuses.join(', ')}
                                </Text>
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
                          <Image
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
                              <Text size="xs" style={{ lineHeight: 1.35 }}>
                                {entry.setBonus.description}
                              </Text>
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
                            <Text size="xs" style={{ lineHeight: 1.35 }}>
                              {entry.lore}
                            </Text>
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
                      >
                        <Paper
                          p="sm"
                          radius="md"
                          withBorder
                          {...getCardHoverProps()}
                        >
                          <Group gap="sm" wrap="nowrap">
                            <Image
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
                          </Badge>
                        </Group>
                        <Stack gap={2}>
                          <Text size="xs" c="dimmed" fw={600}>
                            Effect
                          </Text>
                          <Text size="xs" style={{ lineHeight: 1.35 }}>
                            {setBonus.description}
                          </Text>
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
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              {setBonus.description}
                            </Text>
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
