import {
  Box,
  Center,
  Container,
  Grid,
  Group,
  Image,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { QUALITY_ICON_MAP } from '../../assets/quality';
import type { CharacterIllustration } from '../../assets/character';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import ClassLabel from '../../components/common/ClassLabel';
import FactionTag from '../../components/common/FactionTag';
import GlobalBadge from '../../components/common/GlobalBadge';
import LastUpdated from '../../components/common/LastUpdated';
import TierBadge from '../../components/common/TierBadge';
import { QUALITY_COLOR } from '../../constants/colors';
import type { Character } from '../../types/character';

interface CharacterPageHeroSectionProps {
  character: Character;
  portrait: string | undefined;
  isDark: boolean;
  tierLabel: string | null;
  activeIllustration: CharacterIllustration | null;
}

export default function CharacterPageHeroSection({
  character,
  portrait,
  isDark,
  tierLabel,
  activeIllustration,
}: CharacterPageHeroSectionProps) {
  const heroBlurFilter = isDark
    ? 'blur(20px) brightness(0.4)'
    : 'blur(20px) brightness(1.2) saturate(1.05)';

  return (
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
                  <TierBadge tier={tierLabel} size="lg" />
                )}

                <ClassLabel characterClass={character.character_class} />
              </Group>

              <Group gap="sm">
                {character.factions.map((f) => (
                  <FactionTag key={f} faction={f} size="lg" />
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
  );
}
