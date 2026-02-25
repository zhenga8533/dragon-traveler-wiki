import {
  Badge,
  Box,
  Container,
  Group,
  Image,
  Paper,
  Stack,
  Table,
  Text,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { useMemo } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { Link, useParams } from 'react-router-dom';
import { getNoblePhantasmIcon } from '../assets/noble_phantasm';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import CharacterTag from '../components/character/CharacterTag';
import EntityNotFound from '../components/common/EntityNotFound';
import GlobalBadge from '../components/common/GlobalBadge';
import LastUpdated from '../components/common/LastUpdated';
import { DetailPageLoading } from '../components/layout/PageLoadingSkeleton';
import RichText from '../components/common/RichText';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character, Skill, Talent } from '../types/character';
import type {
  NoblePhantasm,
  NoblePhantasmEffect,
  NoblePhantasmSkill,
} from '../types/noble-phantasm';
import type { StatusEffect } from '../types/status-effect';

function EffectTable({
  effects,
  statusEffects,
  skills,
  talent,
}: {
  effects: NoblePhantasmEffect[];
  statusEffects: StatusEffect[];
  skills?: Skill[];
  talent?: Talent | null;
}) {
  if (effects.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No effect breakpoints recorded.
      </Text>
    );
  }

  return (
    <Table striped withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={120}>Tier</Table.Th>
          <Table.Th w={110}>Tier Level</Table.Th>
          <Table.Th>Description</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {effects.map((effect, idx) => (
          <Table.Tr
            key={`${effect.tier ?? 'none'}-${effect.tier_level ?? 'none'}-${idx}`}
          >
            <Table.Td>
              <Text size="sm" c={effect.tier ? undefined : 'dimmed'}>
                {effect.tier || '—'}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text
                size="sm"
                c={effect.tier_level !== null ? undefined : 'dimmed'}
              >
                {effect.tier_level ?? '—'}
              </Text>
            </Table.Td>
            <Table.Td>
              <RichText
                text={effect.description}
                statusEffects={statusEffects}
                skills={skills}
                talent={talent}
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function SkillTable({
  skills,
  statusEffects,
  characterSkills,
  talent,
}: {
  skills: NoblePhantasmSkill[];
  statusEffects: StatusEffect[];
  characterSkills?: Skill[];
  talent?: Talent | null;
}) {
  if (skills.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No skill levels recorded.
      </Text>
    );
  }

  return (
    <Table striped withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={90}>Level</Table.Th>
          <Table.Th w={120}>Tier</Table.Th>
          <Table.Th w={110}>Tier Level</Table.Th>
          <Table.Th>Description</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {skills.map((skill, idx) => (
          <Table.Tr key={`${skill.level}-${skill.tier ?? 'none'}-${idx}`}>
            <Table.Td>
              <Text size="sm" fw={600}>
                {skill.level}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm" c={skill.tier ? undefined : 'dimmed'}>
                {skill.tier || '—'}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text
                size="sm"
                c={skill.tier_level !== null ? undefined : 'dimmed'}
              >
                {skill.tier_level ?? '—'}
              </Text>
            </Table.Td>
            <Table.Td>
              <RichText
                text={skill.description}
                statusEffects={statusEffects}
                skills={characterSkills}
                talent={talent}
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

export default function NoblePhantasmPage() {
  const { name } = useParams<{ name: string }>();
  const isDark = useComputedColorScheme('light') === 'dark';

  const { data: noblePhantasms, loading } = useDataFetch<NoblePhantasm[]>(
    'data/noble_phantasm.json',
    []
  );
  const { data: characters } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );
  const { data: statusEffects } = useDataFetch<StatusEffect[]>(
    'data/status-effects.json',
    []
  );

  const noblePhantasm = useMemo(() => {
    if (!name) return null;
    const decodedName = decodeURIComponent(name);
    return noblePhantasms.find(
      (np) => np.name.toLowerCase() === decodedName.toLowerCase()
    );
  }, [name, noblePhantasms]);

  const linkedCharacter = useMemo(() => {
    if (!noblePhantasm?.character) return null;
    return characters.find(
      (c) => c.name.toLowerCase() === noblePhantasm.character!.toLowerCase()
    );
  }, [characters, noblePhantasm]);

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <DetailPageLoading />
      </Container>
    );
  }

  if (!noblePhantasm) {
    return (
      <EntityNotFound
        entityType="Noble Phantasm"
        name={name}
        backLabel="Back to Noble Phantasms"
        backPath="/noble-phantasms"
      />
    );
  }

  const iconSrc = getNoblePhantasmIcon(noblePhantasm.name);

  return (
    <Box>
      <Box
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--mantine-color-body)',
          margin:
            'calc(-1 * var(--mantine-spacing-md)) calc(-1 * var(--mantine-spacing-md)) 0',
          padding: 'var(--mantine-spacing-md) var(--mantine-spacing-md) 0',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? `radial-gradient(ellipse at 30% 20%, var(--mantine-color-grape-9) 0%, transparent 50%),
                 radial-gradient(ellipse at 70% 80%, var(--mantine-color-indigo-9) 0%, transparent 50%),
                 var(--mantine-color-dark-8)`
              : `radial-gradient(ellipse at 30% 20%, var(--mantine-color-grape-1) 0%, transparent 50%),
                 radial-gradient(ellipse at 70% 80%, var(--mantine-color-indigo-1) 0%, transparent 50%),
                 var(--mantine-color-gray-0)`,
            opacity: isDark ? 0.75 : 0.95,
          }}
        />

        <Container
          size="lg"
          style={{ position: 'relative', zIndex: 1 }}
          py="xl"
        >
          <Stack gap="lg">
            <Breadcrumbs
              items={[
                { label: 'Noble Phantasms', path: '/noble-phantasms' },
                { label: noblePhantasm.name },
              ]}
            />

            <Group gap="lg" align="flex-start" wrap="nowrap">
              {iconSrc && (
                <Box
                  style={{
                    width: 96,
                    height: 96,
                    flexShrink: 0,
                    borderRadius: 12,
                    background: isDark
                      ? 'rgba(0,0,0,0.3)'
                      : 'rgba(255,255,255,0.5)',
                    border: '3px solid var(--mantine-color-violet-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    src={iconSrc}
                    alt={noblePhantasm.name}
                    w={72}
                    h={72}
                    fit="contain"
                    radius="sm"
                  />
                </Box>
              )}

              <Stack gap={6} style={{ flex: 1 }}>
                <Title
                  order={1}
                  c={isDark ? 'white' : 'dark'}
                  style={{ lineHeight: 1.2 }}
                >
                  {noblePhantasm.name}
                </Title>
                <LastUpdated timestamp={noblePhantasm.last_updated ?? 0} />

                <Group gap="sm" mt={4}>
                  {noblePhantasm.character && (
                    <CharacterTag
                      name={noblePhantasm.character}
                      color="blue"
                      size="lg"
                    />
                  )}
                  <GlobalBadge isGlobal={noblePhantasm.is_global} size="md" />
                  <Badge size="lg" variant="outline" color="grape">
                    {noblePhantasm.effects.length} effect
                    {noblePhantasm.effects.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge size="lg" variant="outline" color="indigo">
                    {noblePhantasm.skills.length} skill
                    {noblePhantasm.skills.length !== 1 ? 's' : ''}
                  </Badge>
                </Group>
              </Stack>
            </Group>

            <Paper
              p="md"
              radius="md"
              style={{
                background: isDark
                  ? 'rgba(0,0,0,0.25)'
                  : 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(8px)',
                border: isDark
                  ? '1px solid rgba(255,255,255,0.06)'
                  : '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <RichText
                text={noblePhantasm.lore}
                statusEffects={statusEffects}
                skills={linkedCharacter?.skills}
                talent={linkedCharacter?.talent}
                italic
                lineHeight={1.6}
              />
            </Paper>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        <Stack gap="xl">
          <Stack gap="md">
            <Title order={3}>Effects</Title>
            <EffectTable
              effects={noblePhantasm.effects}
              statusEffects={statusEffects}
              skills={linkedCharacter?.skills}
              talent={linkedCharacter?.talent}
            />
          </Stack>

          <Stack gap="md">
            <Title order={3}>Skill Progression</Title>
            <SkillTable
              skills={noblePhantasm.skills}
              statusEffects={statusEffects}
              characterSkills={linkedCharacter?.skills}
              talent={linkedCharacter?.talent}
            />
          </Stack>
        </Stack>

        <Box mt="xl">
          <Link to="/noble-phantasms" style={{ textDecoration: 'none' }}>
            <Group gap="xs" c="violet" style={{ cursor: 'pointer' }}>
              <IoArrowBack />
              <Text>Back to Noble Phantasms</Text>
            </Group>
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
