import { Group, Image, Stack, Text } from '@mantine/core';
import { useContext } from 'react';
import { getResourceIcon } from '../../assets/resource';
import { WHITE_SPACE_PRE_LINE_STYLE } from '../../constants/styles';
import { IMAGE_SIZE } from '../../constants/ui';
import { ResourcesContext } from '../../contexts';
import IconBadge from './IconBadge';
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
  const { resources } = useContext(ResourcesContext);

  const iconSrc = getResourceIcon(name);
  const resource = resources.find(
    (r) => r.name.toLowerCase() === name.toLowerCase()
  );

  const iconSize = size === 'xs' ? IMAGE_SIZE.ICON_XS : IMAGE_SIZE.ICON_SM;
  const label = `${name}${quantity != null ? ` x${quantity.toLocaleString()}` : ''}`;

  return (
    <IconBadge
      label={label}
      color="yellow"
      size={size}
      iconSrc={iconSrc ?? undefined}
      iconSize={iconSize}
      component="span"
      popoverContent={
        resource ? (
          <Stack gap="xs" maw={280}>
            <Group gap="xs" wrap="nowrap">
              {iconSrc && <Image src={iconSrc} alt={name} w={18} h={18} />}
              <Text fw={600} size="sm">
                {resource.name}
              </Text>
            </Group>
            <Text size="xs" style={WHITE_SPACE_PRE_LINE_STYLE} component="span">
              <InlineMarkup text={resource.description} />
            </Text>
          </Stack>
        ) : undefined
      }
    />
  );
}
