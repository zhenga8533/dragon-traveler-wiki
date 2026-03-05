import {
  Badge,
  Button,
  CopyButton,
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
import { IoCreate, IoTrash } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { FACTION_WYRM_MAP } from '../../assets/wyrms';
import FactionTag from '../../components/common/FactionTag';
import TeamCard from '../../components/teams/TeamCard';
import TeamCharacterAvatars from '../../components/teams/TeamCharacterAvatars';
import { normalizeContentType } from '../../constants/content-types';
import { getMinWidthStyle } from '../../constants/styles';
import type { Character } from '../../types/character';
import type { FactionName } from '../../types/faction';
import type { Team } from '../../types/team';
import { toEntitySlug } from '../../utils/entity-slug';
import { getTeamBenchEntryName, getTeamBenchEntryQuality } from '../../utils/team-bench';

interface TeamsSavedTabProps {
  savedTeams: Team[];
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  viewMode: string;
  onRequestEdit: (team: Team) => void;
  onRequestDelete: (name: string) => void;
  onGoToBuilder: () => void;
}

export default function TeamsSavedTab({
  savedTeams,
  charMap,
  characterByIdentity,
  viewMode,
  onRequestEdit,
  onRequestDelete,
  onGoToBuilder,
}: TeamsSavedTabProps) {
  const navigate = useNavigate();

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

  if (viewMode === 'grid') {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {savedTeams.map((team) => (
          <TeamCard
            key={team.name}
            team={team}
            charMap={charMap}
            characterByIdentity={characterByIdentity}
            onNavigate={() =>
              navigate(`/teams/saved/${toEntitySlug(team.name)}`)
            }
            actions={
              <>
                <Button
                  variant="subtle"
                  size="compact-xs"
                  color="violet"
                  leftSection={<IoCreate size={12} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestEdit(team);
                  }}
                >
                  Load
                </Button>
                <CopyButton value={JSON.stringify(team, null, 2)}>
                  {({ copy, copied }) => (
                    <Button
                      variant="subtle"
                      size="compact-xs"
                      color={copied ? 'teal' : 'gray'}
                      onClick={(e) => {
                        e.stopPropagation();
                        copy();
                      }}
                    >
                      {copied ? 'Copied!' : 'Copy JSON'}
                    </Button>
                  )}
                </CopyButton>
                <Button
                  variant="subtle"
                  size="compact-xs"
                  color="red"
                  leftSection={<IoTrash size={12} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDelete(team.name);
                  }}
                >
                  Delete
                </Button>
              </>
            }
          />
        ))}
      </SimpleGrid>
    );
  }

  return (
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
          {savedTeams.map((team) => (
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
                  <Text size="sm" fw={500} c="violet">
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
                        color="blue"
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
                  <Badge variant="light" size="sm">
                    {normalizeContentType(team.content_type, 'All')}
                  </Badge>
                )}
              </Table.Td>
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  <Button
                    variant="subtle"
                    size="compact-xs"
                    color="violet"
                    leftSection={<IoCreate size={12} />}
                    onClick={() => onRequestEdit(team)}
                  >
                    Load
                  </Button>
                  <CopyButton value={JSON.stringify(team, null, 2)}>
                    {({ copy, copied }) => (
                      <Button
                        variant="subtle"
                        size="compact-xs"
                        color={copied ? 'teal' : 'gray'}
                        onClick={copy}
                      >
                        {copied ? 'Copied!' : 'Copy JSON'}
                      </Button>
                    )}
                  </CopyButton>
                  <Button
                    variant="subtle"
                    size="compact-xs"
                    color="red"
                    leftSection={<IoTrash size={12} />}
                    onClick={() => onRequestDelete(team.name)}
                  >
                    Delete
                  </Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
