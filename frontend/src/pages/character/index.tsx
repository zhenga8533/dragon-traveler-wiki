import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Container,
  Grid,
  Group,
  Image,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
  useComputedColorScheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiFilmLine,
  RiFullscreenExitLine,
  RiFullscreenLine,
  RiZoomInLine,
} from 'react-icons/ri';
import { useParams } from 'react-router-dom';
import { getPortrait } from '../../assets/character';
import { GEAR_TYPE_ICON_MAP, getGearIcon } from '../../assets/gear';
import { getSubclassIcon } from '../../assets/subclass';
import ClassTag from '../../components/common/ClassTag';
import DetailPageNavigation from '../../components/common/DetailPageNavigation';
import EntityNotFound from '../../components/common/EntityNotFound';
import TierBadge from '../../components/common/TierBadge';
import { DetailPageLoading } from '../../components/layout/PageLoadingSkeleton';
import {
  DETAIL_TOOLTIP_STYLES,
  getCardHoverProps,
} from '../../constants/styles';
import { BREAKPOINTS, TRANSITION } from '../../constants/ui';
import { TierListReferenceContext } from '../../contexts';
import {
  useCharacterAssets,
  useDataFetch,
  useMobileTooltip,
} from '../../hooks';
import type { Character, RecommendedGearEntry } from '../../types/character';
import type { Gear, GearSet } from '../../types/gear';
import type { NoblePhantasm } from '../../types/noble-phantasm';
import type { StatusEffect } from '../../types/status-effect';
import type { Subclass } from '../../types/subclass';
import { compareCharactersByQualityThenName } from '../../utils/filter-characters';
import BuildSection from './BuildSection';
import HeroSection from './HeroSection';
import SkillsSection from './SkillsSection';

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
    fallbackIcon: GEAR_TYPE_ICON_MAP.Headgear,
  },
  {
    slot: 'chestplate',
    label: 'Chestplate',
    type: 'Chestplate',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Chestplate,
  },
  {
    slot: 'bracers',
    label: 'Bracers',
    type: 'Bracers',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Bracers,
  },
  {
    slot: 'boots',
    label: 'Boots',
    type: 'Boots',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Boots,
  },
  {
    slot: 'weapon',
    label: 'Weapon',
    type: 'Weapon',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Weapon,
  },
  {
    slot: 'accessory',
    label: 'Accessory',
    type: 'Accessory',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Accessory,
  },
];

export default function CharacterPage() {
  const tooltipProps = useMobileTooltip();
  const isDark = useComputedColorScheme('light') === 'dark';
  const isDesktop = useMediaQuery(BREAKPOINTS.DESKTOP);
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

  // Match list page: sort by quality, then name
  const orderedCharacters = useMemo(
    () => [...characters].sort(compareCharactersByQualityThenName),
    [characters]
  );

  const characterIndex = useMemo(() => {
    if (!character) return -1;
    return orderedCharacters.findIndex(
      (entry) => entry.name.toLowerCase() === character.name.toLowerCase()
    );
  }, [orderedCharacters, character]);

  const previousCharacter =
    characterIndex > 0 ? orderedCharacters[characterIndex - 1] : null;
  const nextCharacter =
    characterIndex >= 0 && characterIndex < orderedCharacters.length - 1
      ? orderedCharacters[characterIndex + 1]
      : null;

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
      RecommendedGearEntry & { label: string; icon: string; slotIcon: string }
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
        slotIcon: cfg.fallbackIcon,
      });
    }
    return entries;
  }, [character]);

  const recommendedSubclassEntries = useMemo(() => {
    return (character?.recommended_subclasses ?? [])
      .map((subclassName) => subclassName.trim())
      .filter((subclassName) => subclassName.length > 0)
      .map((subclassName) => {
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

  const {
    illustrations,
    talentIcon,
    skillIcons,
    setSelectedIllustration,
    activeIllustration,
    activeIllustrationIndex,
    hasMultipleIllustrations,
    showPreviousIllustration,
    showNextIllustration,
  } = useCharacterAssets(character);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [modalHoverSide, setModalHoverSide] = useState<'left' | 'right' | null>(
    null
  );

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

  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeIllustrationName = activeIllustration?.name;

  const handleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    const el = mediaContainerRef.current;
    if (!el) return;
    try {
      await el.requestFullscreen();
    } catch {
      // Fullscreen not supported (e.g. iOS) — open image in new tab
      if (activeIllustration?.type === 'image' && activeIllustration.src) {
        window.open(activeIllustration.src, '_blank', 'noopener,noreferrer');
      }
    }
  }, [activeIllustration]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (!previewOpen || !hasMultipleIllustrations) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') showPreviousIllustration();
      else if (e.key === 'ArrowRight') showNextIllustration();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    previewOpen,
    hasMultipleIllustrations,
    showPreviousIllustration,
    showNextIllustration,
  ]);

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
  const stickyTopOffset =
    'calc(var(--app-shell-header-offset, 0px) + var(--mantine-spacing-md))';

  return (
    <Box>
      <HeroSection
        character={character}
        portrait={portrait}
        isDark={isDark}
        tierLabel={tierLabel}
        activeIllustration={activeIllustration}
      />

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
                      {...getCardHoverProps({ style: { overflow: 'hidden' } })}
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
                              loading="lazy"
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
                  <Paper p="xl" radius="lg" withBorder {...getCardHoverProps()}>
                    <Center h={300}>
                      <Text c="dimmed">No illustrations available</Text>
                    </Center>
                  </Paper>
                )}
              </Box>

              {/* Subclasses */}
              {character.subclasses.length > 0 && (
                <Paper p="md" radius="md" withBorder {...getCardHoverProps()}>
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
                                <TierBadge
                                  tier={String(subclassDetails.tier)}
                                  showPrefix
                                  size="xs"
                                  index={subclassDetails.tier - 1}
                                />
                              )}
                              {subclassDetails?.class && (
                                <ClassTag
                                  characterClass={subclassDetails.class}
                                  size="xs"
                                />
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
                            {...tooltipProps}
                            maw={300}
                            styles={DETAIL_TOOLTIP_STYLES}
                          >
                            <Paper
                              p="xs"
                              radius="sm"
                              withBorder
                              {...getCardHoverProps()}
                            >
                              <Stack gap={6} align="center">
                                {subclassIcon && (
                                  <Center>
                                    <Image
                                      src={subclassIcon}
                                      alt={subclass}
                                      w={100}
                                      h={93}
                                      fit="contain"
                                      loading="lazy"
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
                                    <TierBadge
                                      tier={String(subclassDetails.tier)}
                                      showPrefix
                                      size="xs"
                                      index={subclassDetails.tier - 1}
                                    />
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

          {/* Right Column */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="xl">
              <BuildSection
                character={character}
                statusEffects={statusEffects}
                recommendedGearDetails={recommendedGearDetails}
                recommendedSubclassEntries={recommendedSubclassEntries}
                activatedSetBonuses={activatedSetBonuses}
                linkedNoblePhantasm={linkedNoblePhantasm}
                scrollToSkill={scrollToSkill}
                scrollToTalent={scrollToTalent}
              />
              <SkillsSection
                character={character}
                statusEffects={statusEffects}
                talentIcon={talentIcon}
                skillIcons={skillIcons}
                scrollToSkill={scrollToSkill}
                scrollToTalent={scrollToTalent}
              />
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
              {/* Header */}
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
                <Group gap="xs">
                  {activeIllustration.type === 'image' && (
                    <Tooltip
                      label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                      {...tooltipProps}
                    >
                      <ActionIcon
                        onClick={handleFullscreen}
                        aria-label={
                          isFullscreen ? 'Exit fullscreen' : 'Fullscreen'
                        }
                        variant="default"
                        radius="xl"
                      >
                        {isFullscreen ? (
                          <RiFullscreenExitLine />
                        ) : (
                          <RiFullscreenLine />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                  <ActionIcon
                    onClick={() => setPreviewOpen(false)}
                    aria-label="Close"
                    variant="default"
                    radius="xl"
                  >
                    <RiCloseLine />
                  </ActionIcon>
                </Group>
              </Group>

              {/* Image / video */}
              <Paper
                ref={mediaContainerRef}
                withBorder
                radius="lg"
                p={0}
                {...getCardHoverProps({
                  style: {
                    position: 'relative',
                    maxHeight: isFullscreen ? '100dvh' : '70vh',
                    overflow: isFullscreen ? 'hidden' : 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: isFullscreen ? 'black' : undefined,
                    borderRadius: isFullscreen ? 0 : 'var(--mantine-radius-lg)',
                  },
                })}
              >
                {activeIllustration.type === 'video' ? (
                  <Box
                    component="video"
                    src={activeIllustration.src}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: isFullscreen ? '100dvh' : '70vh',
                      borderRadius: isFullscreen
                        ? 0
                        : 'var(--mantine-radius-lg)',
                    }}
                  />
                ) : (
                  <Image
                    src={activeIllustration.src}
                    alt={`${character.name} - ${activeIllustration.name}`}
                    fit="contain"
                    mah={isFullscreen ? '100dvh' : '70vh'}
                    radius={isFullscreen ? 0 : 'lg'}
                    loading="lazy"
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
                        variant="filled"
                        color="dark"
                        radius="xl"
                        size="lg"
                        style={{
                          opacity: modalHoverSide === 'left' ? 1 : 0.55,
                          transition: `opacity ${TRANSITION.FAST} ${TRANSITION.EASE}, transform ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                          transform:
                            modalHoverSide === 'left'
                              ? 'scale(1.1)'
                              : 'scale(1)',
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
                        variant="filled"
                        color="dark"
                        radius="xl"
                        size="lg"
                        style={{
                          opacity: modalHoverSide === 'right' ? 1 : 0.55,
                          transition: `opacity ${TRANSITION.FAST} ${TRANSITION.EASE}, transform ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                          transform:
                            modalHoverSide === 'right'
                              ? 'scale(1.1)'
                              : 'scale(1)',
                        }}
                      >
                        <RiArrowRightSLine size={24} />
                      </ActionIcon>
                    </Box>
                  </>
                )}
              </Paper>

              {/* Thumbnail strip */}
              {hasMultipleIllustrations && (
                <Box
                  style={{
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'center',
                    overflowX: 'auto',
                    paddingBottom: 4,
                    paddingTop: 4,
                  }}
                >
                  {illustrations.map((illust) => {
                    const isActive = illust.name === activeIllustrationName;
                    return (
                      <Stack
                        key={`thumb-${illust.name}`}
                        gap={4}
                        align="center"
                        style={{ flexShrink: 0 }}
                      >
                        <UnstyledButton
                          onClick={() => setSelectedIllustration(illust)}
                          aria-label={`Go to ${illust.name}`}
                          style={{
                            width: 96,
                            height: 60,
                            borderRadius: 'var(--mantine-radius-sm)',
                            overflow: 'hidden',
                            border: `2px solid ${
                              isActive
                                ? 'var(--mantine-color-blue-5)'
                                : 'var(--mantine-color-default-border)'
                            }`,
                            opacity: isActive ? 1 : 0.6,
                            transition: `opacity ${TRANSITION.FAST}, border-color ${TRANSITION.FAST}`,
                          }}
                        >
                          {illust.type === 'video' ? (
                            <Center
                              style={{
                                width: '100%',
                                height: '100%',
                                background: 'var(--mantine-color-dark-6)',
                              }}
                            >
                              <RiFilmLine size={22} color="white" />
                            </Center>
                          ) : (
                            <Image
                              src={illust.src}
                              alt={illust.name}
                              w={96}
                              h={60}
                              fit="cover"
                              loading="lazy"
                            />
                          )}
                        </UnstyledButton>
                        <Text
                          size="xs"
                          c={isActive ? 'blue' : 'dimmed'}
                          fw={isActive ? 600 : 400}
                          ta="center"
                          lineClamp={1}
                          style={{ maxWidth: 96 }}
                        >
                          {illust.name}
                        </Text>
                      </Stack>
                    );
                  })}
                </Box>
              )}
            </Stack>
          )}
        </Modal>

        <DetailPageNavigation
          previousItem={
            previousCharacter
              ? {
                  label: previousCharacter.name,
                  path: `/characters/${encodeURIComponent(previousCharacter.name)}`,
                }
              : null
          }
          nextItem={
            nextCharacter
              ? {
                  label: nextCharacter.name,
                  path: `/characters/${encodeURIComponent(nextCharacter.name)}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
