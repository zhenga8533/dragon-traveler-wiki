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
import { useParams } from 'react-router-dom';
import { getNoblePhantasmIcon } from '../assets/noble_phantasm';
import CharacterTag from '../components/character/CharacterTag';
import DetailPageNavigation from '../components/common/DetailPageNavigation';
import EntityNotFound from '../components/common/EntityNotFound';
import GlobalBadge from '../components/common/GlobalBadge';
import LastUpdated from '../components/common/LastUpdated';
import RichText from '../components/common/RichText';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { DetailPageLoading } from '../components/layout/PageLoadingSkeleton';
import { getLoreGlassStyles } from '../constants/glass';
import {
  DETAIL_HERO_WRAPPER_STYLES,
  getCardHoverProps,
  getDetailHeroGradient,
  getHeroIconBoxStyles,
} from '../constants/styles';
import { useDataFetch } from '../hooks';
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

  // Match list page: sort by character, then name
  const orderedNoblePhantasms = useMemo(
    () =>
      [...noblePhantasms].sort((a, b) => {
        const charCmp = (a.character ?? '').localeCompare(b.character ?? '');
        if (charCmp !== 0) return charCmp;
        return a.name.localeCompare(b.name);
      }),
    [noblePhantasms]
  );

  const noblePhantasmIndex = useMemo(() => {
    if (!noblePhantasm) return -1;
    return orderedNoblePhantasms.findIndex(
      (entry) => entry.name.toLowerCase() === noblePhantasm.name.toLowerCase()
    );
  }, [noblePhantasm, orderedNoblePhantasms]);

  const previousNoblePhantasm =
    noblePhantasmIndex > 0
      ? orderedNoblePhantasms[noblePhantasmIndex - 1]
      : null;
  const nextNoblePhantasm =
    noblePhantasmIndex >= 0 &&
    noblePhantasmIndex < orderedNoblePhantasms.length - 1
      ? orderedNoblePhantasms[noblePhantasmIndex + 1]
      : null;

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
      <Box style={DETAIL_HERO_WRAPPER_STYLES}>
        <Box
          style={getDetailHeroGradient(isDark, 'grape', 'indigo', {
            dark: 0.75,
            light: 0.95,
          })}
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
                <Box style={getHeroIconBoxStyles(isDark, 'violet')}>
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
              withBorder
              {...getCardHoverProps({ style: getLoreGlassStyles(isDark) })}
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

        <DetailPageNavigation
          previousItem={
            previousNoblePhantasm
              ? {
                  label: previousNoblePhantasm.name,
                  path: `/noble-phantasms/${encodeURIComponent(previousNoblePhantasm.name)}`,
                }
              : null
          }
          nextItem={
            nextNoblePhantasm
              ? {
                  label: nextNoblePhantasm.name,
                  path: `/noble-phantasms/${encodeURIComponent(nextNoblePhantasm.name)}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
