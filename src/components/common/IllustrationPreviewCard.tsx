import SafeImage from '@/components/ui/SafeImage';
import { getCardHoverProps } from '@/constants/styles';
import { BREAKPOINTS } from '@/constants/ui';
import { Badge, Box, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useState } from 'react';
import { IoExpand } from 'react-icons/io5';

interface IllustrationPreviewCardProps {
  src: string;
  name: string;
  type?: 'image' | 'video';
  subtitle?: string;
  label?: string;
  accentColor: string;
  onExpand: () => void;
}

export default function IllustrationPreviewCard({
  src,
  name,
  type = 'image',
  subtitle = 'Artwork',
  label = 'Illustration',
  accentColor,
  onExpand,
}: IllustrationPreviewCardProps) {
  const isDesktop = useMediaQuery(BREAKPOINTS.DESKTOP);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <Paper
      p="md"
      radius="lg"
      withBorder
      {...getCardHoverProps({ style: { overflow: 'hidden' } })}
    >
      <Stack gap="xs">
        <Text fw={600} size="sm">
          {label}
        </Text>
        <UnstyledButton
          onClick={onExpand}
          style={{
            display: 'block',
            width: '100%',
            minHeight: isDesktop ? undefined : 44,
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {type === 'video' ? (
            <Box
              component="video"
              src={src}
              autoPlay
              muted
              loop
              playsInline
              onError={() => setFailed(true)}
              style={{ width: '100%', maxHeight: 420, display: 'block', objectFit: 'contain' }}
            />
          ) : (
            <SafeImage src={src} alt={name} fit="contain" mah={420} loading="lazy" />
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
            style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}
          >
            <Stack gap={2}>
              <Text size="sm" fw={600} c="white">
                {name}
              </Text>
              <Text size="xs" c="gray.2">
                {subtitle}
              </Text>
            </Stack>
            <Badge
              leftSection={<IoExpand />}
              variant="light"
              color={accentColor}
              size={isDesktop ? 'md' : 'lg'}
            >
              View
            </Badge>
          </Group>
        </UnstyledButton>
      </Stack>
    </Paper>
  );
}
