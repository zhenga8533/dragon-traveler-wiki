import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Container,
  Divider,
  Grid,
  Group,
  Image,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiDoubleQuotesL,
  RiZoomInLine,
} from 'react-icons/ri';
import { Link, useParams } from 'react-router-dom';
import {
  getCharacterSkillIcon,
  getIllustrations,
  getPortrait,
  getTalentIcon,
  type CharacterIllustration,
} from '../assets/character';
import { CLASS_ICON_MAP } from '../assets/class';
import { FACTION_ICON_MAP } from '../assets/faction';
import { getGearIcon } from '../assets/gear';
import accessoryIcon from '../assets/gear/icons/accessory.png';
import bootsIcon from '../assets/gear/icons/boots.png';
import bracersIcon from '../assets/gear/icons/bracers.png';
import chestplateIcon from '../assets/gear/icons/chestplate.png';
import headgearIcon from '../assets/gear/icons/headgear.png';
import weaponIcon from '../assets/gear/icons/weapon.png';
import { getNoblePhantasmIcon } from '../assets/noble_phantasm';
import { QUALITY_ICON_MAP } from '../assets/quality';
import { getSkillIcon } from '../assets/skill';
import { getSubclassIcon } from '../assets/subclass';
import Breadcrumbs from '../components/Breadcrumbs';
import EntityNotFound from '../components/EntityNotFound';
import GlobalBadge from '../components/GlobalBadge';
import LastUpdated from '../components/LastUpdated';
import { DetailPageLoading } from '../components/PageLoadingSkeleton';
import RichText from '../components/RichText';
import { QUALITY_COLOR } from '../constants/colors';
import { TierListReferenceContext } from '../contexts';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Character, RecommendedGearEntry } from '../types/character';
import type { Gear, GearSet } from '../types/gear';
import type { NoblePhantasm } from '../types/noble-phantasm';
import type { StatusEffect } from '../types/status-effect';
import type { Subclass } from '../types/subclass';

const GEAR_SLOT_CONFIG: Array<{
  slot: keyof NonNullable<Character['recommended_gear']>;
  label: string;
  type: RecommendedGearEntry['type'];
  fallbackIcon: string;
}> = [
  {
    slot: 'headgear',
    label: 'Headgear',
    type: 'Headgear',
    fallbackIcon: headgearIcon,
  },
  {
    slot: 'chestplate',
    label: 'Chestplate',
    type: 'Chestplate',
    fallbackIcon: chestplateIcon,
  },
  {
    slot: 'bracers',
    label: 'Bracers',
    type: 'Bracers',
    fallbackIcon: bracersIcon,
  },
  { slot: 'boots', label: 'Boots', type: 'Boots', fallbackIcon: bootsIcon },
  {
    slot: 'weapon',
    label: 'Weapon',
    type: 'Weapon',
    fallbackIcon: weaponIcon,
  },
  {
    slot: 'accessory',
    label: 'Accessory',
    type: 'Accessory',
    fallbackIcon: accessoryIcon,
  },
];

const DETAIL_TOOLTIP_STYLES = {
  tooltip: {
    backgroundColor: 'var(--mantine-color-body)',
    color: 'var(--mantine-color-text)',
    border: '1px solid var(--mantine-color-default-border)',
    boxShadow: 'var(--mantine-shadow-sm)',
    padding: '8px 10px',
  },
  arrow: {
    backgroundColor: 'var(--mantine-color-body)',
    border: '1px solid var(--mantine-color-default-border)',
  },
};

const RECOMMENDED_BUILD_TOOLTIP_STYLES = {
  tooltip: {
    backgroundColor: 'var(--mantine-color-default)',
    color: 'var(--mantine-color-text)',
    border: '1px solid var(--mantine-color-default-border)',
    boxShadow: 'var(--mantine-shadow-md)',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  arrow: {
    backgroundColor: 'var(--mantine-color-default)',
    border: '1px solid var(--mantine-color-default-border)',
  },
};

export default function CharacterPage() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const isDesktop = useMediaQuery('(min-width: 62em)');
  const { name } = useParams<{ name: string }>();
  const { data: characters, loading } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );
  const { data: statusEffects } = useDataFetch<StatusEffect[]>(
    'data/status-effects.json',
    []
  );
  const { data: noblePhantasms } = useDataFetch<NoblePhantasm[]>(
    'data/noble_phantasm.json',
    []
  );
  const { data: subclasses } = useDataFetch<Subclass[]>(
    'data/subclasses.json',
    []
  );
  const { data: gear } = useDataFetch<Gear[]>('data/gear.json', []);
  const { data: gearSets } = useDataFetch<GearSet[]>('data/gear_sets.json', []);
  const { tierLists, selectedTierListName } = useContext(
    TierListReferenceContext
  );

  const character = useMemo(() => {
    if (!name) return null;
    const decodedName = decodeURIComponent(name);
    return characters.find(
      (c) => c.name.toLowerCase() === decodedName.toLowerCase()
    );
  }, [characters, name]);

  const tierLabel = useMemo(() => {
    if (!selectedTierListName || !character) return null;
    const list = tierLists.find((l) => l.name === selectedTierListName);
    if (!list) return null;
    const entry = list.entries.find((e) => e.character_name === character.name);
    return entry?.tier ?? 'Unranked';
  }, [tierLists, selectedTierListName, character]);

  const linkedNoblePhantasm = useMemo(() => {
    if (!character?.noble_phantasm) return null;
    return (
      noblePhantasms.find(
        (np) => np.name.toLowerCase() === character.noble_phantasm.toLowerCase()
      ) ?? null
    );
  }, [character, noblePhantasms]);

  const subclassByName = useMemo(() => {
    const map = new Map<string, Subclass>();
    for (const subclass of subclasses) {
      map.set(subclass.name, subclass);
    }
    return map;
  }, [subclasses]);

  const recommendedGearEntries = useMemo(() => {
    if (!character?.recommended_gear) return [];
    const entries: Array<
      RecommendedGearEntry & { label: string; icon: string }
    > = [];
    for (const cfg of GEAR_SLOT_CONFIG) {
      const gearName = (character.recommended_gear[cfg.slot] ?? '').trim();
      if (!gearName) continue;
      entries.push({
        slot: cfg.slot,
        type: cfg.type,
        name: gearName,
        label: cfg.label,
        icon: getGearIcon(cfg.type, gearName) ?? cfg.fallbackIcon,
      });
    }
    return entries;
  }, [character]);

  const recommendedSubclassEntries = useMemo(() => {
    return (character?.recommended_subclasses ?? []).map((subclassName) => {
      const details = subclassByName.get(subclassName);
      return {
        name: subclassName,
        icon: getSubclassIcon(subclassName),
        tier: details?.tier,
        className: details?.class,
        bonuses: details?.bonuses ?? [],
        effect: details?.effect,
      };
    });
  }, [character, subclassByName]);

  const gearByName = useMemo(() => {
    const map = new Map<string, Gear>();
    for (const item of gear) {
      map.set(item.name.toLowerCase(), item);
    }
    return map;
  }, [gear]);

  const gearSetByName = useMemo(() => {
    const map = new Map<string, GearSet>();
    for (const item of gearSets) {
      map.set(item.name.toLowerCase(), item);
    }
    return map;
  }, [gearSets]);

  const recommendedGearDetails = useMemo(() => {
    return recommendedGearEntries.map((entry) => {
      const gearItem = gearByName.get(entry.name.toLowerCase());
      const setName = gearItem?.set?.trim() ?? '';
      const setData = setName ? gearSetByName.get(setName.toLowerCase()) : null;
      const setBonus = setData?.set_bonus ?? gearItem?.set_bonus ?? null;

      return {
        ...entry,
        setName: setName || null,
        setBonus,
        quality: gearItem?.quality,
        lore: gearItem?.lore,
        stats: gearItem?.stats,
      };
    });
  }, [recommendedGearEntries, gearByName, gearSetByName]);

  const activatedSetBonuses = useMemo(() => {
    const sets = new Map<
      string,
      {
        setName: string;
        pieces: number;
        requiredPieces: number;
        description: string;
      }
    >();

    for (const entry of recommendedGearDetails) {
      if (!entry.setName) continue;
      const key = entry.setName.toLowerCase();
      const existing = sets.get(key);
      const requiredPieces = entry.setBonus?.quantity ?? 0;
      const description = (entry.setBonus?.description ?? '').trim();

      if (!existing) {
        sets.set(key, {
          setName: entry.setName,
          pieces: 1,
          requiredPieces,
          description,
        });
      } else {
        existing.pieces += 1;
        if (existing.requiredPieces <= 0 && requiredPieces > 0) {
          existing.requiredPieces = requiredPieces;
        }
        if (!existing.description && description) {
          existing.description = description;
        }
      }
    }

    return [...sets.values()]
      .map((entry) => ({
        ...entry,
        activations:
          entry.requiredPieces > 0
            ? Math.floor(entry.pieces / entry.requiredPieces)
            : 0,
      }))
      .filter((entry) => entry.activations > 0 && entry.description.length > 0)
      .sort((a, b) => {
        if (b.activations !== a.activations) {
          return b.activations - a.activations;
        }
        if (b.pieces !== a.pieces) {
          return b.pieces - a.pieces;
        }
        return a.setName.localeCompare(b.setName);
      });
  }, [recommendedGearDetails]);

  // Lazy-loaded assets
  const [illustrations, setIllustrations] = useState<CharacterIllustration[]>(
    []
  );
  const [talentIcon, setTalentIcon] = useState<string | undefined>();
  const [skillIcons, setSkillIcons] = useState<Map<string, string>>(new Map());
  const [selectedIllustration, setSelectedIllustration] =
    useState<CharacterIllustration | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [modalHoverSide, setModalHoverSide] = useState<'left' | 'right' | null>(
    null
  );

  // Load illustrations when character changes
  useEffect(() => {
    if (!character) {
      queueMicrotask(() => {
        setIllustrations([]);
        setSelectedIllustration(null);
      });
      return;
    }

    getIllustrations(character.name)
      .then((imgs) => {
        setIllustrations(imgs);
        const defaultImg =
          imgs.find((i) => i.name.toLowerCase() === 'default') || imgs[0];
        if (defaultImg) {
          setSelectedIllustration(defaultImg);
        }
      })
      .catch(() => {
        setIllustrations([]);
        setSelectedIllustration(null);
      });
  }, [character]);

  // Load talent icon when character changes
  useEffect(() => {
    if (!character) {
      queueMicrotask(() => {
        setTalentIcon(undefined);
      });
      return;
    }

    getTalentIcon(character.name)
      .then(setTalentIcon)
      .catch(() => setTalentIcon(undefined));
  }, [character]);

  // Load skill icons when character changes
  useEffect(() => {
    if (!character || !character.skills) {
      queueMicrotask(() => {
        setSkillIcons(new Map());
      });
      return;
    }

    Promise.all(
      character.skills.map(async (skill): Promise<[string, string] | null> => {
        if (skill.type === 'Divine Skill') {
          const divIcon = getSkillIcon('divinity');
          return divIcon ? [skill.name, divIcon] : null;
        }
        const icon = await getCharacterSkillIcon(character.name, skill.name);
        return icon ? [skill.name, icon] : null;
      })
    )
      .then((results) => {
        const icons = new Map<string, string>();
        for (const entry of results) {
          if (entry) icons.set(entry[0], entry[1]);
        }
        setSkillIcons(icons);
      })
      .catch(() => setSkillIcons(new Map()));
  }, [character]);

  const scrollToSkill = useCallback((skillName: string) => {
    const el = document.getElementById(`skill-${skillName}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const scrollToTalent = useCallback(() => {
    const el = document.getElementById('talent-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <DetailPageLoading />
      </Container>
    );
  }

  if (!character) {
    return (
      <EntityNotFound
        entityType="Character"
        name={name}
        backLabel="Back to Characters"
        backPath="/characters"
      />
    );
  }

  const portrait = getPortrait(character.name);

  const activeIllustration = selectedIllustration ?? illustrations[0] ?? null;
  const activeIllustrationName = activeIllustration?.name;
  const activeIllustrationIndex = activeIllustration
    ? illustrations.findIndex(
        (illust) => illust.name === activeIllustration.name
      )
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

  const heroBlurFilter = isDark
    ? 'blur(20px) brightness(0.4)'
    : 'blur(20px) brightness(1.2) saturate(1.05)';
  const stickyTopOffset =
    'calc(var(--app-shell-header-offset, 0px) + var(--mantine-spacing-md))';

  return (
    <Box>
      {/* Hero Section with Blurred Background */}
      <Box
        style={{
          position: 'relative',
          minHeight: 350,
          overflow: 'hidden',
          background: 'var(--mantine-color-body)',
          margin:
            'calc(-1 * var(--mantine-spacing-md)) calc(-1 * var(--mantine-spacing-md)) 0',
          padding: 'var(--mantine-spacing-md) var(--mantine-spacing-md) 0',
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
              backgroundPosition: 'top',
              filter: heroBlurFilter,
              transform: 'scale(1.1)',
            }}
          />
        )}
        {activeIllustration?.type === 'video' && (
          <Box
            component="video"
            src={activeIllustration.src}
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              inset: -20,
              width: 'calc(100% + 40px)',
              height: 'calc(100% + 40px)',
              objectFit: 'cover',
              objectPosition: 'top',
              filter: heroBlurFilter,
              transform: 'scale(1.1)',
            }}
          />
        )}
        {!isDark && (
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.75))',
              pointerEvents: 'none',
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
                <Breadcrumbs
                  items={[
                    { label: 'Characters', path: '/characters' },
                    { label: character.name },
                  ]}
                />

                <Group gap="md" align="center">
                  <Title order={1} c={isDark ? 'white' : 'dark'}>
                    {character.name}
                  </Title>
                  <GlobalBadge isGlobal={character.is_global} size="md" />
                </Group>

                {character.title && (
                  <Text size="sm" fw={500} c="dimmed">
                    {character.title}
                  </Text>
                )}

                <LastUpdated timestamp={character.last_updated} />

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

                  {tierLabel && (
                    <Badge variant="light" color="gray" size="lg">
                      Tier: {tierLabel}
                    </Badge>
                  )}

                  <Tooltip label={character.character_class}>
                    <Group gap={6}>
                      <Image
                        src={CLASS_ICON_MAP[character.character_class]}
                        alt={character.character_class}
                        w={24}
                        h={24}
                      />
                      <Text fw={500} c={isDark ? 'white' : 'dark'}>
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
                      <Text size="sm" c="dimmed">
                        Height: {character.height}
                      </Text>
                    )}
                    {character.weight && (
                      <Text size="sm" c="dimmed">
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
            <Stack
              gap="md"
              style={{
                position: isDesktop ? 'sticky' : 'static',
                top: isDesktop ? stickyTopOffset : undefined,
                alignSelf: 'flex-start',
              }}
            >
              <Box>
                {illustrations.length > 0 ? (
                  <Stack gap="sm">
                    <Paper
                      p="md"
                      radius="lg"
                      withBorder
                      style={{ overflow: 'hidden' }}
                    >
                      <Stack gap="xs">
                        <Group justify="space-between" align="center">
                          <Text fw={600} size="sm">
                            Illustrations
                          </Text>
                          {activeIllustrationIndex >= 0 && (
                            <Text size="xs" c="dimmed">
                              {activeIllustrationIndex + 1}/
                              {illustrations.length}
                            </Text>
                          )}
                        </Group>
                        <UnstyledButton
                          onClick={() => setPreviewOpen(true)}
                          style={{
                            display: 'block',
                            width: '100%',
                            borderRadius: 'var(--mantine-radius-md)',
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          {activeIllustration?.type === 'video' ? (
                            <Box
                              component="video"
                              src={activeIllustration.src}
                              controls
                              style={{
                                width: '100%',
                                maxHeight: 420,
                                display: 'block',
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
                              mah={420}
                            />
                          )}
                          <Box
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background:
                                'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.55) 100%)',
                              pointerEvents: 'none',
                            }}
                          />
                          <Group
                            justify="space-between"
                            align="center"
                            style={{
                              position: 'absolute',
                              bottom: 12,
                              left: 12,
                              right: 12,
                            }}
                          >
                            <Stack gap={2}>
                              <Text size="sm" fw={600} c="white">
                                {activeIllustrationName ?? character.name}
                              </Text>
                              <Text size="xs" c="gray.2">
                                {activeIllustration?.type === 'video'
                                  ? 'Animation'
                                  : 'Artwork'}
                              </Text>
                            </Stack>
                            <Badge
                              leftSection={<RiZoomInLine />}
                              variant="light"
                              color="gray"
                            >
                              View
                            </Badge>
                          </Group>
                        </UnstyledButton>
                      </Stack>
                    </Paper>
                  </Stack>
                ) : (
                  <Paper p="xl" radius="lg" withBorder>
                    <Center h={300}>
                      <Text c="dimmed">No illustrations available</Text>
                    </Center>
                  </Paper>
                )}
              </Box>

              {/* Subclasses */}
              {character.subclasses.length > 0 && (
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="sm">
                    <Text fw={600} size="sm">
                      Subclasses
                    </Text>
                    <SimpleGrid cols={2} spacing="xs">
                      {character.subclasses.map((subclass) => {
                        const subclassDetails = subclassByName.get(subclass);
                        const subclassClass =
                          subclassDetails?.class ?? character.character_class;
                        const subclassIcon = getSubclassIcon(
                          subclass,
                          subclassClass
                        );
                        const subclassBonuses = subclassDetails?.bonuses ?? [];
                        const tooltipLabel = (
                          <Stack gap={6}>
                            <Text size="xs" fw={700}>
                              {subclass}
                            </Text>
                            <Group gap={6} wrap="wrap">
                              {subclassDetails?.tier && (
                                <Badge variant="light" color="grape" size="xs">
                                  Tier {subclassDetails.tier}
                                </Badge>
                              )}
                              {subclassDetails?.class && (
                                <Badge variant="light" color="blue" size="xs">
                                  {subclassDetails.class}
                                </Badge>
                              )}
                            </Group>
                            {subclassDetails?.effect && (
                              <Text size="xs" style={{ lineHeight: 1.4 }}>
                                {subclassDetails.effect}
                              </Text>
                            )}
                            {subclassBonuses.length > 0 && (
                              <Text
                                size="xs"
                                c="dimmed"
                                style={{ lineHeight: 1.4 }}
                              >
                                Bonuses: {subclassBonuses.join(', ')}
                              </Text>
                            )}
                          </Stack>
                        );
                        return (
                          <Tooltip
                            key={subclass}
                            label={tooltipLabel}
                            multiline
                            withArrow
                            openDelay={120}
                            maw={300}
                            styles={DETAIL_TOOLTIP_STYLES}
                          >
                            <Paper p="xs" radius="sm" withBorder>
                              <Stack gap={6} align="center">
                                {subclassIcon && (
                                  <Center>
                                    <Image
                                      src={subclassIcon}
                                      alt={subclass}
                                      w={100}
                                      h={93}
                                      fit="contain"
                                    />
                                  </Center>
                                )}

                                <Group
                                  justify="center"
                                  align="center"
                                  wrap="wrap"
                                  gap={6}
                                >
                                  <Text size="xs" fw={600} ta="center">
                                    {subclass}
                                  </Text>
                                  {subclassDetails?.tier && (
                                    <Badge
                                      variant="light"
                                      color="grape"
                                      size="xs"
                                    >
                                      Tier {subclassDetails.tier}
                                    </Badge>
                                  )}
                                </Group>
                              </Stack>
                            </Paper>
                          </Tooltip>
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
                    <RichText
                      text={character.lore}
                      statusEffects={statusEffects}
                      skills={character.skills}
                      talent={character.talent ?? null}
                      onSkillClick={scrollToSkill}
                      onTalentClick={scrollToTalent}
                      italic
                      lineHeight={1.8}
                    />

                    {character.quote && (
                      <Paper p="md" radius="md" withBorder>
                        <Group gap="sm" align="flex-start" wrap="nowrap">
                          <Box
                            style={{
                              color: 'var(--mantine-color-blue-6)',
                              fontSize: 28,
                              lineHeight: 1,
                              paddingTop: 2,
                            }}
                            aria-hidden="true"
                          >
                            <RiDoubleQuotesL />
                          </Box>
                          <Stack gap={4}>
                            <Text
                              fs="italic"
                              size="sm"
                              style={{ lineHeight: 1.7 }}
                            >
                              "{character.quote}"
                            </Text>
                            <Text size="xs" c="dimmed">
                              — {character.name}
                            </Text>
                          </Stack>
                        </Group>
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
                          {linkedNoblePhantasm ? (
                            (() => {
                              const noblePhantasmIcon = getNoblePhantasmIcon(
                                linkedNoblePhantasm.name
                              );
                              return (
                                <Stack gap="xs">
                                  <Link
                                    to={`/noble-phantasms/${encodeURIComponent(linkedNoblePhantasm.name)}`}
                                    style={{
                                      textDecoration: 'none',
                                      width: 'fit-content',
                                    }}
                                  >
                                    <Group gap="sm" wrap="nowrap">
                                      {noblePhantasmIcon && (
                                        <Box
                                          style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                          }}
                                        >
                                          <Image
                                            src={noblePhantasmIcon}
                                            alt={linkedNoblePhantasm.name}
                                            w={40}
                                            h={40}
                                            fit="cover"
                                          />
                                        </Box>
                                      )}
                                      <Badge
                                        variant="light"
                                        color="grape"
                                        size="lg"
                                      >
                                        {linkedNoblePhantasm.name}
                                      </Badge>
                                    </Group>
                                  </Link>
                                  {linkedNoblePhantasm.lore && (
                                    <RichText
                                      text={linkedNoblePhantasm.lore}
                                      statusEffects={statusEffects}
                                      skills={character.skills}
                                      talent={character.talent ?? null}
                                      onSkillClick={scrollToSkill}
                                      onTalentClick={scrollToTalent}
                                      color="dimmed"
                                      italic
                                      lineHeight={1.6}
                                    />
                                  )}
                                </Stack>
                              );
                            })()
                          ) : (
                            <Text size="sm">{character.noble_phantasm}</Text>
                          )}
                        </div>
                      </>
                    )}
                  </Stack>
                </Paper>
              )}

              {(recommendedGearEntries.length > 0 ||
                recommendedSubclassEntries.length > 0) && (
                <Paper p="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start" gap="sm">
                      <Stack gap={2}>
                        <Title order={3}>Recommended Build</Title>
                        <Text size="sm" c="dimmed">
                          Suggested setup based on current character data.
                        </Text>
                      </Stack>
                      {recommendedGearEntries.length > 0 && (
                        <Badge variant="light" color="blue" size="lg">
                          {recommendedGearEntries.length}/6 Gear Slots
                        </Badge>
                      )}
                    </Group>

                    {recommendedSubclassEntries.length > 0 && (
                      <Stack gap="sm">
                        <Text fw={600} size="sm">
                          Recommended Subclasses
                        </Text>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                          {recommendedSubclassEntries.map((entry) => {
                            const tooltipLabel = (
                              <Stack gap={6}>
                                <Text size="xs" fw={700}>
                                  {entry.name}
                                </Text>
                                <Group gap={6} wrap="wrap">
                                  {typeof entry.tier === 'number' && (
                                    <Badge
                                      variant="light"
                                      color="grape"
                                      size="xs"
                                    >
                                      Tier {entry.tier}
                                    </Badge>
                                  )}
                                  {entry.className && (
                                    <Badge
                                      variant="light"
                                      color="blue"
                                      size="xs"
                                    >
                                      {entry.className}
                                    </Badge>
                                  )}
                                </Group>
                                {entry.effect && (
                                  <Text size="xs" style={{ lineHeight: 1.4 }}>
                                    {entry.effect}
                                  </Text>
                                )}
                                {entry.bonuses.length > 0 && (
                                  <Text
                                    size="xs"
                                    c="dimmed"
                                    style={{ lineHeight: 1.4 }}
                                  >
                                    Bonuses: {entry.bonuses.join(', ')}
                                  </Text>
                                )}
                              </Stack>
                            );

                            return (
                              <Tooltip
                                key={entry.name}
                                label={tooltipLabel}
                                multiline
                                withArrow
                                openDelay={120}
                                maw={300}
                                styles={DETAIL_TOOLTIP_STYLES}
                              >
                                <Paper p="sm" radius="md" withBorder>
                                  <Group
                                    gap="sm"
                                    align="flex-start"
                                    wrap="nowrap"
                                  >
                                    {entry.icon && (
                                      <Center
                                        style={{
                                          width: 56,
                                          minWidth: 56,
                                          height: 52,
                                          borderRadius: 8,
                                          border:
                                            '1px solid var(--mantine-color-default-border)',
                                        }}
                                      >
                                        <Image
                                          src={entry.icon}
                                          alt={entry.name}
                                          w={50}
                                          h={46}
                                          fit="contain"
                                        />
                                      </Center>
                                    )}

                                    <Stack gap={4} style={{ minWidth: 0 }}>
                                      <Group gap={6} wrap="wrap">
                                        <Text fw={600} size="sm" truncate>
                                          {entry.name}
                                        </Text>
                                        {typeof entry.tier === 'number' && (
                                          <Badge
                                            variant="light"
                                            color="grape"
                                            size="xs"
                                          >
                                            Tier {entry.tier}
                                          </Badge>
                                        )}
                                        {entry.className && (
                                          <Badge
                                            variant="light"
                                            color="blue"
                                            size="xs"
                                          >
                                            {entry.className}
                                          </Badge>
                                        )}
                                      </Group>
                                      {entry.bonuses.length > 0 && (
                                        <Text
                                          size="xs"
                                          c="dimmed"
                                          lineClamp={2}
                                        >
                                          Bonuses: {entry.bonuses.join(', ')}
                                        </Text>
                                      )}
                                    </Stack>
                                  </Group>
                                </Paper>
                              </Tooltip>
                            );
                          })}
                        </SimpleGrid>
                      </Stack>
                    )}

                    {recommendedGearEntries.length > 0 && (
                      <Stack gap="xs">
                        <Text fw={600} size="sm">
                          Recommended Gear
                        </Text>
                        <SimpleGrid
                          cols={{ base: 1, sm: 2, lg: 3 }}
                          spacing="sm"
                        >
                          {recommendedGearDetails.map((entry) => {
                            const statsEntries = entry.stats
                              ? Object.entries(entry.stats).filter(
                                  ([statName, statValue]) =>
                                    Boolean(statName) &&
                                    statValue !== null &&
                                    statValue !== undefined
                                )
                              : [];

                            const tooltipLabel = (
                              <Stack gap="xs">
                                <Text
                                  fw={700}
                                  size="sm"
                                  style={{ lineHeight: 1.25 }}
                                >
                                  {entry.name}
                                </Text>
                                <Divider />
                                <Group gap={6} wrap="wrap">
                                  <Badge variant="light" color="gray" size="xs">
                                    Slot: {entry.label}
                                  </Badge>
                                  {entry.setName && (
                                    <Badge
                                      variant="light"
                                      color="blue"
                                      size="xs"
                                    >
                                      Set: {entry.setName}
                                    </Badge>
                                  )}
                                  {entry.quality && (
                                    <Badge
                                      variant="light"
                                      color="grape"
                                      size="xs"
                                    >
                                      Quality: {entry.quality}
                                    </Badge>
                                  )}
                                </Group>
                                {entry.setBonus &&
                                  entry.setBonus.quantity > 0 &&
                                  entry.setBonus.description && (
                                    <Stack gap={2}>
                                      <Badge
                                        variant="light"
                                        color="teal"
                                        size="xs"
                                        w="fit-content"
                                      >
                                        Set Bonus: {entry.setBonus.quantity}{' '}
                                        Piece
                                        {entry.setBonus.quantity > 1 ? 's' : ''}
                                      </Badge>
                                      <Text
                                        size="xs"
                                        style={{ lineHeight: 1.35 }}
                                      >
                                        {entry.setBonus.description}
                                      </Text>
                                    </Stack>
                                  )}
                                {statsEntries.length > 0 && (
                                  <Stack gap={2}>
                                    <Text size="xs" c="dimmed" fw={600}>
                                      Stats
                                    </Text>
                                    <Group gap={6} wrap="wrap">
                                      {statsEntries.map(
                                        ([statName, statValue]) => (
                                          <Badge
                                            key={`${entry.slot}-${statName}`}
                                            variant="light"
                                            color="indigo"
                                            size="xs"
                                          >
                                            {statName}: {String(statValue)}
                                          </Badge>
                                        )
                                      )}
                                    </Group>
                                  </Stack>
                                )}
                                {entry.lore && (
                                  <Stack gap={2}>
                                    <Text size="xs" c="dimmed" fw={600}>
                                      Lore
                                    </Text>
                                    <Text
                                      size="xs"
                                      style={{ lineHeight: 1.35 }}
                                    >
                                      {entry.lore}
                                    </Text>
                                  </Stack>
                                )}
                              </Stack>
                            );

                            return (
                              <Tooltip
                                key={entry.slot}
                                label={tooltipLabel}
                                multiline
                                withArrow
                                openDelay={120}
                                maw={340}
                                styles={RECOMMENDED_BUILD_TOOLTIP_STYLES}
                              >
                                <Paper p="sm" radius="md" withBorder>
                                  <Group gap="sm" wrap="nowrap">
                                    <Image
                                      src={entry.icon}
                                      alt={`${entry.label}: ${entry.name}`}
                                      w={48}
                                      h={48}
                                      fit="contain"
                                    />
                                    <Stack gap={2} style={{ minWidth: 0 }}>
                                      <Badge
                                        variant="light"
                                        color="gray"
                                        size="xs"
                                        w="fit-content"
                                      >
                                        {entry.label}
                                      </Badge>
                                      <Text size="sm" fw={600} truncate>
                                        {entry.name}
                                      </Text>
                                      {entry.setName && (
                                        <Text size="xs" c="dimmed" truncate>
                                          {entry.setName} Set
                                        </Text>
                                      )}
                                    </Stack>
                                  </Group>
                                </Paper>
                              </Tooltip>
                            );
                          })}
                        </SimpleGrid>
                      </Stack>
                    )}

                    {activatedSetBonuses.length > 0 && (
                      <Stack gap="xs">
                        <Text fw={600} size="sm">
                          Activated Set Bonuses
                        </Text>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                          {activatedSetBonuses.map((setBonus) => {
                            const tooltipLabel = (
                              <Stack gap="xs">
                                <Text
                                  fw={700}
                                  size="sm"
                                  style={{ lineHeight: 1.25 }}
                                >
                                  {setBonus.setName} Set
                                </Text>
                                <Divider />
                                <Group gap={6} wrap="wrap">
                                  <Badge variant="light" color="gray" size="xs">
                                    Pieces: {setBonus.pieces}/
                                    {setBonus.requiredPieces}
                                  </Badge>
                                  <Badge variant="light" color="teal" size="xs">
                                    Activations: ×{setBonus.activations}
                                  </Badge>
                                </Group>
                                <Stack gap={2}>
                                  <Text size="xs" c="dimmed" fw={600}>
                                    Effect
                                  </Text>
                                  <Text size="xs" style={{ lineHeight: 1.35 }}>
                                    {setBonus.description}
                                  </Text>
                                </Stack>
                              </Stack>
                            );

                            return (
                              <Tooltip
                                key={setBonus.setName}
                                label={tooltipLabel}
                                multiline
                                withArrow
                                openDelay={120}
                                maw={320}
                                styles={RECOMMENDED_BUILD_TOOLTIP_STYLES}
                              >
                                <Paper p="sm" radius="md" withBorder>
                                  <Stack gap={4}>
                                    <Group justify="space-between" gap="xs">
                                      <Text fw={600} size="sm" truncate>
                                        {setBonus.setName}
                                      </Text>
                                      <Badge
                                        variant="filled"
                                        color="teal"
                                        size="xs"
                                      >
                                        ×{setBonus.activations}
                                      </Badge>
                                    </Group>
                                    <Text size="xs" c="dimmed">
                                      {setBonus.pieces}/
                                      {setBonus.requiredPieces} pieces
                                    </Text>
                                    <Text size="xs" c="dimmed" lineClamp={2}>
                                      {setBonus.description}
                                    </Text>
                                  </Stack>
                                </Paper>
                              </Tooltip>
                            );
                          })}
                        </SimpleGrid>
                      </Stack>
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
                  <Paper id="talent-section" p="lg" radius="md" withBorder>
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
                              skills={character.skills}
                              talent={character.talent ?? null}
                              onSkillClick={scrollToSkill}
                              onTalentClick={scrollToTalent}
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
                          <Paper
                            key={idx}
                            id={`skill-${skill.name}`}
                            p="md"
                            radius="md"
                            withBorder
                          >
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
                                  <Group gap="xs" align="center">
                                    <Text fw={600} size="lg">
                                      {skill.name}
                                    </Text>
                                    {skill.type && (
                                      <Badge
                                        size="lg"
                                        variant="light"
                                        color="grape"
                                      >
                                        {skill.type}
                                      </Badge>
                                    )}
                                  </Group>
                                </Group>
                                <Group gap="xs" style={{ flexShrink: 0 }}>
                                  <Badge
                                    size="lg"
                                    variant={
                                      skill.cooldown === 0 ? 'light' : 'filled'
                                    }
                                    color={
                                      skill.cooldown === 0 ? 'gray' : 'blue'
                                    }
                                  >
                                    {skill.cooldown === 0
                                      ? 'Passive'
                                      : `${skill.cooldown}s`}
                                  </Badge>
                                </Group>
                              </Group>
                              <RichText
                                text={skill.description}
                                statusEffects={statusEffects}
                                skills={character.skills}
                                talent={character.talent ?? null}
                                onSkillClick={scrollToSkill}
                                onTalentClick={scrollToTalent}
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
        >
          {activeIllustration && (
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Group gap="sm" align="center">
                  <Text fw={600} size="lg">
                    {activeIllustrationName ?? character.name}
                  </Text>
                  {activeIllustrationIndex >= 0 && (
                    <Badge variant="light" color="gray">
                      {activeIllustrationIndex + 1}/{illustrations.length}
                    </Badge>
                  )}
                </Group>
                <ActionIcon
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Close"
                  variant="default"
                  radius="xl"
                >
                  <RiCloseLine />
                </ActionIcon>
              </Group>

              <Paper
                withBorder
                radius="lg"
                p={0}
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
                      borderRadius: 'var(--mantine-radius-lg)',
                    }}
                  />
                ) : (
                  <Image
                    src={activeIllustration.src}
                    alt={`${character.name} - ${activeIllustration.name}`}
                    fit="contain"
                    mah="78vh"
                    radius="lg"
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
                      <ActionIcon
                        onClick={showPreviousIllustration}
                        aria-label="Previous illustration"
                        variant="default"
                        radius="xl"
                        style={{
                          opacity: modalHoverSide === 'left' ? 1 : 0.6,
                          transition:
                            'opacity 150ms ease, transform 150ms ease',
                        }}
                      >
                        <RiArrowLeftSLine size={24} />
                      </ActionIcon>
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
                      <ActionIcon
                        onClick={showNextIllustration}
                        aria-label="Next illustration"
                        variant="default"
                        radius="xl"
                        style={{
                          opacity: modalHoverSide === 'right' ? 1 : 0.6,
                          transition:
                            'opacity 150ms ease, transform 150ms ease',
                        }}
                      >
                        <RiArrowRightSLine size={24} />
                      </ActionIcon>
                    </Box>
                  </>
                )}
              </Paper>

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
            <Group gap="xs" c="violet" style={{ cursor: 'pointer' }}>
              <IoArrowBack />
              <Text>Back to Characters</Text>
            </Group>
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
