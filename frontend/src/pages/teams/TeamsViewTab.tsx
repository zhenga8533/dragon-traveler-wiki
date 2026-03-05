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
import { IoCreate } from 'react-icons/io5';
import { Link, useNavigate } from 'react-router-dom';
import { FACTION_WYRM_MAP } from '../../assets/wyrms';
import type { ChipFilterGroup } from '../../components/common/EntityFilter';
import EntityFilter from '../../components/common/EntityFilter';
import FactionTag from '../../components/common/FactionTag';
import NoResultsSuggestions from '../../components/common/NoResultsSuggestions';
import PaginationControl from '../../components/common/PaginationControl';
import TeamCard from '../../components/teams/TeamCard';
import TeamCharacterAvatars from '../../components/teams/TeamCharacterAvatars';
import { normalizeContentType } from '../../constants/content-types';
import { getMinWidthStyle } from '../../constants/styles';
import type { Character } from '../../types/character';
import type { FactionName } from '../../types/faction';
import type { Team } from '../../types/team';
import { getTeamBenchEntryName, getTeamBenchEntryQuality } from '../../utils/team-bench';
import { toEntitySlug } from '../../utils/entity-slug';

interface TeamsViewTabProps {
  paginatedTeams: Team[];
  filteredTeams: Team[];
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
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRequestEdit: (team: Team) => void;
}

export default function TeamsViewTab({
  paginatedTeams,
  filteredTeams,
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
  page,
  totalPages,
  onPageChange,
  onRequestEdit,
}: TeamsViewTabProps) {
  const navigate = useNavigate();

  return (
    <>
      <Collapse in={filterOpen}>
        <Paper p="sm" radius="md" withBorder bg="var(--mantine-color-body)">
          <EntityFilter
            groups={entityFilterGroups}
            selected={viewFilters}
            onChange={(key, values) => onFilterChange(key, values)}
            onClear={onClearFilters}
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search teams..."
          />
        </Paper>
      </Collapse>

      {filteredTeams.length === 0 && (
        <NoResultsSuggestions
          title={search ? 'No teams found' : 'No matching teams'}
          message={
            search
              ? 'No teams match your search.'
              : 'No teams match the current filters.'
          }
          onReset={onClearFilters}
          onOpenFilters={onOpenFilters}
        />
      )}

      {viewMode === 'grid' ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {paginatedTeams.map((team) => (
            <TeamCard
              key={team.name}
              team={team}
              charMap={charMap}
              characterByIdentity={characterByIdentity}
              onNavigate={() => navigate(`/teams/${toEntitySlug(team.name)}`)}
              actions={
                <Button
                  variant="subtle"
                  size="compact-xs"
                  color="violet"
                  leftSection={<IoCreate size={12} />}
                  style={{ flexShrink: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestEdit(team);
                  }}
                >
                  Edit
                </Button>
              }
            />
          ))}
        </SimpleGrid>
      ) : (
        <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
          <Table striped highlightOnHover style={getMinWidthStyle(640)}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Members</Table.Th>
                <Table.Th>Faction</Table.Th>
                <Table.Th>Content Type</Table.Th>
                <Table.Th>Author</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedTeams.map((team) => {
                return (
                  <Table.Tr
                    key={team.name}
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      navigate(`/teams/${toEntitySlug(team.name)}`)
                    }
                  >
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Image
                          src={
                            FACTION_WYRM_MAP[team.faction as FactionName]
                          }
                          alt={`${team.faction} Whelp`}
                          w={28}
                          h={28}
                          fit="contain"
                        />
                        <Text
                          component={Link}
                          to={`/teams/${toEntitySlug(team.name)}`}
                          size="sm"
                          fw={500}
                          c="violet"
                          style={{ textDecoration: 'none' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {team.name}
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
                              color="blue"
                              style={{
                                minWidth: 56,
                                justifyContent: 'center',
                              }}
                            >
                              Main
                            </Badge>
                            <TeamCharacterAvatars
                              refs={team.members.map((member) => ({
                                name: member.character_name,
                                quality: member.character_quality,
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
                                  style={{
                                    minWidth: 56,
                                    justifyContent: 'center',
                                  }}
                                >
                                  Subs
                                </Badge>
                                <TeamCharacterAvatars
                                  refs={team.bench!.map((entry) => ({
                                    name: getTeamBenchEntryName(entry),
                                    quality: getTeamBenchEntryQuality(entry),
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
                      <FactionTag
                        faction={team.faction as FactionName}
                        size="sm"
                      />
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {normalizeContentType(team.content_type, 'All')}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="violet">
                        {team.author}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}

      <PaginationControl
        currentPage={page}
        totalPages={totalPages}
        onChange={onPageChange}
      />
    </>
  );
}
