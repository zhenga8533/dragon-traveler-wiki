import { getPortrait } from '@/assets/character';
import { QUALITY_BORDER_COLOR } from '@/constants/colors';
import { CharacterOwnershipContext } from '@/contexts';
import type { Character } from '@/features/characters/types';
import {
  buildCharacterNameCounts,
  getCharacterBaseSlug,
  getCharacterIdentityKey,
} from '@/features/characters/utils/character-route';
import { useDarkMode, useGradientAccent, useStarLevels } from '@/hooks';
import {
  buildStarLevels,
  type StarLevel,
  type StarTier,
} from '@/types/star-level';
import { downloadElementAsPng } from '@/utils/export-image';
import {
  ActionIcon,
  Box,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import * as d3 from 'd3-hierarchy';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { IoBarChart, IoContract, IoDownload, IoExpand, IoRemove } from 'react-icons/io5';
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from 'react-zoom-pan-pinch';

// ── Tier glow colors ────────────────────────────────────────────────────────

const TIER_GLOW: Record<StarTier, string> = {
  base: '#9e9e9e',
  purple: '#ce93d8',
  red: '#ef9a9a',
  legendary: '#ffcc02',
  divine: '#80deea',
};

// ── Bubble radius ────────────────────────────────────────────────────────────

/** Area ∝ copies so radius ∝ √copies (standard area-encoding). */
function getBubbleRadius(copies: number): number {
  return Math.round(18 + Math.sqrt(Math.max(copies, 1)) * 8);
}

// ── Types ───────────────────────────────────────────────────────────────────

interface BubbleItem {
  identityKey: string;
  char: Character;
  starLevel: StarLevel;
  displayName: string;
  /** Desired radius, used as d3 pack value (r² ∝ area ∝ copies). */
  r: number;
  portrait: string | undefined;
  tierColor: string;
  qualityBorder: string;
}

// ── D3 circle packing ────────────────────────────────────────────────────────

const PACK_SIZE = 900;

/**
 * Uses d3-hierarchy's `pack()` to lay out bubbles.
 * Returns positions relative to a PACK_SIZE × PACK_SIZE canvas,
 * with actual radii from d3 (proportional to each item's r²).
 */
function packWithD3(
  bubbles: BubbleItem[]
): Array<{ x: number; y: number; r: number }> {
  if (bubbles.length === 0) return [];

  type Root = { children?: BubbleItem[] };

  const root = d3
    .hierarchy<Root>({ children: bubbles })
    .sum((d) => {
      const item = d as unknown as BubbleItem;
      return item.r != null ? item.r * item.r : 0;
    });

  const packed = d3.pack<Root>()
    .size([PACK_SIZE, PACK_SIZE])
    .padding(3)(root);

  return packed.leaves().map((leaf) => ({
    x: leaf.x ?? 0,
    y: leaf.y ?? 0,
    r: leaf.r,
  }));
}

// ── Chart canvas ─────────────────────────────────────────────────────────────

interface BubbleCanvasProps {
  bubbles: BubbleItem[];
  /** Packed positions with actual radii from d3, in the same order as bubbles. */
  positions: Array<{ x: number; y: number; r: number }>;
  interactive: boolean;
}

function BubbleCanvas({
  bubbles,
  positions,
  interactive,
}: BubbleCanvasProps) {
  if (bubbles.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center" py="xl">
        No owned characters to display. Set star levels in My Characters.
      </Text>
    );
  }

  // d3 pack outputs positions in [0, PACK_SIZE] space — fit to content
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  positions.forEach(({ x, y, r }) => {
    minX = Math.min(minX, x - r);
    maxX = Math.max(maxX, x + r);
    minY = Math.min(minY, y - r);
    maxY = Math.max(maxY, y + r);
  });

  const PAD = 12;
  const w = Math.ceil(maxX - minX + PAD * 2);
  const h = Math.ceil(maxY - minY + PAD * 2);
  const ox = -minX + PAD;
  const oy = -minY + PAD;

  return (
    <Box
      style={{ position: 'relative', width: w, height: h, margin: '0 auto' }}
    >
      {bubbles.map((b, idx) => {
        const { x, y, r } = positions[idx];
        const cx = x + ox;
        const cy = y + oy;
        const d = r * 2;

        const inner = (
          <Box
            style={{
              position: 'absolute',
              left: Math.round(cx - r),
              top: Math.round(cy - r),
              width: d,
              height: d,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${b.qualityBorder}`,
              boxShadow: `0 0 0 1.5px ${b.tierColor}99, 0 0 10px ${b.tierColor}66`,
              cursor: interactive ? 'default' : undefined,
            }}
          >
            <img
              src={
                b.portrait ??
                `https://placehold.co/${d}x${d}?text=${encodeURIComponent(
                  b.char.name.charAt(0)
                )}`
              }
              alt={b.char.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </Box>
        );

        if (!interactive) return inner;

        return (
          <Tooltip
            key={b.identityKey}
            label={`${b.displayName} · ${b.starLevel.label} · ${b.starLevel.copies} ${b.starLevel.copies === 1 ? 'copy' : 'copies'}`}
            withArrow
            withinPortal
          >
            {inner}
          </Tooltip>
        );
      })}
    </Box>
  );
}

// ── Zoom controls ────────────────────────────────────────────────────────────

function ZoomControls({ accent }: { accent: string }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <Group
      gap={4}
      style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 10 }}
    >
      <Tooltip label="Zoom in" withArrow>
        <ActionIcon variant="light" color={accent} size="sm" onClick={() => zoomIn()}>
          <IoExpand size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Zoom out" withArrow>
        <ActionIcon variant="light" color={accent} size="sm" onClick={() => zoomOut()}>
          <IoRemove size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Reset view" withArrow>
        <ActionIcon variant="light" color={accent} size="sm" onClick={() => resetTransform()}>
          <IoContract size={13} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface StarLevelBubbleChartProps {
  characters: Character[];
  opened: boolean;
  onClose: () => void;
}

export default function StarLevelBubbleChart({
  characters,
  opened,
  onClose,
}: StarLevelBubbleChartProps) {
  const { ownedCharacters } = useContext(CharacterOwnershipContext);
  const { data: rawStarLevels } = useStarLevels();
  const starLevels = useMemo(
    () => buildStarLevels(rawStarLevels),
    [rawStarLevels]
  );
  const starLevelMap = useMemo(
    () => new Map(starLevels.map((sl) => [sl.value, sl])),
    [starLevels]
  );
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();

  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const charByIdentity = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) map.set(getCharacterIdentityKey(c), c);
    return map;
  }, [characters]);

  const characterNameCounts = useMemo(
    () => buildCharacterNameCounts(characters),
    [characters]
  );

  // Build bubble items
  const bubbles = useMemo((): BubbleItem[] => {
    const items: BubbleItem[] = [];
    for (const [identityKey, levelValue] of Object.entries(ownedCharacters)) {
      const char = charByIdentity.get(identityKey);
      const starLevel = starLevelMap.get(levelValue);
      if (!char || !starLevel) continue;
      const isMultiQuality =
        (characterNameCounts.get(getCharacterBaseSlug(char.name)) ?? 1) > 1;
      items.push({
        identityKey,
        char,
        starLevel,
        displayName: isMultiQuality ? `${char.name} (${char.quality})` : char.name,
        r: getBubbleRadius(starLevel.copies),
        portrait: getPortrait(char.name, undefined, char.quality),
        tierColor: TIER_GLOW[starLevel.tier],
        qualityBorder: QUALITY_BORDER_COLOR[char.quality] ?? '#9e9e9e',
      });
    }
    // Largest circles first for best packing aesthetics
    return items.sort((a, b) => b.r - a.r);
  }, [ownedCharacters, charByIdentity, starLevelMap]);

  // Compute packed positions via d3 (memoized — only recomputes when bubbles change)
  const positions = useMemo(() => packWithD3(bubbles), [bubbles]);

  // Export effect
  useEffect(() => {
    if (!isExporting) return;
    const el = exportRef.current;
    if (!el) {
      setIsExporting(false);
      return;
    }
    const run = async () => {
      await new Promise((r) => setTimeout(r, 200));
      try {
        await downloadElementAsPng(el, 'character-investment-chart', isDark);
      } finally {
        setIsExporting(false);
      }
    };
    run();
  }, [isExporting, isDark]);

  const ownedCount = Object.keys(ownedCharacters).length;

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="xs">
            <IoBarChart size={16} />
            <Text fw={600}>Investment Chart</Text>
            {ownedCount > 0 && (
              <Text size="sm" c="dimmed">
                ({ownedCount} characters)
              </Text>
            )}
          </Group>
        }
        size="xl"
      >
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              Circle size reflects copies invested. Border = quality. Glow =
              star tier.
            </Text>
            <Tooltip label="Export as image" withArrow>
              <ActionIcon
                variant="light"
                color={accent.primary}
                size="sm"
                loading={isExporting}
                onClick={() => setIsExporting(true)}
                aria-label="Export investment chart"
                disabled={bubbles.length === 0}
              >
                <IoDownload size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Box
            style={{
              position: 'relative',
              height: '60vh',
              overflow: 'hidden',
              borderRadius: 8,
              border: '1px solid var(--mantine-color-default-border)',
              cursor: 'grab',
            }}
          >
            <TransformWrapper
              minScale={0.2}
              maxScale={4}
              centerOnInit
              limitToBounds={false}
            >
              <ZoomControls accent={accent.primary} />
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ padding: 24 }}
              >
                <BubbleCanvas
                  bubbles={bubbles}
                  positions={positions}
                  interactive
                />
              </TransformComponent>
            </TransformWrapper>
          </Box>
        </Stack>
      </Modal>

      {isExporting && (
        <Box
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: '-100000px',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <Box
            ref={exportRef}
            style={{
              width: 900,
              backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
              padding: 24,
            }}
          >
            <Stack gap="sm" mb={12}>
              <Group gap="xs">
                <IoBarChart size={18} />
                <Text fw={700} size="lg">
                  Character Investment Chart
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                {ownedCount} characters · circle size = copies invested
              </Text>
            </Stack>
            <BubbleCanvas
              bubbles={bubbles}
              positions={positions}
              interactive={false}
            />
          </Box>
        </Box>
      )}
    </>
  );
}
