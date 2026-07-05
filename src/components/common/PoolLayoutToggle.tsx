import { ActionIcon, Group, Tooltip } from '@mantine/core';
import type { PoolLayout } from '@/hooks';
import { useGradientAccent, useIsMobile, useMobileTooltip } from '@/hooks';

function BelowLayoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="9" width="14" height="6" rx="1" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function SideLayoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="8.5" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10.5" y="1" width="4.5" height="14" rx="1" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

interface PoolLayoutToggleProps {
  layout: PoolLayout;
  onChange: (layout: PoolLayout) => void;
}

export default function PoolLayoutToggle({
  layout,
  onChange,
}: PoolLayoutToggleProps) {
  const isMobile = useIsMobile();
  const { accent } = useGradientAccent();
  const mobileTooltip = useMobileTooltip();

  return (
    <Group gap={4}>
      <Tooltip label="Pool below" {...mobileTooltip}>
        <ActionIcon
          variant={layout === 'below' ? 'filled' : 'default'}
          color={layout === 'below' ? accent.primary : undefined}
          size={isMobile ? 'lg' : 'sm'}
          onClick={() => onChange('below')}
          aria-label="Show character pool below"
          aria-pressed={layout === 'below'}
        >
          <BelowLayoutIcon />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Pool side-by-side" {...mobileTooltip}>
        <ActionIcon
          variant={layout === 'side' ? 'filled' : 'default'}
          color={layout === 'side' ? accent.primary : undefined}
          size={isMobile ? 'lg' : 'sm'}
          onClick={() => onChange('side')}
          aria-label="Show character pool side-by-side"
          aria-pressed={layout === 'side'}
        >
          <SideLayoutIcon />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
