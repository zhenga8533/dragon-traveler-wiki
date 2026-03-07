import { Badge, Button, Group } from '@mantine/core';
import { useContext } from 'react';
import { IoFilter } from 'react-icons/io5';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../../contexts';
import type { ViewMode } from '../../hooks/use-filters';
import ViewToggle from '../common/ViewToggle';

interface PageFilterHeaderControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterCount: number;
  onFilterToggle: () => void;
  isMobile: boolean | undefined;
  buttonLabel?: string;
}

export default function PageFilterHeaderControls({
  viewMode,
  onViewModeChange,
  filterCount,
  onFilterToggle,
  isMobile,
  buttonLabel = 'Filters',
}: PageFilterHeaderControlsProps) {
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];

  return (
    <Group gap="xs">
      <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
      <Button
        variant="default"
        color={accent.primary}
        size={isMobile ? 'sm' : 'xs'}
        leftSection={<IoFilter size={16} />}
        rightSection={
          filterCount > 0 ? (
            <Badge size="xs" circle variant="filled" color={accent.primary}>
              {filterCount}
            </Badge>
          ) : null
        }
        onClick={onFilterToggle}
      >
        {buttonLabel}
      </Button>
    </Group>
  );
}
