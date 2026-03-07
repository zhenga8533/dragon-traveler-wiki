import {
  Badge,
  Box,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import CharacterPortrait from '../../components/character/CharacterPortrait';
import ClassTag from '../../components/common/ClassTag';
import FactionTag from '../../components/common/FactionTag';
import NoteTooltipIcon from '../../components/common/NoteTooltipIcon';
import QualityIcon from '../../components/common/QualityIcon';
import { getCardHoverProps } from '../../constants/styles';
import { useGradientAccent, useMobileTooltip } from '../../hooks';
import type { Character } from '../../types/character';
import type { TeamBenchMember } from '../../types/team';
import {
  getCharacterBaseSlug,
  resolveCharacterByNameAndQuality,
} from '../../utils/character-route';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryNote,
  getTeamBenchEntryQuality,
} from '../../utils/team-bench';

export function BenchSection({
  bench,
  charMap,
  characterByIdentity,
  characterNameCounts,
  getCharacterPath,
  factionColor,
  tooltipProps,
}: {
  bench: TeamBenchMember[];
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  characterNameCounts: Map<string, number>;
  getCharacterPath: (
    characterName: string,
    characterQuality?: string | null
  ) => string;
  factionColor: string;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
}) {
  const isMobile = useMediaQuery('(max-width: 30em)');
  const { accent } = useGradientAccent();

  return (
    <Stack gap={isMobile ? 'xs' : 'sm'}>
      <Group gap="sm">
        <Title order={3}>Bench</Title>
        <Badge variant="light" color={accent.secondary} size="sm">
          {bench.length}
        </Badge>
      </Group>
      <SimpleGrid
        cols={{ base: 1, xs: 2, sm: 3, md: 4 }}
        spacing={{ base: 'xs', sm: 'sm' }}
        data-export-cols-desktop="4"
      >
        {bench.map((benchEntry) => {
          const benchName = getTeamBenchEntryName(benchEntry);
          const benchQuality = getTeamBenchEntryQuality(benchEntry);
          const char = resolveCharacterByNameAndQuality(
            benchName,
            benchQuality,
            charMap,
            characterByIdentity
          );
          const routePath = getCharacterPath(benchName, benchQuality);
          const resolvedName = char?.name ?? benchName;
          const isMultiQualityCharacter =
            (characterNameCounts.get(getCharacterBaseSlug(resolvedName)) ?? 1) >
            1;
          const resolvedLabel =
            isMultiQualityCharacter && char?.quality
              ? `${resolvedName} (${char.quality})`
              : resolvedName;
          const benchNote = getTeamBenchEntryNote(benchEntry);
          return (
            <Paper
              key={`${benchName}-${benchQuality ?? ''}`}
              p={isMobile ? 'xs' : 'sm'}
              radius="md"
              withBorder
              {...getCardHoverProps({
                style: {
                  borderTop: `3px solid var(--mantine-color-${factionColor}-5)`,
                },
              })}
            >
              <Stack gap={6} align="center">
                <Box pos="relative">
                  <Tooltip label={`View ${resolvedLabel}`} {...tooltipProps}>
                    <CharacterPortrait
                      name={resolvedName}
                      size={isMobile ? 64 : 72}
                      quality={char?.quality}
                      borderWidth={3}
                      link
                      routePath={routePath}
                    />
                  </Tooltip>
                  {benchNote && (
                    <NoteTooltipIcon
                      note={benchNote}
                      ariaLabel={`Show note for ${resolvedName}`}
                      stopPropagation
                      wrapperStyle={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                      }}
                    />
                  )}
                </Box>

                <Text
                  fw={700}
                  size={isMobile ? 'xs' : 'sm'}
                  ta="center"
                  component={Link}
                  to={routePath}
                  c={`${accent.primary}.7`}
                  style={{ textDecoration: 'none' }}
                  lineClamp={1}
                >
                  {resolvedLabel}
                </Text>

                {char && (
                  <Group gap={4} justify="center" wrap="nowrap">
                    <QualityIcon
                      quality={char.quality}
                      size={isMobile ? 14 : 16}
                    />
                    <ClassTag characterClass={char.character_class} size="xs" />
                  </Group>
                )}

                {char && (
                  <Group gap={4} justify="center" wrap="wrap">
                    {char.factions.map((f) => (
                      <FactionTag key={f} faction={f} size="xs" />
                    ))}
                  </Group>
                )}
              </Stack>
            </Paper>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
