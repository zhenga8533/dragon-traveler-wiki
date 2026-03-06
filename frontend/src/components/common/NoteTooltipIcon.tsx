import { Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { IoInformationCircle } from 'react-icons/io5';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../../contexts';

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
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];
  const isCoarsePointer = useMediaQuery('(hover: none), (pointer: coarse)');
  const hasTouchSupport = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
    );
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const isTouchDevice = isCoarsePointer || hasTouchSupport;

  useEffect(() => {
    if (!isTouchDevice || !isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (triggerRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isTouchDevice, isOpen]);

  const preventBubble = (event: {
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    if (!stopPropagation) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const iconBorderColor = 'var(--mantine-color-body)';
  const iconShadow = 'var(--mantine-shadow-xs)';

  return (
    <Tooltip
      label={note}
      multiline
      maw={tooltipMaxWidth}
      withArrow
      opened={isTouchDevice ? isOpen : undefined}
      events={
        isTouchDevice
          ? { hover: false, focus: false, touch: false }
          : { hover: true, focus: true, touch: false }
      }
      openDelay={isTouchDevice ? 0 : 120}
      closeDelay={isTouchDevice ? 0 : 120}
      offset={offset}
      zIndex={zIndex}
    >
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-expanded={isTouchDevice ? isOpen : undefined}
        style={{ lineHeight: 0, cursor: 'pointer', ...wrapperStyle }}
        onMouseDown={(event) => {
          preventBubble(event);
        }}
        onClick={(event) => {
          preventBubble(event);
          if (isTouchDevice) {
            setIsOpen((prev) => !prev);
          }
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          event.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
      >
        <span>
          <IoInformationCircle
            size={size}
            color={`var(--mantine-color-${accent.primary}-filled)`}
            style={{
              background: 'var(--mantine-color-body)',
              border: `1px solid ${iconBorderColor}`,
              boxShadow: iconShadow,
              borderRadius: '50%',
            }}
          />
        </span>
      </div>
    </Tooltip>
  );
}
