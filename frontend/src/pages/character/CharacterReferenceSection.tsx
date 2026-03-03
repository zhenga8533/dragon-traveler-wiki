import {
  Badge,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import CollapsibleSectionCard from '../../components/common/CollapsibleSectionCard';
import { normalizeContentType } from '../../constants/content-types';
import { getCardHoverProps } from '../../constants/styles';
import type { Character } from '../../types/character';
import type { Team, TeamMemberPosition } from '../../types/team';
import { toEntitySlug } from '../../utils/entity-slug';

interface CharacterReferenceSectionProps {
  character: Character;
  teams: Team[];
  enableNameBasedReferences?: boolean;
  selectedTierListName: string;
  tierLabel: string | null;
  tierListCharacterNote: string | null;
}

interface TeamInclusion {
  teamName: string;
  role: 'Main' | 'Bench';
  faction: string;
  contentType: string;
  overdriveOrder: number | null;
  note: string | null;
  position: TeamMemberPosition | null;
}

const ROW_LABELS: Record<number, string> = {
  0: 'Front',
  1: 'Middle',
  2: 'Back',
};

const COL_LABELS: Record<number, string> = {
  0: 'Left',
  1: 'Center',
  2: 'Right',
};

function formatPosition(position: TeamMemberPosition | null): string | null {
  if (!position) return null;
  const row = ROW_LABELS[position.row] ?? `Row ${position.row + 1}`;
  const col = COL_LABELS[position.col] ?? `Col ${position.col + 1}`;
  return `${row} • ${col}`;
}

export default function CharacterReferenceSection({
  character,
  teams,
  enableNameBasedReferences = true,
  selectedTierListName,
  tierLabel,
  tierListCharacterNote,
}: CharacterReferenceSectionProps) {
  const teamInclusions = useMemo<TeamInclusion[]>(() => {
    if (!enableNameBasedReferences) {
      return [];
    }

    const name = character.name.toLowerCase();
    const results: TeamInclusion[] = [];

    for (const team of teams) {
      const member =
        team.members.find(
          (entry) => entry.character_name.toLowerCase() === name
        ) ?? null;

      if (member) {
        results.push({
          teamName: team.name,
          role: 'Main',
          faction: team.faction,
          contentType: normalizeContentType(team.content_type, 'All'),
          overdriveOrder: member.overdrive_order,
          note: member.note?.trim() || null,
          position: member.position ?? null,
        });
      }

      const benchName =
        team.bench?.find((entry) => entry.toLowerCase() === name) ?? null;

      if (!benchName) {
        continue;
      }

      const benchNote =
        Object.entries(team.bench_notes ?? {}).find(
          ([key]) => key.toLowerCase() === benchName.toLowerCase()
        )?.[1] ?? null;

      results.push({
        teamName: team.name,
        role: 'Bench',
        faction: team.faction,
        contentType: normalizeContentType(team.content_type, 'All'),
        overdriveOrder: null,
        note: benchNote?.trim() || null,
        position: null,
      });
    }

    return results.sort((a, b) => {
      if (a.role !== b.role) {
        return a.role === 'Main' ? -1 : 1;
      }
      return a.teamName.localeCompare(b.teamName);
    });
  }, [character.name, enableNameBasedReferences, teams]);

  const hasTierContext =
    Boolean(selectedTierListName) &&
    Boolean(tierLabel) &&
    Boolean(tierListCharacterNote);
  const hasTeamContext = teamInclusions.length > 0;

  if (!hasTierContext && !hasTeamContext) {
    return null;
  }

  return (
    <CollapsibleSectionCard
      header={
        <Stack gap={2}>
          <Title order={2} size="h3">
            Character Usage
          </Title>
          <Text size="sm" c="dimmed">
            Quick reference from tier list notes and saved team examples.
          </Text>
        </Stack>
      }
    >
      <Stack gap="md">
        {hasTierContext && (
          <Paper p="sm" radius="md" withBorder {...getCardHoverProps()}>
            <Stack gap={6}>
              <Group gap="xs" wrap="wrap">
                <Text fw={600} size="sm">
                  Tier List Note
                </Text>
                <Badge variant="light" color="violet" size="sm">
                  {selectedTierListName}
                </Badge>
                {tierLabel && (
                  <Badge variant="light" color="grape" size="sm">
                    {tierLabel === 'Unranked' ? tierLabel : `Tier ${tierLabel}`}
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                {tierListCharacterNote}
              </Text>
            </Stack>
          </Paper>
        )}

        {hasTeamContext && (
          <Stack gap="sm">
            <Text fw={600} size="sm">
              Included in Teams ({teamInclusions.length})
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {teamInclusions.map((entry) => {
                const placement = formatPosition(entry.position);

                return (
                  <Paper
                    key={`${entry.teamName}-${entry.role}`}
                    p="sm"
                    radius="md"
                    withBorder
                    {...getCardHoverProps()}
                  >
                    <Stack gap={6}>
                      <Group
                        justify="space-between"
                        align="flex-start"
                        gap="xs"
                      >
                        <Link
                          to={`/teams/${toEntitySlug(entry.teamName)}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <Text fw={600} size="sm">
                            {entry.teamName}
                          </Text>
                        </Link>
                        <Badge
                          variant="light"
                          color={entry.role === 'Main' ? 'blue' : 'gray'}
                          size="xs"
                        >
                          {entry.role}
                        </Badge>
                      </Group>

                      <Group gap={6} wrap="wrap">
                        <Badge variant="light" color="violet" size="xs">
                          {entry.faction}
                        </Badge>
                        <Badge variant="light" color="indigo" size="xs">
                          {entry.contentType}
                        </Badge>
                      </Group>

                      {(placement || entry.overdriveOrder != null) && (
                        <Text size="xs" c="dimmed">
                          {placement ? `Position: ${placement}` : null}
                          {placement && entry.overdriveOrder != null
                            ? ' • '
                            : null}
                          {entry.overdriveOrder != null
                            ? `Overdrive: #${entry.overdriveOrder}`
                            : null}
                        </Text>
                      )}

                      {entry.note && (
                        <Text size="xs" c="dimmed" style={{ lineHeight: 1.5 }}>
                          {entry.note}
                        </Text>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Stack>
        )}
      </Stack>
    </CollapsibleSectionCard>
  );
}
