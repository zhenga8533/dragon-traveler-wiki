import { Tooltip } from '@mantine/core';
import type { CSSProperties } from 'react';
import { IoInformationCircle } from 'react-icons/io5';
import { useGradientAccent } from '@/hooks';

interface NoteTooltipIconProps {
  note: string;
  ariaLabel: string;
  size?: number;
  wrapperStyle?: CSSProperties;
  tooltipMaxWidth?: number;
  stopPropagation?: boolean;
  offset?: number;
  zIndex?: number;
}

export default function NoteTooltipIcon({
  note,
  ariaLabel,
  size = 18,
  wrapperStyle,
  tooltipMaxWidth = 280,
  stopPropagation = false,
  offset = 6,
  zIndex = 700,
}: NoteTooltipIconProps) {
  const { accent } = useGradientAccent();

  const preventBubble = stopPropagation
    ? (e: { preventDefault(): void; stopPropagation(): void }) => {
        e.preventDefault();
        e.stopPropagation();
      }
    : undefined;

  return (
    <Tooltip
      label={note}
      multiline
      maw={tooltipMaxWidth}
      withArrow
      openDelay={120}
      closeDelay={120}
      events={{ hover: true, focus: true, touch: true }}
      offset={offset}
      zIndex={zIndex}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        style={{ lineHeight: 0, cursor: 'pointer', ...wrapperStyle }}
        onMouseDown={preventBubble}
        onClick={preventBubble}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <span>
          <IoInformationCircle
            size={size}
            color={`var(--mantine-color-${accent.primary}-filled)`}
            style={{
              background: 'var(--mantine-color-body)',
              border: '1px solid var(--mantine-color-body)',
              boxShadow: 'var(--mantine-shadow-xs)',
              borderRadius: '50%',
            }}
          />
        </span>
      </div>
    </Tooltip>
  );
}
