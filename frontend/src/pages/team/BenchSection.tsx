import {
  Badge,
  Box,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { IoInformationCircle } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import CharacterPortrait from '../../components/character/CharacterPortrait';
import ClassTag from '../../components/common/ClassTag';
import FactionTag from '../../components/common/FactionTag';
import QualityIcon from '../../components/common/QualityIcon';
import { getCardHoverProps } from '../../constants/styles';
import { useMobileTooltip } from '../../hooks';
import type { Character } from '../../types/character';
import type { TeamBenchMember } from '../../types/team';
import { resolveCharacterByNameAndQuality } from '../../utils/character-route';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryNote,
  getTeamBenchEntryQuality,
} from '../../utils/team-bench';

export function BenchSection({
  bench,
  charMap,
  characterByIdentity,
  getCharacterPath,
  factionColor,
  tooltipProps,
}: {
  bench: TeamBenchMember[];
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  getCharacterPath: (
    characterName: string,
    characterQuality?: string | null
  ) => string;
  factionColor: string;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
}) {
  return (
    <Stack gap="sm">
      <Group gap="sm">
        <Title order={3}>Bench</Title>
        <Badge variant="light" color={factionColor} size="sm">
          {bench.length}
        </Badge>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
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
          const resolvedLabel = char?.quality
            ? `${resolvedName} (${char.quality})`
            : resolvedName;
          const benchNote = getTeamBenchEntryNote(benchEntry);
          return (
            <Paper
              key={`${benchName}-${benchQuality ?? ''}`}
              p="sm"
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
                  <Tooltip
                    label={`View ${resolvedLabel}`}
                    {...tooltipProps}
                  >
                    <CharacterPortrait
                      name={resolvedName}
                      size={72}
                      quality={char?.quality}
                      borderWidth={3}
                      link
                      routePath={routePath}
                    />
                  </Tooltip>
                </Box>

                <Text
                  fw={700}
                  size="sm"
                  ta="center"
                  component={Link}
                  to={routePath}
                  c="violet"
                  style={{ textDecoration: 'none' }}
                  lineClamp={1}
                >
                  {resolvedName}
                </Text>

                {char && (
                  <Group gap={4} justify="center" wrap="nowrap">
                    <QualityIcon quality={char.quality} size={16} />
                    <ClassTag
                      characterClass={char.character_class}
                      size="xs"
                    />
                  </Group>
                )}

                {char && (
                  <Group gap={4} justify="center" wrap="wrap">
                    {char.factions.map((f) => (
                      <FactionTag key={f} faction={f} size="xs" />
                    ))}
                  </Group>
                )}

                {benchNote && (
                  <>
                    <Divider style={{ width: '100%' }} />
                    <Group gap={4} wrap="nowrap" align="flex-start">
                      <IoInformationCircle
                        size={12}
                        color="var(--mantine-color-dimmed)"
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <Text
                        size="xs"
                        c="dimmed"
                        fs="italic"
                        lh={1.4}
                        ta="center"
                      >
                        {benchNote}
                      </Text>
                    </Group>
                  </>
                )}
              </Stack>
            </Paper>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
