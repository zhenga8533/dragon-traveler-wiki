import {
  Badge,
  Box,
  Breadcrumbs,
  Card,
  Center,
  Container,
  Divider,
  Grid,
  Group,
  Image,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { Link, useParams } from 'react-router-dom';
import { getIllustrations, getPortrait, type CharacterIllustration } from '../assets/character';
import { CLASS_ICON_MAP } from '../assets/class';
import { FACTION_ICON_MAP } from '../assets/faction';
import { QUALITY_ICON_MAP } from '../assets/character_quality';
import { QUALITY_COLOR } from '../constants/colors';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';
import type { StatusEffect } from '../types/status-effect';
import RichText from '../components/RichText';
import { getSkillIcon } from '../assets/skill';
import { getSubclassIcon } from '../assets/subclass';

export default function CharacterPage() {
  const { name } = useParams<{ name: string }>();
  const { data: characters, loading } = useDataFetch<Character[]>('data/characters.json', []);
  const { data: statusEffects } = useDataFetch<StatusEffect[]>('data/status-effects.json', []);

  const character = useMemo(() => {
    if (!name) return null;
    const decodedName = decodeURIComponent(name);
    return characters.find(
      (c) => c.name.toLowerCase() === decodedName.toLowerCase()
    );
  }, [characters, name]);

  const illustrations = useMemo(() => {
    if (!character) return [];
    return getIllustrations(character.name);
  }, [character]);

  const defaultIllustration = useMemo(() => {
    return illustrations.find((i) => i.name === 'default') || illustrations[0];
  }, [illustrations]);

  const [selectedIllustration, setSelectedIllustration] = useState<CharacterIllustration | null>(null);

  // Set default illustration when loaded
  useMemo(() => {
    if (illustrations.length > 0 && !selectedIllustration) {
      setSelectedIllustration(defaultIllustration);
    }
  }, [illustrations, selectedIllustration, defaultIllustration]);

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!character) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <Title order={2}>Character Not Found</Title>
          <Text c="dimmed">The character "{name}" could not be found.</Text>
          <Link to="/characters">
            <Group gap="xs">
              <IoArrowBack />
              <Text>Back to Characters</Text>
            </Group>
          </Link>
        </Stack>
      </Container>
    );
  }

  const portrait = getPortrait(character.name);
  const currentIllustration = selectedIllustration || defaultIllustration;

  return (
    <Box>
      {/* Hero Section with Blurred Background */}
      <Box
        style={{
          position: 'relative',
          minHeight: 350,
          overflow: 'hidden',
          background: 'var(--mantine-color-dark-8)',
        }}
      >
        {/* Blurred background layer using default illustration */}
        {defaultIllustration && (
          <Box
            style={{
              position: 'absolute',
              inset: -20,
              backgroundImage: `url(${defaultIllustration.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px) brightness(0.4)',
              transform: 'scale(1.1)',
            }}
          />
        )}

        {/* Content overlay */}
        <Container size="lg" style={{ position: 'relative', zIndex: 1 }} py="xl">
          <Grid gutter="xl" align="center">
            {/* Portrait */}
            <Grid.Col span={{ base: 12, sm: 'content' }}>
              <Center>
                <Box
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    border: `4px solid var(--mantine-color-${QUALITY_COLOR[character.quality]}-5)`,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  <Image
                    src={portrait}
                    alt={character.name}
                    w={180}
                    h={180}
                    fit="cover"
                    fallbackSrc="https://placehold.co/180x180?text=?"
                  />
                </Box>
              </Center>
            </Grid.Col>

            {/* Character Info */}
            <Grid.Col span={{ base: 12, sm: 'auto' }}>
              <Stack gap="sm">
                <Breadcrumbs>
                  <Link to="/characters" style={{ textDecoration: 'none' }}>
                    <Text size="sm" c="gray.4">Characters</Text>
                  </Link>
                  <Text size="sm" c="white">{character.name}</Text>
                </Breadcrumbs>

                <Group gap="md" align="center">
                  <Title order={1} c="white">{character.name}</Title>
                  {!character.is_global && (
                    <Badge variant="light" color="orange" size="lg">CN Only</Badge>
                  )}
                </Group>

                <Group gap="lg">
                  <Tooltip label={character.quality}>
                    <Group gap={6}>
                      <Image
                        src={QUALITY_ICON_MAP[character.quality]}
                        alt={character.quality}
                        h={24}
                        w="auto"
                        fit="contain"
                      />
                      <Text fw={500} c="white">{character.quality}</Text>
                    </Group>
                  </Tooltip>

                  <Tooltip label={character.character_class}>
                    <Group gap={6}>
                      <Image src={CLASS_ICON_MAP[character.character_class]} alt={character.character_class} w={24} h={24} />
                      <Text fw={500} c="white">{character.character_class}</Text>
                    </Group>
                  </Tooltip>
                </Group>

                <Group gap="sm">
                  {character.factions.map((faction) => (
                    <Badge
                      key={faction}
                      variant="light"
                      size="lg"
                      leftSection={
                        <Image src={FACTION_ICON_MAP[faction]} alt={faction} w={16} h={16} />
                      }
                    >
                      {faction}
                    </Badge>
                  ))}
                </Group>

                {(character.height || character.weight) && (
                  <Group gap="md">
                    {character.height && <Text size="sm" c="gray.4">Height: {character.height}</Text>}
                    {character.weight && <Text size="sm" c="gray.4">Weight: {character.weight}</Text>}
                  </Group>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>

        {/* Gradient overlay at bottom */}
        <Box
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, var(--mantine-color-body))',
            height: 100,
            pointerEvents: 'none',
          }}
        />
      </Box>

      {/* Main Content */}
      <Container size="lg" py="xl">
        <Grid gutter="xl">
          {/* Left Column - Illustrations */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            {illustrations.length > 0 ? (
              <Tabs
                defaultValue={defaultIllustration?.name}
                variant="pills"
                onChange={(value) => {
                  const illust = illustrations.find((i) => i.name === value);
                  if (illust) setSelectedIllustration(illust);
                }}
              >
                {illustrations.length > 1 && (
                  <Tabs.List mb="md" style={{ justifyContent: 'center' }}>
                    {illustrations.map((illust) => (
                      <Tabs.Tab
                        key={illust.name}
                        value={illust.name}
                        tt="capitalize"
                      >
                        {illust.name}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                )}

                {illustrations.map((illust) => (
                  <Tabs.Panel key={illust.name} value={illust.name}>
                    <Paper
                      p="md"
                      radius="lg"
                      withBorder
                      style={{
                        background: 'var(--mantine-color-dark-7)',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={illust.src}
                        alt={`${character.name} - ${illust.name}`}
                        fit="contain"
                        mah={500}
                        radius="md"
                      />
                    </Paper>
                  </Tabs.Panel>
                ))}
              </Tabs>
            ) : (
              <Paper
                p="xl"
                radius="lg"
                withBorder
                style={{ background: 'var(--mantine-color-dark-7)' }}
              >
                <Center h={300}>
                  <Text c="dimmed">No illustrations available</Text>
                </Center>
              </Paper>
            )}
          </Grid.Col>

          {/* Right Column - Character Details */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Tabs defaultValue="lore" variant="outline">
              <Tabs.List>
                <Tabs.Tab value="lore">Lore</Tabs.Tab>
                {character.skills.length > 0 && <Tabs.Tab value="skills">Skills</Tabs.Tab>}
                {character.subclasses.length > 0 && <Tabs.Tab value="subclasses">Subclasses</Tabs.Tab>}
              </Tabs.List>

              <Tabs.Panel value="lore" pt="md">
                <Stack gap="md">
                  {character.lore ? (
                    <Text style={{ lineHeight: 1.7 }}>{character.lore}</Text>
                  ) : (
                    <Text c="dimmed">No lore available.</Text>
                  )}

                  {character.quote && (
                    <Paper p="md" radius="md" withBorder style={{ borderLeft: '4px solid var(--mantine-color-blue-5)' }}>
                      <Text fs="italic">"{character.quote}"</Text>
                    </Paper>
                  )}

                  {character.origin && (
                    <>
                      <Title order={4}>Origin</Title>
                      <Text>{character.origin}</Text>
                    </>
                  )}

                  {character.noble_phantasm && (
                    <>
                      <Title order={4}>Noble Phantasm</Title>
                      <Text>{character.noble_phantasm}</Text>
                    </>
                  )}
                </Stack>
              </Tabs.Panel>

              {character.skills.length > 0 && (
                <Tabs.Panel value="skills" pt="md">
                  <Stack gap="md">
                    {character.skills.map((skill, idx) => {
                      const skillIcon = getSkillIcon(skill.name);
                      return (
                        <Card key={idx} padding="md" radius="md" withBorder>
                          <Stack gap="sm">
                            <Group gap="sm">
                              {skillIcon && (
                                <Image src={skillIcon} alt={skill.name} w={40} h={40} fit="contain" />
                              )}
                              <Text fw={600} size="lg">{skill.name}</Text>
                            </Group>
                            <Divider />
                            <RichText text={skill.description} statusEffects={statusEffects} />
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                </Tabs.Panel>
              )}

              {character.subclasses.length > 0 && (
                <Tabs.Panel value="subclasses" pt="md">
                  <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="md">
                    {character.subclasses.map((subclass, idx) => {
                      const subclassIcon = getSubclassIcon(subclass);
                      return (
                        <Card key={idx} padding="sm" radius="md" withBorder>
                          <Stack gap="xs" align="center">
                            {subclassIcon && (
                              <Image src={subclassIcon} alt={subclass} w={48} h={48} fit="contain" />
                            )}
                            <Text size="sm" fw={500} ta="center">{subclass}</Text>
                          </Stack>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                </Tabs.Panel>
              )}
            </Tabs>
          </Grid.Col>
        </Grid>

        {/* Back Link */}
        <Box mt="xl">
          <Link to="/characters" style={{ textDecoration: 'none' }}>
            <Group gap="xs" c="dimmed">
              <IoArrowBack />
              <Text>Back to Characters</Text>
            </Group>
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
