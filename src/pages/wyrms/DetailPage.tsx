import SafeImage from '@/components/ui/SafeImage';
import { getWyrmIllustration, getWyrmPortrait } from '@/assets';
import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageHero from '@/components/common/DetailPageHero';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import RichText from '@/components/common/RichText';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import EntityNotFound from '@/components/ui/EntityNotFound';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import { QUALITY_COLOR } from '@/constants/colors';
import { getLoreGlassStyles } from '@/constants/glass';
import { getCardHoverProps, getHeroIconBoxStyles } from '@/constants/styles';
import { BREAKPOINTS } from '@/constants/ui';
import type { WyrmPhase } from '@/features/wiki/wyrms/types';
import { WYRM_PHASE_ORDER } from '@/features/wiki/wyrms/types';

const WYRM_PHASE_COLOR: Record<WyrmPhase, string> = {
  'Juvenile Phase': 'violet',
  'Growth Phase': 'yellow',
  'Final Phase': 'orange',
};
import EvolutionSection from '@/features/wiki/wyrms/components/EvolutionSection';
import SkillCard from '@/features/wiki/wyrms/components/SkillCard';
import StarUpgradesTable from '@/features/wiki/wyrms/components/StarUpgradesTable';
import { useStatusEffects, useWyrms } from '@/features/wiki/hooks/use-wiki-data';
import { useDarkMode, useDataFetch, useGradientAccent } from '@/hooks';
import type { ChangesFile } from '@/types/changes';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
  toEntitySlug,
} from '@/utils/entity-slug';
import {
  Badge,
  Box,
  Container,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function phaseIndex(phase: WyrmPhase): number {
  return WYRM_PHASE_ORDER.indexOf(phase);
}

export default function WyrmPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { accent } = useGradientAccent();
  const isDark = useDarkMode();
  const isDesktop = useMediaQuery(BREAKPOINTS.DESKTOP);

  const { data: wyrms, loading } = useWyrms();
  const { data: statusEffects } = useStatusEffects();
  const { data: changesData } = useDataFetch<ChangesFile>('data/changes/wyrms.json', {});

  const wyrm = useMemo(
    () => findEntityByParam(wyrms, name, (w) => w.name),
    [wyrms, name]
  );

  useEffect(() => {
    if (!wyrm || !name) return;
    if (!shouldRedirectToEntitySlug(name, wyrm.name)) return;
    navigate(`/wyrms/${toEntitySlug(wyrm.name)}`, { replace: true });
  }, [wyrm, name, navigate]);

  const orderedWyrms = useMemo(
    () =>
      [...wyrms].sort((a, b) => {
        const fCmp = a.faction.localeCompare(b.faction);
        if (fCmp !== 0) return fCmp;
        return phaseIndex(a.phase) - phaseIndex(b.phase);
      }),
    [wyrms]
  );

  const wyrmIndex = useMemo(() => {
    if (!wyrm) return -1;
    return orderedWyrms.findIndex(
      (w) => w.name.toLowerCase() === wyrm.name.toLowerCase()
    );
  }, [wyrm, orderedWyrms]);

  const previousWyrm = wyrmIndex > 0 ? orderedWyrms[wyrmIndex - 1] : null;
  const nextWyrm =
    wyrmIndex >= 0 && wyrmIndex < orderedWyrms.length - 1
      ? orderedWyrms[wyrmIndex + 1]
      : null;

  if (loading) {
    return (
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <DetailPageLoading />
      </Container>
    );
  }

  if (!wyrm) {
    return (
      <EntityNotFound
        entityType="Wyrm"
        name={name}
        backLabel="Back to Wyrms"
        backPath="/wyrms"
      />
    );
  }

  const iconSrc = getWyrmPortrait(wyrm.name);
  const illustrationSrc = getWyrmIllustration(wyrm.name);
  const qualityColor = QUALITY_COLOR[wyrm.quality];
  const phaseColor = WYRM_PHASE_COLOR[wyrm.phase];
  const stickyTopOffset = 'calc(var(--app-shell-header-offset, 0px) + var(--mantine-spacing-md))';

  return (
    <Box>
      <DetailPageHero
        isDark={isDark}
        qualityColor={qualityColor}
        secondaryColor={accent.secondary}
        breadcrumbItems={[
          { label: 'Wyrms', path: '/wyrms' },
          { label: wyrm.name },
        ]}
      >
        <Group gap="lg" align="flex-start" wrap="nowrap">
          {iconSrc && (
            <Box style={getHeroIconBoxStyles(isDark, qualityColor, true)}>
              <SafeImage
                src={iconSrc}
                alt={wyrm.name}
                w={72}
                h={72}
                fit="contain"
                radius="sm"
              />
            </Box>
          )}

          <Stack gap={6} style={{ flex: 1 }}>
            <Group gap="sm" align="center">
              <Title
                order={1}
                c={isDark ? 'white' : 'dark'}
                fz={{ base: '1.5rem', sm: '2.125rem' }}
                style={{ lineHeight: 1.2, wordBreak: 'break-word' }}
              >
                {wyrm.name}
              </Title>
              <QualityIcon quality={wyrm.quality} size={32} />
            </Group>
            <LastUpdated timestamp={wyrm.last_updated} />
            <Group gap="sm" mt={4}>
              <Badge size="lg" variant="light" color={phaseColor}>
                {wyrm.phase}
              </Badge>
              <FactionTag faction={wyrm.faction} size="md" />
            </Group>
          </Stack>
        </Group>

        {wyrm.description && (
          <Paper
            p="md"
            radius="md"
            withBorder
            {...getCardHoverProps({ style: getLoreGlassStyles(isDark) })}
          >
            <Stack gap="xs">
              <RichText text={wyrm.description} statusEffects={statusEffects} italic lineHeight={1.6} />
              {wyrm.battle_description && (
                <RichText text={wyrm.battle_description} statusEffects={statusEffects} />
              )}
            </Stack>
          </Paper>
        )}
      </DetailPageHero>

      <Container size="xl" py={{ base: 'lg', sm: 'xl' }}>
        <Grid gutter="xl">
          {/* Left column — portrait + star upgrades */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack
              gap="md"
              style={{
                position: isDesktop ? 'sticky' : 'static',
                top: isDesktop ? stickyTopOffset : undefined,
                alignSelf: 'flex-start',
              }}
            >
              <Paper
                p="md"
                radius="lg"
                withBorder
                {...getCardHoverProps({ style: { overflow: 'hidden' } })}
              >
                <Stack gap="xs">
                  <Text fw={600} size="sm">
                    Illustration
                  </Text>
                  <SafeImage
                    src={illustrationSrc}
                    alt={wyrm.name}
                    fit="contain"
                    mah={420}
                    radius="md"
                    loading="lazy"
                  />
                </Stack>
              </Paper>

              <StarUpgradesTable wyrm={wyrm} statusEffects={statusEffects} />
            </Stack>
          </Grid.Col>

          {/* Right column — content */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="xl">
              <EvolutionSection wyrm={wyrm} allWyrms={wyrms} isDark={isDark} />

              {wyrm.skills.length > 0 && (
                <Stack gap="md">
                  <Title order={2} size="h3">
                    Skills
                  </Title>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    {wyrm.skills.map((skill, i) => (
                      <SkillCard
                        key={`${skill.name}-${i}`}
                        wyrm={wyrm}
                        skill={skill}
                        statusEffects={statusEffects}
                      />
                    ))}
                  </SimpleGrid>
                </Stack>
              )}
            </Stack>
          </Grid.Col>
        </Grid>

        <ChangeHistory history={changesData[wyrm.name]} />

        <DetailPageNavigation
          previousItem={
            previousWyrm
              ? { label: previousWyrm.name, path: `/wyrms/${toEntitySlug(previousWyrm.name)}` }
              : null
          }
          nextItem={
            nextWyrm
              ? { label: nextWyrm.name, path: `/wyrms/${toEntitySlug(nextWyrm.name)}` }
              : null
          }
        />
      </Container>
    </Box>
  );
}
