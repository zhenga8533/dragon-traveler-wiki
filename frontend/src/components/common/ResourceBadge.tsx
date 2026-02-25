import { Badge, Group, Image, Popover, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useContext } from 'react';
import { getResourceIcon } from '../../assets/resource';
import { ResourcesContext } from '../../contexts';
import InlineMarkup from './InlineMarkup';

export interface ResourceBadgeProps {
  /** Resource name (must match a name in resources.json). */
  name: string;
  /** Optional quantity — omitted when not applicable. */
  quantity?: number;
  /** Badge size passed to Mantine Badge. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function ResourceBadge({
  name,
  quantity,
  size = 'sm',
}: ResourceBadgeProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const { resources } = useContext(ResourcesContext);

  const iconSrc = getResourceIcon(name);
  const resource = resources.find(
    (r) => r.name.toLowerCase() === name.toLowerCase()
  );

  const iconSize = size === 'xs' ? 12 : 14;

  const badge = (
    <Badge
      variant="light"
      color="yellow"
      size={size}
      component="span"
      style={resource ? { cursor: 'pointer' } : undefined}
      onMouseEnter={resource ? open : undefined}
      onMouseLeave={resource ? close : undefined}
      leftSection={
        iconSrc ? (
          <Image
            src={iconSrc}
            w={iconSize}
            h={iconSize}
            style={{ objectFit: 'contain' }}
          />
        ) : undefined
      }
    >
      {name}
      {quantity != null && ` x${quantity.toLocaleString()}`}
    </Badge>
  );

  if (!resource) return badge;

  return (
    <Popover opened={opened} position="top" withArrow shadow="md">
      <Popover.Target>{badge}</Popover.Target>
      <Popover.Dropdown style={{ pointerEvents: 'none' }}>
        <Stack gap="xs" maw={280}>
          <Group gap="xs" wrap="nowrap">
            {iconSrc && <Image src={iconSrc} alt={name} w={18} h={18} />}
            <Text fw={600} size="sm">
              {resource.name}
            </Text>
          </Group>
          <Text size="xs" style={{ whiteSpace: 'pre-line' }} component="span">
            <InlineMarkup text={resource.description} />
          </Text>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
