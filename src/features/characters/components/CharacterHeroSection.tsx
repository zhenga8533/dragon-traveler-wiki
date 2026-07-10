import type { Illustration } from '@/assets';
import { GlobalBadge, SafeImage } from '@/components';
import { useState } from 'react';
import LastUpdated from '@/components/common/LastUpdated';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ClassTag from '@/components/ui/ClassTag';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import SafeVideo from '@/components/ui/SafeVideo';
import { QUALITY_BORDER_COLOR } from '@/constants/quality';
import { CHARACTER_HERO } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import { getCharacterRoutePath } from '@/features/characters/utils/character-route';
import { useDarkMode } from '@/hooks';
import {
  Box,
  Center,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import CharacterPortrait from './CharacterPortrait';

function getFullBodyHeight(aspectRatio: number): number {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return 135;
  return 60 + 75 / aspectRatio;
}

interface CharacterPageHeroSectionProps {
  character: Character;
  activeIllustration: Illustration | null;
  fullBodySrc?: string | null;
  assetKey?: string;
  isNew?: boolean;
}

export default function CharacterPageHeroSection({
  character,
  activeIllustration,
  fullBodySrc,
  assetKey,
  isNew = false,
}: CharacterPageHeroSectionProps) {
  const isDark = useDarkMode();
  const [fullBodyMeasurement, setFullBodyMeasurement] = useState<{
    src: string;
    height: number;
  } | null>(null);
  const fullBodyHeight =
    fullBodyMeasurement && fullBodyMeasurement.src === fullBodySrc
      ? fullBodyMeasurement.height
      : null;
  const heroBlurFilter = isDark
    ? `blur(${CHARACTER_HERO.BLUR_AMOUNT}) brightness(${CHARACTER_HERO.BRIGHTNESS})`
    : `blur(${CHARACTER_HERO.BLUR_AMOUNT}) brightness(1.2) saturate(1.05)`;

  return (
    <Box
      style={{
        position: 'relative',
        minHeight: CHARACTER_HERO.MIN_HEIGHT,
        overflow: 'hidden',
        background: 'var(--mantine-color-body)',
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
        <SafeVideo
          src={activeIllustration.src}
          autoPlay
          loop
          muted
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

      {fullBodySrc && (
        <Container
          size="lg"
          visibleFrom="md"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          <Box
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: '40%',
              height: 'calc(100% - 32px)',
              maskImage:
                'linear-gradient(to right, transparent 0%, black 24%, black 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, black 24%, black 100%)',
            }}
          >
            <SafeImage
              src={fullBodySrc}
              alt=""
              loading="eager"
              onLoad={(event) => {
                const image = event.currentTarget;
                const aspectRatio = image.naturalWidth / image.naturalHeight;
                // Narrow canvases need more enlargement to occupy comparable
                // visual space; wide canvases need less to avoid crowding text.
                const height = getFullBodyHeight(aspectRatio);
                setFullBodyMeasurement({ src: fullBodySrc, height });
              }}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: 'auto',
                maxWidth: 'none',
                height: `${fullBodyHeight ?? 130}%`,
                opacity: fullBodyHeight == null ? 0 : 1,
                transition: 'opacity 160ms ease',
                maskImage:
                  'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
              }}
            />
          </Box>
        </Container>
      )}

      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'transparent'
            : 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.75))',
          pointerEvents: 'none',
        }}
      />

      {/* Content overlay */}
      <Container
        size="lg"
        style={{ position: 'relative', zIndex: 1 }}
        py={{ base: 'xl', sm: 50 }}
      >
        <Grid
          gutter={{ base: 'md', sm: 'xl' }}
          align="center"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Portrait */}
          <Grid.Col span={{ base: 12, sm: 'content' }}>
            <Center>
              <CharacterPortrait
                name={character.name}
                size={CHARACTER_HERO.PORTRAIT_SIZE}
                quality={character.quality}
                assetKey={assetKey}
                routePath={getCharacterRoutePath(character)}
                borderWidth={CHARACTER_HERO.BORDER_WIDTH}
                borderColor={QUALITY_BORDER_COLOR[character.quality]}
                style={{ boxShadow: 'var(--mantine-shadow-xl)' }}
                loading="eager"
                isNew={isNew}
              />
            </Center>
          </Grid.Col>

          {/* Character Info */}
          <Grid.Col span={{ base: 12, sm: 'auto' }}>
            <Stack gap="md">
              <Stack gap={4}>
                <Breadcrumbs
                  items={[
                    { label: 'Characters', path: '/characters' },
                    { label: character.name },
                  ]}
                />

                <Group gap="md" align="center" wrap="wrap">
                  <Title
                    order={1}
                    c="var(--mantine-color-text)"
                    fz={{ base: '2.25rem', sm: '3rem' }}
                    lh={1}
                    style={{ wordBreak: 'break-word' }}
                  >
                    {character.name}
                  </Title>
                  <QualityIcon quality={character.quality} size={32} />
                </Group>

                {character.title && (
                  <Text
                    size="md"
                    fw={500}
                    c="dimmed"
                    style={{ letterSpacing: '0.01em' }}
                  >
                    {character.title}
                  </Text>
                )}
                {character.origin && (
                  <Text size="sm" fw={400} c="dimmed">
                    {character.origin}
                  </Text>
                )}
              </Stack>

              <Stack gap="sm">
                {/* Gameplay Attributes */}
                <Group gap="xs" wrap="wrap">
                  <ClassTag
                    characterClass={character.character_class}
                    size="lg"
                  />
                  <GlobalBadge isGlobal={character.is_global} size="lg" />
                </Group>

                {/* Factions */}
                <Group gap="xs">
                  {character.factions.map((f) => (
                    <FactionTag key={f} faction={f} size="md" />
                  ))}
                </Group>

                {/* Secondary Metadata: HT, WT */}
                <Group gap="md" wrap="wrap" align="center">
                  <Group gap="sm">
                    {character.height && (
                      <Text size="sm" c="dimmed">
                        HT: {character.height}
                      </Text>
                    )}
                    {character.weight && (
                      <Text size="sm" c="dimmed">
                        WT: {character.weight}
                      </Text>
                    )}
                  </Group>
                </Group>

                {/* Last Updated */}
                {character.last_updated != null && (
                  <LastUpdated timestamp={character.last_updated} />
                )}
              </Stack>
            </Stack>
          </Grid.Col>

          {fullBodySrc && (
            <Grid.Col visibleFrom="md" span={4} aria-hidden="true" />
          )}
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
  );
}
