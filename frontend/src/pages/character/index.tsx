import {
  Alert,
  Badge,
  Box,
  Center,
  Container,
  Grid,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useCallback, useState } from 'react';
import { RiZoomInLine } from 'react-icons/ri';
import { useParams } from 'react-router-dom';
import { getPortrait } from '../../assets/character';
import { getSubclassIcon } from '../../assets/subclass';
import ChangeHistory from '../../components/common/ChangeHistory';
import ClassTag from '../../components/common/ClassTag';
import DetailPageNavigation from '../../components/common/DetailPageNavigation';
import EntityNotFound from '../../components/common/EntityNotFound';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import TierBadge from '../../components/common/TierBadge';
import { DetailPageLoading } from '../../components/layout/PageLoadingSkeleton';
import { getCardHoverProps } from '../../constants/styles';
import { BREAKPOINTS } from '../../constants/ui';
import { useCharacterAssets, useMobileTooltip } from '../../hooks';
import {
  getCharacterNavPaths,
  useCharacterPageData,
} from '../../hooks/use-character-page-data';
import BuildSection from './BuildSection';
import HeroSection from './HeroSection';
import IllustrationPreviewModal from './IllustrationPreviewModal';
import SkillsSection from './SkillsSection';
import VariantSelector from './VariantSelector';

export default function CharacterPage() {
  const tooltipProps = useMobileTooltip();
  const isDesktop = useMediaQuery(BREAKPOINTS.DESKTOP);
  const { name } = useParams<{ name: string }>();

  const {
    loading,
    character,
    sameNameVariants,
    routeBaseSlug,
    characterNameCounts,
    characterAssetKey,
    isPreferredCharacterForNameReferences,
    tierLabel,
    tierListCharacterNote,
    selectedTierListName,
    linkedNoblePhantasm,
    subclassByName,
    recommendedGearDetails,
    recommendedSubclassEntries,
    activatedSetBonuses,
    teams,
    statusEffects,
    changesData,
    previousCharacter,
    nextCharacter,
  } = useCharacterPageData(name);

  const {
    illustrations,
    illustrationsLoading,
    illustrationsError,
    talentIcon,
    skillIcons,
    setSelectedIllustration,
    activeIllustration,
    activeIllustrationIndex,
    hasMultipleIllustrations,
    showPreviousIllustration,
    showNextIllustration,
  } = useCharacterAssets(character, characterAssetKey);

  const [previewOpen, setPreviewOpen] = useState(false);

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
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <DetailPageLoading />
      </Container>
    );
  }

  if (!character) {
    if (sameNameVariants.length > 1 && routeBaseSlug) {
      return (
        <VariantSelector
          variants={sameNameVariants}
          characterNameCounts={characterNameCounts}
        />
      );
    }

    return (
      <EntityNotFound
        entityType="Character"
        name={name}
        backLabel="Back to Characters"
        backPath="/characters"
      />
    );
  }

  const portrait = getPortrait(character.name, characterAssetKey);
  const activeIllustrationName = activeIllustration?.name;
  const stickyTopOffset =
    'calc(var(--app-shell-header-offset, 0px) + var(--mantine-spacing-md))';
  const { previousItem, nextItem } = getCharacterNavPaths(
    previousCharacter,
    nextCharacter,
    characterNameCounts
  );

  return (
    <Box>
      <ErrorBoundary>
        <HeroSection
          character={character}
          portrait={portrait}
          tierLabel={tierLabel}
          activeIllustration={activeIllustration}
        />
      </ErrorBoundary>

      {/* Main Content */}
      <Container size="xl" py={{ base: 'lg', sm: 'xl' }}>
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
                {illustrationsLoading ? (
                  <Paper p="md" radius="lg" withBorder {...getCardHoverProps()}>
                    <Stack gap="xs">
                      <Group justify="space-between" align="center">
                        <Text fw={600} size="sm">
                          Illustrations
                        </Text>
                        <Text size="xs" c="dimmed">
                          Loading...
                        </Text>
                      </Group>
                      <Skeleton height={320} radius="md" />
                    </Stack>
                  </Paper>
                ) : illustrationsError ? (
                  <Paper p="md" radius="lg" withBorder {...getCardHoverProps()}>
                    <Stack gap="sm">
                      <Text fw={600} size="sm">
                        Illustrations
                      </Text>
                      <Alert
                        color="red"
                        variant="light"
                        title="Couldn't load illustrations"
                      >
                        {illustrationsError}
                      </Alert>
                    </Stack>
                  </Paper>
                ) : illustrations.length > 0 ? (
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
                            minHeight: isDesktop ? undefined : 44,
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
                                'linear-gradient(180deg, transparent var(--dt-gradient-overlay-mid), rgba(0,0,0,0.55) 100%)',
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
                              size={isDesktop ? 'md' : 'lg'}
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
              <ErrorBoundary>
                <BuildSection
                  character={character}
                  teams={teams}
                  enableNameBasedReferences={
                    isPreferredCharacterForNameReferences
                  }
                  selectedTierListName={selectedTierListName}
                  tierLabel={tierLabel}
                  tierListCharacterNote={tierListCharacterNote}
                  statusEffects={statusEffects}
                  recommendedGearDetails={recommendedGearDetails}
                  recommendedSubclassEntries={recommendedSubclassEntries}
                  activatedSetBonuses={activatedSetBonuses}
                  linkedNoblePhantasm={linkedNoblePhantasm}
                  scrollToSkill={scrollToSkill}
                  scrollToTalent={scrollToTalent}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <SkillsSection
                  character={character}
                  statusEffects={statusEffects}
                  talentIcon={talentIcon}
                  skillIcons={skillIcons}
                  scrollToSkill={scrollToSkill}
                  scrollToTalent={scrollToTalent}
                />
              </ErrorBoundary>
            </Stack>
          </Grid.Col>
        </Grid>

        <IllustrationPreviewModal
          opened={previewOpen}
          onClose={() => setPreviewOpen(false)}
          characterName={character.name}
          illustrations={illustrations}
          activeIllustration={activeIllustration}
          activeIllustrationIndex={activeIllustrationIndex}
          hasMultipleIllustrations={hasMultipleIllustrations}
          showPreviousIllustration={showPreviousIllustration}
          showNextIllustration={showNextIllustration}
          onSelectIllustration={setSelectedIllustration}
          tooltipProps={tooltipProps}
        />

        <ChangeHistory
          history={
            changesData[`${character.name}__${character.quality}`] ??
            changesData[character.name]
          }
        />

        <DetailPageNavigation previousItem={previousItem} nextItem={nextItem} />
      </Container>
    </Box>
  );
}
