import type { CharacterIllustration } from '@/assets/character';
import { GlobalBadge } from '@/components';
import LastUpdated from '@/components/common/LastUpdated';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ClassTag from '@/components/ui/ClassTag';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import { QUALITY_BORDER_COLOR } from '@/constants/colors';
import { CHARACTER_HERO } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
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

interface CharacterPageHeroSectionProps {
  character: Character;
  activeIllustration: CharacterIllustration | null;
  isNew?: boolean;
}

export default function CharacterPageHeroSection({
  character,
  activeIllustration,
  isNew = false,
}: CharacterPageHeroSectionProps) {
  const isDark = useDarkMode();
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
        py={{ base: 'xl', sm: 50 }}
      >
        <Grid gutter={{ base: 'md', sm: 'xl' }} align="center">
          {/* Portrait */}
          <Grid.Col span={{ base: 12, sm: 'content' }}>
            <Center>
              <CharacterPortrait
                name={character.name}
                size={CHARACTER_HERO.PORTRAIT_SIZE}
                quality={character.quality}
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
                    c={isDark ? 'white' : 'dark'}
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
                    size="lg"
                    fw={600}
                    c={isDark ? 'gray.4' : 'gray.7'}
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
                <Group gap={8}>
                  {character.factions.map((f) => (
                    <FactionTag key={f} faction={f} size="md" />
                  ))}
                </Group>

                {/* Secondary Metadata: HT, WT */}
                <Group gap="md" wrap="wrap" align="center">
                  <Group gap="sm">
                    {character.height && (
                      <Text size="sm" c="dimmed" fw={500}>
                        HT: {character.height}
                      </Text>
                    )}
                    {character.weight && (
                      <Text size="sm" c="dimmed" fw={500}>
                        WT: {character.weight}
                      </Text>
                    )}
                  </Group>
                </Group>

                {/* Last Updated */}
                <LastUpdated timestamp={character.last_updated} />
              </Stack>
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
  );
}
