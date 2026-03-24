import type { CharacterIllustration } from '@/assets/character';
import LastUpdated from '@/components/common/LastUpdated';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { QUALITY_BORDER_COLOR } from '@/constants/colors';
import { CHARACTER_HERO } from '@/constants/ui';
import ClassTag from '@/components/ui/ClassTag';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import type { Character } from '@/features/characters/types';
import GlobalBadge from '@/components/ui/GlobalBadge';
import TierBadge from '@/components/ui/TierBadge';
import { useDarkMode } from '@/hooks';
import CharacterPortrait from './CharacterPortrait';
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

interface CharacterPageHeroSectionProps {
  character: Character;
  tierLabel: string | null;
  activeIllustration: CharacterIllustration | null;
  isNew?: boolean;
}

export default function CharacterPageHeroSection({
  character,
  tierLabel,
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
        py={{ base: 'lg', sm: 'xl' }}
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
                style={{ boxShadow: 'var(--mantine-shadow-lg)' }}
                loading="eager"
                isNew={isNew}
              />
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

              <Group gap="md" align="center" wrap="wrap">
                <Title
                  order={1}
                  c={isDark ? 'white' : 'dark'}
                  fz={{ base: '1.5rem', sm: '2.125rem' }}
                  style={{ wordBreak: 'break-word' }}
                >
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

              <Group gap="sm" wrap="wrap">
                <QualityIcon quality={character.quality} size={24} />

                {tierLabel && <TierBadge tier={tierLabel} size="lg" />}

                <ClassTag characterClass={character.character_class} />
              </Group>

              <Group gap="sm" wrap="wrap">
                {character.factions.map((f) => (
                  <FactionTag key={f} faction={f} size="lg" />
                ))}
              </Group>

              {(character.height || character.weight) && (
                <Group gap="md" wrap="wrap">
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
          background: 'linear-gradient(transparent, var(--mantine-color-body))',
          height: 100,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}
