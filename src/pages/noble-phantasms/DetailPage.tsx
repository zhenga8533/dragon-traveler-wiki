import SafeImage from '@/components/ui/SafeImage';
import { getNoblePhantasmIcon } from '@/assets';
import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageHero from '@/components/common/DetailPageHero';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import EntityNotFound from '@/components/ui/EntityNotFound';
import RichText from '@/components/common/RichText';
import { getLoreGlassStyles } from '@/constants/glass';
import {
  getCardHoverProps,
  getHeroIconBoxStyles,
} from '@/constants/styles';
import CharacterTag from '@/features/characters/components/CharacterTag';
import type { Character } from '@/features/characters/types';
import GlobalBadge from '@/components/ui/GlobalBadge';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import EffectTable from '@/features/wiki/noble-phantasms/components/EffectTable';
import SkillTable from '@/features/wiki/noble-phantasms/components/SkillTable';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useDarkMode, useDataFetch, useGradientAccent } from '@/hooks';
import type { ChangesFile } from '@/types/changes';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
  toEntitySlug,
} from '@/utils/entity-slug';
import {
  Box,
  Container,
  Group,
  Paper,
  Stack,
  Title,
} from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function NoblePhantasmPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { accent } = useGradientAccent();
  const isDark = useDarkMode();

  const { data: noblePhantasms, loading } = useDataFetch<NoblePhantasm[]>(
    'data/noble-phantasm.json',
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
  const { data: changesData } = useDataFetch<ChangesFile>(
    'data/changes/noble-phantasm.json',
    {}
  );

  const noblePhantasm = useMemo(() => {
    return findEntityByParam(noblePhantasms, name, (np) => np.name);
  }, [name, noblePhantasms]);

  useEffect(() => {
    if (!noblePhantasm || !name) return;
    if (!shouldRedirectToEntitySlug(name, noblePhantasm.name)) return;
    navigate(`/noble-phantasms/${toEntitySlug(noblePhantasm.name)}`, {
      replace: true,
    });
  }, [name, navigate, noblePhantasm]);

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
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
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
      <DetailPageHero
        isDark={isDark}
        qualityColor={accent.primary}
        secondaryColor={accent.secondary}
        gradientOpacity={{ dark: 0.75, light: 0.95 }}
        breadcrumbItems={[
          { label: 'Noble Phantasms', path: '/noble-phantasms' },
          { label: noblePhantasm.name },
        ]}
      >
        <Group gap="lg" align="flex-start" wrap="nowrap">
          {iconSrc && (
            <Box style={getHeroIconBoxStyles(isDark, accent.primary)}>
              <SafeImage
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
              fz={{ base: '1.5rem', sm: '2.125rem' }}
              style={{ lineHeight: 1.2, wordBreak: 'break-word' }}
            >
              {noblePhantasm.name}
            </Title>
            <LastUpdated timestamp={noblePhantasm.last_updated ?? 0} />

            <Group gap="sm" mt={4}>
              {noblePhantasm.character && (
                <CharacterTag
                  name={noblePhantasm.character}
                  color={accent.secondary}
                  size="lg"
                />
              )}
              {noblePhantasm.is_global !== undefined && (
                <GlobalBadge isGlobal={noblePhantasm.is_global} size="md" />
              )}
            </Group>
          </Stack>
        </Group>

        {noblePhantasm.lore && (
          <Paper
            p="md"
            radius="md"
            withBorder
            {...getCardHoverProps({
              style: getLoreGlassStyles(isDark),
            })}
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
        )}
      </DetailPageHero>

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="xl">
          <Stack gap="md">
            <Title order={2} size="h3">
              Effects
            </Title>
            <EffectTable
              effects={noblePhantasm.effects}
              statusEffects={statusEffects}
              skills={linkedCharacter?.skills}
              talent={linkedCharacter?.talent}
            />
          </Stack>

          <Stack gap="md">
            <Title order={2} size="h3">
              Skill Progression
            </Title>
            <SkillTable
              skills={noblePhantasm.skills}
              statusEffects={statusEffects}
              characterSkills={linkedCharacter?.skills}
              talent={linkedCharacter?.talent}
            />
          </Stack>
        </Stack>

        <ChangeHistory history={changesData[noblePhantasm.name]} />

        <DetailPageNavigation
          previousItem={
            previousNoblePhantasm
              ? {
                  label: previousNoblePhantasm.name,
                  path: `/noble-phantasms/${toEntitySlug(previousNoblePhantasm.name)}`,
                }
              : null
          }
          nextItem={
            nextNoblePhantasm
              ? {
                  label: nextNoblePhantasm.name,
                  path: `/noble-phantasms/${toEntitySlug(nextNoblePhantasm.name)}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
