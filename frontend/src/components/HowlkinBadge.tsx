import { Badge, Group, HoverCard, Image, Stack, Text, Tooltip } from '@mantine/core';
import { getHowlkinIcon } from '../assets/howlkin';
import { QUALITY_ICON_MAP } from '../assets/quality';
import { QUALITY_COLOR } from '../constants/colors';
import type { Howlkin } from '../types/howlkin';

interface HowlkinBadgeProps {
  name: string;
  howlkin?: Howlkin;
}

export default function HowlkinBadge({ name, howlkin }: HowlkinBadgeProps) {
  const iconSrc = getHowlkinIcon(name);
  const color = howlkin ? QUALITY_COLOR[howlkin.quality] : 'gray';

  const badge = (
    <Badge
      color={color}
      variant="light"
      size="md"
      style={{ cursor: 'default' }}
      leftSection={
        iconSrc ? (
          <Image src={iconSrc} alt={name} w={14} h={14} fit="contain" radius="sm" />
        ) : undefined
      }
    >
      {name}
    </Badge>
  );

  if (!howlkin) return badge;

  const statsEntries = Object.entries(howlkin.basic_stats ?? {}).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <HoverCard width={280} shadow="md" withArrow openDelay={100} closeDelay={50}>
      <HoverCard.Target>{badge}</HoverCard.Target>
      <HoverCard.Dropdown>
        <Stack gap="xs">
          <Group gap="xs" wrap="nowrap">
            {iconSrc && (
              <Image src={iconSrc} alt={name} w={32} h={32} fit="contain" radius="sm" />
            )}
            <div>
              <Text size="sm" fw={700} lh={1.2}>
                {name}
              </Text>
              <Tooltip label={howlkin.quality} withArrow position="right">
                <Image
                  src={QUALITY_ICON_MAP[howlkin.quality]}
                  alt={howlkin.quality}
                  h={16}
                  w="auto"
                  fit="contain"
                  mt={2}
                />
              </Tooltip>
            </div>
          </Group>

          {howlkin.passive_effects.length > 0 && (
            <Stack gap={2}>
              {howlkin.passive_effects.map((e, i) => (
                <Text key={i} size="xs" c="dimmed">
                  {e}
                </Text>
              ))}
            </Stack>
          )}

          {statsEntries.length > 0 && (
            <Group gap={4} wrap="wrap">
              {statsEntries.map(([stat, value]) => (
                <Badge key={stat} variant="light" color="blue" size="xs">
                  {stat}:{' '}
                  {typeof value === 'number'
                    ? value.toLocaleString(undefined, {
                        maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
                      })
                    : String(value)}
                </Badge>
              ))}
            </Group>
          )}
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
