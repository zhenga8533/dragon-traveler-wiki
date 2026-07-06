import type { Illustration } from '@/assets';
import SafeImage from '@/components/ui/SafeImage';
import SafeVideo from '@/components/ui/SafeVideo';
import { StaticSurface } from '@/components/ui/Surface';
import { NAV_ITEM_HEIGHT } from '@/constants/ui';
import { useGradientAccent } from '@/hooks';
import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IoChevronBack, IoChevronForward, IoExpand } from 'react-icons/io5';

interface CharacterIllustrationPanelProps {
  characterName: string;
  activeIllustration: Illustration | null;
  activeIllustrationIndex: number;
  illustrationsLength: number;
  hasMultipleIllustrations: boolean;
  isDesktop: boolean | undefined;
  onOpenPreview: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function CharacterIllustrationPanel({
  characterName,
  activeIllustration,
  activeIllustrationIndex,
  illustrationsLength,
  hasMultipleIllustrations,
  isDesktop,
  onOpenPreview,
  onPrevious,
  onNext,
}: CharacterIllustrationPanelProps) {
  const { accent } = useGradientAccent();
  const activeIllustrationName = activeIllustration?.name;

  if (!activeIllustration || illustrationsLength === 0) {
    return (
      <StaticSurface p="xl" radius="lg">
        <Center h={300}>
          <Text c="dimmed">No illustrations available</Text>
        </Center>
      </StaticSurface>
    );
  }

  return (
    <StaticSurface p="md" radius="lg" style={{ overflow: 'hidden' }}>
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text fw={600} size="sm">
            Illustrations
          </Text>
          {activeIllustrationIndex >= 0 &&
            (hasMultipleIllustrations ? (
              <Group gap={2} align="center">
                <ActionIcon
                  onClick={onPrevious}
                  variant="subtle"
                  color={accent.primary}
                  size="sm"
                  aria-label="Previous illustration"
                >
                  <IoChevronBack />
                </ActionIcon>
                <Text size="xs" c="dimmed">
                  {activeIllustrationIndex + 1}/{illustrationsLength}
                </Text>
                <ActionIcon
                  onClick={onNext}
                  variant="subtle"
                  color={accent.primary}
                  size="sm"
                  aria-label="Next illustration"
                >
                  <IoChevronForward />
                </ActionIcon>
              </Group>
            ) : (
              <Text size="xs" c="dimmed">
                {activeIllustrationIndex + 1}/{illustrationsLength}
              </Text>
            ))}
        </Group>
        <UnstyledButton
          onClick={onOpenPreview}
          style={{
            display: 'block',
            width: '100%',
            minHeight: isDesktop ? undefined : NAV_ITEM_HEIGHT,
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {activeIllustration.type === 'video' ? (
            <SafeVideo
              src={activeIllustration.src}
              autoPlay
              muted
              loop
              style={{
                width: '100%',
                maxHeight: 420,
                display: 'block',
              }}
            />
          ) : (
            <SafeImage
              src={activeIllustration.src}
              alt={`${characterName} - ${activeIllustration.name}`}
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
                {activeIllustrationName ?? characterName}
              </Text>
              <Text size="xs" c="gray.2">
                {activeIllustration.type === 'video' ? 'Animation' : 'Artwork'}
              </Text>
            </Stack>
            <Badge
              leftSection={<IoExpand />}
              variant="light"
              color={accent.primary}
              size="md"
            >
              View
            </Badge>
          </Group>
        </UnstyledButton>
      </Stack>
    </StaticSurface>
  );
}
