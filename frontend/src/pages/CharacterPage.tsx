import {
  Badge,
  Box,
  Breadcrumbs,
  Center,
  Container,
  Divider,
  Grid,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { Link, useParams } from 'react-router-dom';
import {
  getCharacterSkillIcon,
  getIllustrations,
  getPortrait,
  getTalentIcon,
  type CharacterIllustration,
} from '../assets/character';
import { QUALITY_ICON_MAP } from '../assets/character_quality';
import { CLASS_ICON_MAP } from '../assets/class';
import { FACTION_ICON_MAP } from '../assets/faction';
import { getSubclassIcon } from '../assets/subclass';
import RichText from '../components/RichText';
import { QUALITY_COLOR } from '../constants/colors';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character } from '../types/character';
import type { StatusEffect } from '../types/status-effect';

export default function CharacterPage() {
  const { name } = useParams<{ name: string }>();
  const { data: characters, loading } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );
  const { data: statusEffects } = useDataFetch<StatusEffect[]>(
    'data/status-effects.json',
    []
  );

  const character = useMemo(() => {
    if (!name) return null;
    const decodedName = decodeURIComponent(name);
    return characters.find(
      (c) => c.name.toLowerCase() === decodedName.toLowerCase()
    );
  }, [characters, name]);

  // Lazy-loaded assets
  const [illustrations, setIllustrations] = useState<CharacterIllustration[]>(
    []
  );
  const [talentIcon, setTalentIcon] = useState<string | undefined>();
  const [skillIcons, setSkillIcons] = useState<Map<string, string>>(new Map());
  const [selectedIllustration, setSelectedIllustration] =
    useState<CharacterIllustration | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [modalHoverSide, setModalHoverSide] = useState<
    'left' | 'right' | null
  >(null);

  // Load illustrations when character changes
  useEffect(() => {
    if (!character) {
      setIllustrations([]);
      setSelectedIllustration(null);
      return;
    }

    getIllustrations(character.name).then((imgs) => {
      setIllustrations(imgs);
      const defaultImg =
        imgs.find((i) => i.name.toLowerCase() === 'default') || imgs[0];
      if (defaultImg) {
        setSelectedIllustration(defaultImg);
      }
    });
  }, [character]);

  // Load talent icon when character changes
  useEffect(() => {
    if (!character) {
      setTalentIcon(undefined);
      return;
    }

    getTalentIcon(character.name).then(setTalentIcon);
  }, [character]);

  // Load skill icons when character changes
  useEffect(() => {
    if (!character || !character.skills) {
      setSkillIcons(new Map());
      return;
    }

    const loadSkillIcons = async () => {
      const icons = new Map<string, string>();
      for (const skill of character.skills) {
        const icon = await getCharacterSkillIcon(character.name, skill.name);
        if (icon) {
          icons.set(skill.name, icon);
        }
      }
      setSkillIcons(icons);
    };

    loadSkillIcons();
  }, [character]);

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

  const activeIllustration = selectedIllustration ?? illustrations[0] ?? null;
  const activeIllustrationName = activeIllustration?.name;
  const activeIllustrationIndex = activeIllustration
    ? illustrations.findIndex((illust) => illust.name === activeIllustration.name)
    : -1;
  const hasMultipleIllustrations = illustrations.length > 1;

  const showPreviousIllustration = () => {
    if (illustrations.length === 0 || activeIllustrationIndex < 0) return;
    const nextIndex =
      (activeIllustrationIndex - 1 + illustrations.length) %
      illustrations.length;
    setSelectedIllustration(illustrations[nextIndex]);
  };

  const showNextIllustration = () => {
    if (illustrations.length === 0 || activeIllustrationIndex < 0) return;
    const nextIndex = (activeIllustrationIndex + 1) % illustrations.length;
    setSelectedIllustration(illustrations[nextIndex]);
  };

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
        {activeIllustration?.type === 'image' && (
          <Box
            style={{
              position: 'absolute',
              inset: -20,
              backgroundImage: `url(${activeIllustration.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px) brightness(0.4)',
              transform: 'scale(1.1)',
            }}
          />
        )}

        {/* Content overlay */}
        <Container
          size="lg"
          style={{ position: 'relative', zIndex: 1 }}
          py="xl"
        >
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
                    <Text size="sm" c="gray.4">
                      Characters
                    </Text>
                  </Link>
                  <Text size="sm" c="white">
                    {character.name}
                  </Text>
                </Breadcrumbs>

                <Group gap="md" align="center">
                  <Title order={1} c="white">
                    {character.name}
                  </Title>
                  {!character.is_global && (
                    <Badge variant="light" color="orange" size="lg">
                      CN Only
                    </Badge>
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
                    </Group>
                  </Tooltip>

                  <Tooltip label={character.character_class}>
                    <Group gap={6}>
                      <Image
                        src={CLASS_ICON_MAP[character.character_class]}
                        alt={character.character_class}
                        w={24}
                        h={24}
                      />
                      <Text fw={500} c="white">
                        {character.character_class}
                      </Text>
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
                        <Image
                          src={FACTION_ICON_MAP[faction]}
                          alt={faction}
                          w={16}
                          h={16}
                        />
                      }
                    >
                      {faction}
                    </Badge>
                  ))}
                </Group>

                {(character.height || character.weight) && (
                  <Group gap="md">
                    {character.height && (
                      <Text size="sm" c="gray.4">
                        Height: {character.height}
                      </Text>
                    )}
                    {character.weight && (
                      <Text size="sm" c="gray.4">
                        Weight: {character.weight}
                      </Text>
                    )}
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
            background:
              'linear-gradient(transparent, var(--mantine-color-body))',
            height: 100,
            pointerEvents: 'none',
          }}
        />
      </Box>

      {/* Main Content */}
      <Container size="xl" py="xl">
        <Grid gutter="xl">
          {/* Left Column - Illustration */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md" style={{ position: 'sticky', top: 20 }}>
              {illustrations.length > 0 ? (
                <Stack gap="sm">
                  <Paper
                    p="md"
                    radius="lg"
                    withBorder
                    style={{
                      background: 'var(--mantine-color-dark-7)',
                      overflow: 'hidden',
                    }}
                  >
                    <UnstyledButton
                      onClick={() => setPreviewOpen(true)}
                      style={{ display: 'block', width: '100%' }}
                    >
                      {activeIllustration?.type === 'video' ? (
                        <Box
                          component="video"
                          src={activeIllustration.src}
                          controls
                          style={{
                            width: '100%',
                            maxHeight: 600,
                            borderRadius: 'var(--mantine-radius-md)',
                          }}
                        />
                      ) : (
                        <Image
                          src={activeIllustration?.src}
                          alt={
                            activeIllustration
                              ? `${character.name} - ${activeIllustration.name}`
                              : character.name
                          }
                          fit="contain"
                          mah={600}
                          radius="md"
                        />
                      )}
                    </UnstyledButton>
                  </Paper>

                  {illustrations.length > 1 && (
                    <Box
                      style={{
                        display: 'flex',
                        gap: 8,
                        overflowX: 'auto',
                        paddingBottom: 4,
                      }}
                    >
                      {illustrations.map((illust) => {
                        const isActive = illust.name === activeIllustrationName;
                        return (
                          <UnstyledButton
                            key={illust.name}
                            onClick={() => setSelectedIllustration(illust)}
                            aria-pressed={isActive}
                            style={{
                              borderRadius: 'var(--mantine-radius-md)',
                              border: isActive
                                ? '2px solid var(--mantine-color-blue-5)'
                                : '1px solid var(--mantine-color-dark-4)',
                              overflow: 'hidden',
                              flex: '0 0 auto',
                            }}
                          >
                            {illust.type === 'video' ? (
                              <Box
                                component="video"
                                src={illust.src}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                style={{
                                  width: 120,
                                  height: 80,
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                              />
                            ) : (
                              <Image
                                src={illust.src}
                                alt={`${character.name} - ${illust.name}`}
                                w={120}
                                h={80}
                                fit="cover"
                              />
                            )}
                          </UnstyledButton>
                        );
                      })}
                    </Box>
                  )}
                </Stack>
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

              {/* Subclasses */}
              {character.subclasses.length > 0 && (
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="sm">
                    <Text fw={600} size="sm">
                      Subclasses
                    </Text>
                    <SimpleGrid cols={2} spacing="xs">
                      {character.subclasses.map((subclass, idx) => {
                        const subclassIcon = getSubclassIcon(
                          subclass,
                          character.character_class
                        );
                        return (
                          <Paper key={idx} p="xs" radius="sm" withBorder>
                            <Stack gap={4} align="center">
                              {subclassIcon && (
                                <Image
                                  src={subclassIcon}
                                  alt={subclass}
                                  w={100}
                                  h={93}
                                  fit="contain"
                                />
                              )}
                              <Text size="xs" fw={500} ta="center">
                                {subclass}
                              </Text>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </SimpleGrid>
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Grid.Col>

          {/* Right Column - All Content */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="xl">
              {/* Lore Section */}
              {character.lore && (
                <Paper p="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <Title order={3}>About</Title>
                    <Text style={{ lineHeight: 1.8 }}>{character.lore}</Text>

                    {character.quote && (
                      <Paper
                        p="md"
                        radius="md"
                        style={{
                          borderLeft: '4px solid var(--mantine-color-blue-5)',
                          background: 'var(--mantine-color-dark-6)',
                        }}
                      >
                        <Text fs="italic" c="dimmed">
                          "{character.quote}"
                        </Text>
                      </Paper>
                    )}

                    {character.origin && (
                      <>
                        <Divider />
                        <div>
                          <Text fw={600} size="sm" mb="xs">
                            Origin
                          </Text>
                          <Text size="sm" c="dimmed">
                            {character.origin}
                          </Text>
                        </div>
                      </>
                    )}

                    {character.noble_phantasm && (
                      <>
                        <Divider />
                        <div>
                          <Text fw={600} size="sm" mb="xs">
                            Noble Phantasm
                          </Text>
                          <Text size="sm">{character.noble_phantasm}</Text>
                        </div>
                      </>
                    )}
                  </Stack>
                </Paper>
              )}

              {/* Talent Section */}
              {(() => {
                const talent = character.talent;
                const talentLevels = talent?.talent_levels ?? [];

                if (talentLevels.length === 0) return null;

                return (
                  <Paper p="lg" radius="md" withBorder>
                    <Stack gap="md">
                      <Group gap="md">
                        {talentIcon && (
                          <Image
                            src={talentIcon}
                            alt="Talent"
                            w={54}
                            h={74}
                            fit="contain"
                          />
                        )}
                        <Title order={3}>{talent?.name ?? 'Talent'}</Title>
                      </Group>

                      <Stack gap="sm">
                        {talentLevels.map((talent, idx) => (
                          <Box key={idx}>
                            <Group gap="xs" mb="xs">
                              <Badge variant="filled" color="blue">
                                Level {talent.level}
                              </Badge>
                            </Group>
                            <RichText
                              text={talent.effect}
                              statusEffects={statusEffects}
                            />
                            {idx < talentLevels.length - 1 && (
                              <Divider mt="sm" />
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })()}

              {/* Skills Section */}
              {character.skills.length > 0 && (
                <Paper p="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <Title order={3}>Skills</Title>

                    <Stack gap="md">
                      {character.skills.map((skill, idx) => {
                        const skillIcon = skillIcons.get(skill.name);
                        return (
                          <Paper key={idx} p="md" radius="md" withBorder>
                            <Stack gap="sm">
                              <Group
                                gap="md"
                                justify="space-between"
                                wrap="nowrap"
                              >
                                <Group gap="md" style={{ flex: 1 }}>
                                  {skillIcon && (
                                    <Image
                                      src={skillIcon}
                                      alt={skill.name}
                                      w={60}
                                      h={60}
                                      fit="contain"
                                    />
                                  )}
                                  <Text fw={600} size="lg">
                                    {skill.name}
                                  </Text>
                                </Group>
                                <Badge
                                  size="lg"
                                  variant={
                                    skill.cooldown === 0 ? 'light' : 'filled'
                                  }
                                  color={skill.cooldown === 0 ? 'gray' : 'blue'}
                                  style={{ flexShrink: 0 }}
                                >
                                  {skill.cooldown === 0
                                    ? 'Passive'
                                    : `${skill.cooldown}s`}
                                </Badge>
                              </Group>
                              <RichText
                                text={skill.description}
                                statusEffects={statusEffects}
                              />
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Grid.Col>
        </Grid>

        <Modal
          opened={previewOpen}
          onClose={() => setPreviewOpen(false)}
          size="95%"
          centered
          withCloseButton={false}
          styles={{
            overlay: {
              backgroundColor: 'rgba(8, 10, 14, 0.7)',
              backdropFilter: 'blur(8px)',
            },
            content: {
              background: 'rgba(12, 14, 18, 0.95)',
              border: '1px solid var(--mantine-color-dark-4)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            },
            header: { display: 'none' },
            body: { padding: 16 },
          }}
        >
          {activeIllustration && (
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={600} size="lg">
                  {activeIllustrationName ?? character.name}
                </Text>
                <Group gap="sm">
                  <UnstyledButton
                    onClick={() => setPreviewOpen(false)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      border: '1px solid var(--mantine-color-dark-4)',
                    }}
                  >
                    X
                  </UnstyledButton>
                </Group>
              </Group>

              <Box
                style={{
                  position: 'relative',
                  maxHeight: '78vh',
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                {activeIllustration.type === 'video' ? (
                  <Box
                    component="video"
                    src={activeIllustration.src}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: '78vh',
                      borderRadius: 'var(--mantine-radius-md)',
                    }}
                  />
                ) : (
                  <Image
                    src={activeIllustration.src}
                    alt={`${character.name} - ${activeIllustration.name}`}
                    fit="contain"
                    mah="78vh"
                    radius="md"
                  />
                )}

                {hasMultipleIllustrations && (
                  <>
                    <Box
                      onMouseEnter={() => setModalHoverSide('left')}
                      onMouseLeave={() => setModalHoverSide(null)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: 84,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UnstyledButton
                        onClick={showPreviousIllustration}
                        style={{
                          opacity: modalHoverSide === 'left' ? 1 : 0,
                          transition: 'opacity 150ms ease',
                          padding: '10px 14px',
                          borderRadius: '999px',
                          border: '1px solid var(--mantine-color-dark-4)',
                          background: 'rgba(8, 10, 14, 0.6)',
                          color: 'var(--mantine-color-gray-0)',
                        }}
                      >
                        {'<'}
                      </UnstyledButton>
                    </Box>
                    <Box
                      onMouseEnter={() => setModalHoverSide('right')}
                      onMouseLeave={() => setModalHoverSide(null)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        right: 0,
                        width: 84,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UnstyledButton
                        onClick={showNextIllustration}
                        style={{
                          opacity: modalHoverSide === 'right' ? 1 : 0,
                          transition: 'opacity 150ms ease',
                          padding: '10px 14px',
                          borderRadius: '999px',
                          border: '1px solid var(--mantine-color-dark-4)',
                          background: 'rgba(8, 10, 14, 0.6)',
                          color: 'var(--mantine-color-gray-0)',
                        }}
                      >
                        {'>'}
                      </UnstyledButton>
                    </Box>
                  </>
                )}
              </Box>

              {hasMultipleIllustrations && (
                <Box
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {illustrations.map((illust) => {
                    const isActive = illust.name === activeIllustrationName;
                    return (
                      <UnstyledButton
                        key={`dot-${illust.name}`}
                        onClick={() => setSelectedIllustration(illust)}
                        aria-label={`Go to ${illust.name}`}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '999px',
                          background: isActive
                            ? 'var(--mantine-color-blue-5)'
                            : 'var(--mantine-color-dark-4)',
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            </Stack>
          )}
        </Modal>

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
