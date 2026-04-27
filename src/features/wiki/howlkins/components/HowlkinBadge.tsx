import { getHowlkinIcon } from '@/assets';
import IconBadge from '@/components/ui/IconBadge';
import QualityIcon from '@/components/ui/QualityIcon';
import { QUALITY_COLOR } from '@/constants/colors';
import type { Howlkin } from '@/features/wiki/howlkins/types';
import { useGradientAccent } from '@/hooks';
import type { MantineSize } from '@mantine/core';
import { Badge, Group, Image, Stack, Text } from '@mantine/core';

interface HowlkinBadgeProps {
  name: string;
  howlkin?: Howlkin;
  size?: MantineSize;
}

export default function HowlkinBadge({
  name,
  howlkin,
  size = 'md',
}: HowlkinBadgeProps) {
  const { accent } = useGradientAccent();
  const iconSrc = getHowlkinIcon(name);
  const color = howlkin ? QUALITY_COLOR[howlkin.quality] : 'gray';

  const statsEntries = Object.entries(howlkin?.basic_stats ?? {}).sort(
    ([a], [b]) => a.localeCompare(b)
  );

  return (
    <IconBadge
      label={name}
      color={color}
      size={size}
      iconSrc={iconSrc ?? undefined}
      popoverContent={
        howlkin ? (
          <Stack gap="xs">
            <Group gap="xs" wrap="nowrap">
              {iconSrc && (
                <Image
                  src={iconSrc}
                  alt={name}
                  w={32}
                  h={32}
                  fit="contain"
                  radius="sm"
                />
              )}
              <div>
                <Text size="sm" fw={700} lh={1.2}>
                  {name}
                </Text>
                <QualityIcon quality={howlkin.quality} size={16} />
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
                  <Badge
                    key={stat}
                    variant="light"
                    color={accent.secondary}
                    size="xs"
                  >
                    {stat}:{' '}
                    {typeof value === 'number'
                      ? value.toLocaleString(undefined, {
                          maximumFractionDigits: Number.isInteger(value)
                            ? 0
                            : 2,
                        })
                      : String(value)}
                  </Badge>
                ))}
              </Group>
            )}
          </Stack>
        ) : undefined
      }
    />
  );
}
