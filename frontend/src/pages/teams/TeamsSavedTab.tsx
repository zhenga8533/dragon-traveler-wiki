import {
  Badge,
  Button,
  Collapse,
  Divider,
  Group,
  Image,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useContext } from 'react';
import { IoCreate } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { FACTION_WYRM_MAP } from '../../assets/wyrms';
import EntityActionButtons from '../../components/common/EntityActionButtons';
import type { ChipFilterGroup } from '../../components/common/EntityFilter';
import EntityFilter from '../../components/common/EntityFilter';
import FactionTag from '../../components/common/FactionTag';
import NoResultsSuggestions from '../../components/common/NoResultsSuggestions';
import TeamCard from '../../components/teams/TeamCard';
import TeamCharacterAvatars from '../../components/teams/TeamCharacterAvatars';
import {
  getContentTypeColor,
  normalizeContentType,
} from '../../constants/content-types';
import { getMinWidthStyle } from '../../constants/styles';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../../contexts';
import type { Character } from '../../types/character';
import type { FactionName } from '../../types/faction';
import type { Team } from '../../types/team';
import { toEntitySlug } from '../../utils/entity-slug';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryQuality,
} from '../../utils/team-bench';

interface TeamsSavedTabProps {
  savedTeams: Team[];
  filteredSavedTeams: Team[];
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  viewMode: string;
  filterOpen: boolean;
  entityFilterGroups: ChipFilterGroup[];
  viewFilters: Record<string, string[]>;
  search: string;
  onFilterChange: (key: string, values: string[]) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  onRequestEdit: (team: Team) => void;
  onRequestDelete: (name: string) => void;
  onGoToBuilder: () => void;
}

export default function TeamsSavedTab({
  savedTeams,
  filteredSavedTeams,
  charMap,
  characterByIdentity,
  viewMode,
  filterOpen,
  entityFilterGroups,
  viewFilters,
  search,
  onFilterChange,
  onSearchChange,
  onClearFilters,
  onOpenFilters,
  onRequestEdit,
  onRequestDelete,
  onGoToBuilder,
}: TeamsSavedTabProps) {
  const navigate = useNavigate();
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];

  const filterPanel = (
    <Collapse in={filterOpen}>
      <Paper p="sm" radius="md" withBorder bg="var(--mantine-color-body)">
        <EntityFilter
          groups={entityFilterGroups}
          selected={viewFilters}
          onChange={(key, values) => onFilterChange(key, values)}
          onClear={onClearFilters}
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search saved teams..."
        />
      </Paper>
    </Collapse>
  );

  if (savedTeams.length === 0) {
    return (
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="sm">
          <Text c="dimmed">No saved teams yet.</Text>
          <Text size="xs" c="dimmed">
            Use the &ldquo;Create Your Own&rdquo; tab to build and save a team.
          </Text>
          <Button
            variant="light"
            color={accent.primary}
            size="sm"
            leftSection={<IoCreate size={16} />}
            onClick={onGoToBuilder}
          >
            Go to Builder
          </Button>
        </Stack>
      </Paper>
    );
  }

  const hasNoFilteredResults = filteredSavedTeams.length === 0;

  if (hasNoFilteredResults) {
    return (
      <>
        {filterPanel}

        <NoResultsSuggestions
          title={search ? 'No saved teams found' : 'No matching saved teams'}
          message={
            search
              ? 'No saved teams match your search.'
              : 'No saved teams match the current filters.'
          }
          onReset={onClearFilters}
          onOpenFilters={onOpenFilters}
        />
      </>
    );
  }

  if (viewMode === 'grid') {
    return (
      <>
        {filterPanel}

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {filteredSavedTeams.map((team) => (
            <TeamCard
              key={team.name}
              team={team}
              charMap={charMap}
              characterByIdentity={characterByIdentity}
              onNavigate={() =>
                navigate(`/teams/saved/${toEntitySlug(team.name)}`)
              }
              actions={
                <EntityActionButtons
                  onEdit={() => onRequestEdit(team)}
                  onDelete={() => onRequestDelete(team.name)}
                  size="compact-xs"
                  variant="subtle"
                  stopPropagation
                />
              }
            />
          ))}
        </SimpleGrid>
      </>
    );
  }

  return (
    <>
      {filterPanel}

      <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
        <Table striped highlightOnHover style={getMinWidthStyle(640)}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Members</Table.Th>
              <Table.Th>Faction</Table.Th>
              <Table.Th>Content Type</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredSavedTeams.map((team) => (
              <Table.Tr key={team.name}>
                <Table.Td>
                  <Group gap="sm" wrap="nowrap">
                    {FACTION_WYRM_MAP[team.faction as FactionName] && (
                      <Image
                        src={FACTION_WYRM_MAP[team.faction as FactionName]}
                        alt={`${team.faction} Whelp`}
                        w={28}
                        h={28}
                        fit="contain"
                      />
                    )}
                    <Text size="sm" fw={500} c={`${accent.primary}.7`}>
                      {team.name || 'Untitled'}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Paper
                    p="xs"
                    radius="sm"
                    bg="var(--mantine-color-default-hover)"
                  >
                    <Stack gap="xs">
                      <Group gap="xs" align="center" wrap="nowrap">
                        <Badge
                          size="xs"
                          variant="light"
                          color={accent.primary}
                          style={{ minWidth: 56, justifyContent: 'center' }}
                        >
                          Main
                        </Badge>
                        <TeamCharacterAvatars
                          refs={team.members.map((m) => ({
                            name: m.character_name,
                            quality: m.character_quality,
                          }))}
                          preferredByName={charMap}
                          byIdentity={characterByIdentity}
                          size={32}
                          maxVisible={5}
                        />
                      </Group>
                      {(team.bench?.length ?? 0) > 0 && (
                        <>
                          <Divider size="xs" />
                          <Group gap="xs" align="center" wrap="nowrap">
                            <Badge
                              size="xs"
                              variant="light"
                              color="gray"
                              style={{ minWidth: 56, justifyContent: 'center' }}
                            >
                              Subs
                            </Badge>
                            <TeamCharacterAvatars
                              refs={team.bench!.map((e) => ({
                                name: getTeamBenchEntryName(e),
                                quality: getTeamBenchEntryQuality(e),
                              }))}
                              preferredByName={charMap}
                              byIdentity={characterByIdentity}
                              size={32}
                              isSubstitute
                              maxVisible={5}
                            />
                          </Group>
                        </>
                      )}
                    </Stack>
                  </Paper>
                </Table.Td>
                <Table.Td>
                  {team.faction && (
                    <FactionTag
                      faction={team.faction as FactionName}
                      size="sm"
                    />
                  )}
                </Table.Td>
                <Table.Td>
                  {team.content_type && (
                    <Badge
                      variant="light"
                      size="sm"
                      color={getContentTypeColor(team.content_type, 'All')}
                    >
                      {normalizeContentType(team.content_type, 'All')}
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <EntityActionButtons
                      onEdit={() => onRequestEdit(team)}
                      onDelete={() => onRequestDelete(team.name)}
                      size="compact-xs"
                      variant="subtle"
                    />
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
}
