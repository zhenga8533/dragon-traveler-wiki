import ClassTag from '@/components/ui/ClassTag';
import FactionTag from '@/components/ui/FactionTag';
import NoteTooltipIcon from '@/components/ui/NoteTooltipIcon';
import QualityIcon from '@/components/ui/QualityIcon';
import { getCardHoverProps } from '@/constants/styles';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import type { Character } from '@/features/characters/types';
import {
  resolveCharacterByNameAndQuality,
} from '@/features/characters/utils/character-route';
import type { TeamBenchMember } from '@/features/teams/types';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryNote,
  getTeamBenchEntryQuality,
} from '@/features/teams/utils/team-bench';
import { useGradientAccent, useIsMobile, useMobileTooltip } from '@/hooks';
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
import { Link } from 'react-router-dom';

export function BenchSection({
  bench,
  title = 'Bench',
  charMap,
  characterByIdentity,
  getCharacterPath,
  factionColor,
  tooltipProps,
  disableNameClamp = false,
  desktopMode = false,
}: {
  bench: TeamBenchMember[];
  title?: string;
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  getCharacterPath: (
    characterName: string,
    characterQuality?: string | null
  ) => string;
  factionColor: string;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
  disableNameClamp?: boolean;
  desktopMode?: boolean;
}) {
  const isMobile = useIsMobile() && !desktopMode;
  const { accent } = useGradientAccent();

  return (
    <Stack gap={isMobile ? 'xs' : 'sm'}>
      <Group gap="sm">
        <Title order={3}>{title}</Title>
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
                  <Tooltip label={`View ${resolvedName}`} {...tooltipProps}>
                    <CharacterPortrait
                      name={resolvedName}
                      size={isMobile ? 64 : 72}
                      quality={char?.quality}
                      borderWidth={3}
                      link
                      routePath={routePath}
                      fallbackSrc={char === null ? `https://placehold.co/${isMobile ? 64 : 72}x${isMobile ? 64 : 72}?text=?` : undefined}
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
                  style={{
                    textDecoration: 'none',
                    width: '100%',
                    whiteSpace: disableNameClamp ? 'normal' : undefined,
                  }}
                  lineClamp={disableNameClamp ? undefined : 1}
                >
                  {resolvedName}
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
