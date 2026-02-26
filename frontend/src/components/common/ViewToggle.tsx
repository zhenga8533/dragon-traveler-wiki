import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IoGrid, IoList } from 'react-icons/io5';
import { BREAKPOINTS, IMAGE_SIZE } from '../../constants/ui';
import type { ViewMode } from '../../hooks/use-filters';

interface ViewToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);

  return (
    <Group gap={4}>
      <Tooltip label="Grid view">
        <ActionIcon
          variant={viewMode === 'grid' ? 'filled' : 'default'}
          size={isMobile ? 'md' : 'sm'}
          onClick={() => onChange('grid')}
          aria-label="Switch to grid view"
        >
          <IoGrid size={IMAGE_SIZE.ICON_MD} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="List view">
        <ActionIcon
          variant={viewMode === 'list' ? 'filled' : 'default'}
          size={isMobile ? 'md' : 'sm'}
          onClick={() => onChange('list')}
          aria-label="Switch to list view"
        >
          <IoList size={IMAGE_SIZE.ICON_MD} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
