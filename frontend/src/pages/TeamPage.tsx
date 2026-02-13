import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMemo } from 'react';
import { IoArrowBack, IoCreate, IoInformationCircle } from 'react-icons/io5';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPortrait } from '../assets/character';
import { FACTION_ICON_MAP } from '../assets/faction';
import { FACTION_WYRM_MAP } from '../assets/wyrms';
import Breadcrumbs from '../components/Breadcrumbs';
import { QUALITY_BORDER_COLOR } from '../components/CharacterCard';
import { DetailPageLoading } from '../components/PageLoadingSkeleton';
import WyrmspellCard from '../components/WyrmspellCard';
import { FACTION_COLOR } from '../constants/colors';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';
import type { Team, TeamMember } from '../types/team';
import type { Wyrmspell } from '../types/wyrmspell';

export default function TeamPage() {
  const { teamName } = useParams<{ teamName: string }>();
  const navigate = useNavigate();

  const { data: teams, loading: loadingTeams } = useDataFetch<Team[]>(
    'data/teams.json',
    []
  );
  const { data: characters, loading: loadingChars } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );
  const { data: wyrmspells, loading: loadingSpells } = useDataFetch<
    Wyrmspell[]
  >('data/wyrmspells.json', []);

  const loading = loadingTeams || loadingChars || loadingSpells;

  const team = useMemo(() => {
    if (!teamName) return null;
    return teams.find((t) => t.name === decodeURIComponent(teamName));
  }, [teams, teamName]);

  const charMap = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) map.set(c.name, c);
    return map;
  }, [characters]);

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <DetailPageLoading />
      </Container>
    );
  }

  if (!team) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <Text size="xl" fw={500}>
            Team not found
          </Text>
          <Button
            onClick={() => navigate('/teams')}
            leftSection={<IoArrowBack />}
          >
            Back to Teams
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <Breadcrumbs
            items={[{ label: 'Teams', path: '/teams' }, { label: team.name }]}
          />
          <Button
            variant="light"
            leftSection={<IoCreate size={14} />}
            onClick={() => {
              navigate('/teams', { state: { editTeam: team } });
            }}
          >
            Edit Team
          </Button>
        </Group>

        {/* Team Header */}
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <Group gap="md" align="flex-start">
                <Image
                  src={FACTION_WYRM_MAP[team.faction]}
                  alt={`${team.faction} Whelp`}
                  w={64}
                  h={64}
                  fit="contain"
                />
                <div>
                  <Title order={1}>{team.name}</Title>
                  <Text c="dimmed" size="sm">
                    by {team.author}
                  </Text>
                </div>
              </Group>
              <Group gap="sm">
                <Badge
                  size="lg"
                  variant="light"
                  color={FACTION_COLOR[team.faction]}
                  leftSection={
                    <Image
                      src={FACTION_ICON_MAP[team.faction]}
                      alt={team.faction}
                      w={16}
                      h={16}
                      fit="contain"
                    />
                  }
                >
                  {team.faction}
                </Badge>
                <Badge size="lg" variant="outline">
                  {team.content_type}
                </Badge>
              </Group>
            </Group>

            <Divider />

            <Text>{team.description}</Text>
          </Stack>
        </Paper>

        {/* Wyrmspells Section */}
        {team.wyrmspells && (
          <Paper p="lg" radius="md" withBorder>
            <Stack gap="md">
              <Title order={3}>Wyrmspells</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                {team.wyrmspells.breach && (
                  <WyrmspellCard
                    name={team.wyrmspells.breach}
                    type="Breach"
                    wyrmspells={wyrmspells}
                  />
                )}
                {team.wyrmspells.refuge && (
                  <WyrmspellCard
                    name={team.wyrmspells.refuge}
                    type="Refuge"
                    wyrmspells={wyrmspells}
                  />
                )}
                {team.wyrmspells.wildcry && (
                  <WyrmspellCard
                    name={team.wyrmspells.wildcry}
                    type="Wildcry"
                    wyrmspells={wyrmspells}
                  />
                )}
                {team.wyrmspells.dragons_call && (
                  <WyrmspellCard
                    name={team.wyrmspells.dragons_call}
                    type="Dragon's Call"
                    wyrmspells={wyrmspells}
                  />
                )}
              </SimpleGrid>
            </Stack>
          </Paper>
        )}

        {/* Team Members */}
        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Team Composition</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {team.members.map((member, index) => (
                <TeamMemberCard key={index} member={member} charMap={charMap} />
              ))}
            </SimpleGrid>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

function TeamMemberCard({
  member,
  charMap,
}: {
  member: TeamMember;
  charMap: Map<string, Character>;
}) {
  const character = charMap.get(member.character_name);
  const borderColor = character
    ? QUALITY_BORDER_COLOR[character.quality]
    : 'var(--mantine-color-gray-5)';

  return (
    <Paper p="md" withBorder>
      <Stack gap="md" align="center">
        <Box pos="relative">
          <Image
            src={getPortrait(member.character_name)}
            alt={member.character_name}
            h={120}
            w={120}
            fit="cover"
            radius="50%"
            style={{
              border: `4px solid ${borderColor}`,
            }}
          />
          {member.overdrive_order && (
            <Badge
              size="lg"
              circle
              variant="filled"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
              }}
            >
              {member.overdrive_order}
            </Badge>
          )}
        </Box>

        <Stack gap={4} align="center" w="100%">
          <Text
            fw={600}
            ta="center"
            component={Link}
            to={`/characters/${encodeURIComponent(member.character_name)}`}
            c="violet"
            style={{ textDecoration: 'none' }}
          >
            {member.character_name}
          </Text>
          {character && (
            <Group gap={4}>
              <Badge size="sm" variant="light">
                {character.quality}
              </Badge>
              <Badge size="sm" variant="outline">
                {character.character_class}
              </Badge>
            </Group>
          )}

          {member.overdrive_order && (
            <Text size="xs" c="dimmed">
              Overdrive #{member.overdrive_order}
            </Text>
          )}

          {member.substitutes && member.substitutes.length > 0 && (
            <>
              <Divider w="100%" mt="xs" />
              <Text size="xs" c="dimmed" fw={500}>
                Substitutes:
              </Text>
              <Stack gap={4} w="100%">
                {member.substitutes.map((sub, idx) => (
                  <Group key={idx} gap="xs" justify="center">
                    <Image
                      src={getPortrait(sub)}
                      alt={sub}
                      h={32}
                      w={32}
                      fit="cover"
                      radius="50%"
                      style={{
                        border: `2px solid ${charMap.get(sub) ? QUALITY_BORDER_COLOR[charMap.get(sub)!.quality] : 'var(--mantine-color-gray-5)'}`,
                      }}
                    />
                    <Text
                      size="xs"
                      component={Link}
                      to={`/characters/${encodeURIComponent(sub)}`}
                      c="violet"
                      style={{ textDecoration: 'none' }}
                    >
                      {sub}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </>
          )}

          {member.note && (
            <>
              <Divider w="100%" mt="xs" />
              <Group gap={6} wrap="nowrap" align="flex-start">
                <IoInformationCircle
                  size={14}
                  color="var(--mantine-color-dimmed)"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <Text size="xs" c="dimmed" fs="italic" lh={1.4}>
                  {member.note}
                </Text>
              </Group>
            </>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
