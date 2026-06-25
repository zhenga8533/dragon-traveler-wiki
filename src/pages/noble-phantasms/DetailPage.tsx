import SafeImage from '@/components/ui/SafeImage';
import { getNoblePhantasmIcon } from '@/assets';
import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageHero from '@/components/common/DetailPageHero';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import EntityNotFound from '@/components/ui/EntityNotFound';
import { getHeroIconBoxStyles } from '@/constants/styles';
import CharacterTag from '@/features/characters/components/CharacterTag';
import EffectTable from '@/features/wiki/noble-phantasms/components/EffectTable';
import SkillTable from '@/features/wiki/noble-phantasms/components/SkillTable';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useNoblePhantasmChanges, useNoblePhantasms, useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import { useDarkMode, useGradientAccent } from '@/hooks';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
} from '@/utils/entity-slug';
import {
  Box,
  Container,
  Group,
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

  const { data: noblePhantasms, loading } = useNoblePhantasms();
  const { data: characters } = useCharacters();
  const { data: statusEffects } = useStatusEffects();
  const { data: changesData } = useNoblePhantasmChanges();

  const noblePhantasm = useMemo(() => {
    return findEntityByParam(noblePhantasms, name, (np) => np.slug);
  }, [name, noblePhantasms]);

  useEffect(() => {
    if (!noblePhantasm || !name) return;
    if (!shouldRedirectToEntitySlug(name, noblePhantasm.slug)) return;
    navigate(`/noble-phantasms/${noblePhantasm.slug}`, { replace: true });
  }, [name, navigate, noblePhantasm]);

  // Match list page: sort by character, then name
  const orderedNoblePhantasms = useMemo(
    () =>
      [...noblePhantasms].sort((a, b) => {
        const charCmp = (a.character_slug ?? '').localeCompare(b.character_slug ?? '');
        if (charCmp !== 0) return charCmp;
        return a.name.localeCompare(b.name);
      }),
    [noblePhantasms]
  );

  const noblePhantasmIndex = useMemo(() => {
    if (!noblePhantasm) return -1;
    return orderedNoblePhantasms.findIndex((entry) => entry.slug === noblePhantasm.slug);
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
    if (!noblePhantasm?.character_slug) return null;
    return characters.find((c) => c.slug === noblePhantasm.character_slug);
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

  const iconSrc = getNoblePhantasmIcon(noblePhantasm.slug);

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

            {linkedCharacter && (
              <Group gap="sm" mt={4}>
                <CharacterTag
                  name={linkedCharacter.name}
                  color={accent.secondary}
                  size="lg"
                />
              </Group>
            )}
          </Stack>
        </Group>
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

        <ChangeHistory history={changesData[noblePhantasm.slug]} />

        <DetailPageNavigation
          previousItem={
            previousNoblePhantasm
              ? {
                  label: previousNoblePhantasm.name,
                  path: `/noble-phantasms/${previousNoblePhantasm.slug}`,
                }
              : null
          }
          nextItem={
            nextNoblePhantasm
              ? {
                  label: nextNoblePhantasm.name,
                  path: `/noble-phantasms/${nextNoblePhantasm.slug}`,
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
