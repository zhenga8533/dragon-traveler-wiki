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
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { IoBarChart, IoDownload } from 'react-icons/io5';

// ── Tier glow colors ────────────────────────────────────────────────────────

const TIER_GLOW: Record<StarTier, string> = {
  base: '#9e9e9e',
  purple: '#ce93d8',
  red: '#ef9a9a',
  legendary: '#ffcc02',
  divine: '#80deea',
};

// ── Circle packing algorithm ────────────────────────────────────────────────

interface PlacedCircle {
  x: number;
  y: number;
  r: number;
}

/** Returns 0, 1, or 2 candidate centres for a circle of radius r that is
 *  simultaneously tangent (externally) to both a and b. */
function tangentToTwo(
  a: PlacedCircle,
  b: PlacedCircle,
  r: number
): Array<{ x: number; y: number }> {
  const ra = a.r + r;
  const rb = b.r + r;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return [];
  const cosA = (ra * ra + d * d - rb * rb) / (2 * ra * d);
  if (cosA < -1 || cosA > 1) return [];
  const acos = Math.acos(cosA);
  const base = Math.atan2(dy, dx);
  return [
    {
      x: a.x + ra * Math.cos(base + acos),
      y: a.y + ra * Math.sin(base + acos),
    },
    {
      x: a.x + ra * Math.cos(base - acos),
      y: a.y + ra * Math.sin(base - acos),
    },
  ];
}

function hasOverlap(
  x: number,
  y: number,
  r: number,
  placed: PlacedCircle[],
  gap = 2
): boolean {
  for (const p of placed) {
    if (Math.hypot(x - p.x, y - p.y) < r + p.r + gap) return true;
  }
  return false;
}

/**
 * Pack circles using an incremental tangent-search algorithm.
 * Circles are sorted largest-first and each new circle is placed at the
 * valid candidate position closest to the origin.
 */
function packCircles(radii: number[]): Array<{ x: number; y: number }> {
  const result: Array<{ x: number; y: number }> = new Array(radii.length);
  if (radii.length === 0) return result;

  const order = radii.map((r, i) => ({ r, i })).sort((a, b) => b.r - a.r);
  const placed: PlacedCircle[] = [];

  for (const { r, i } of order) {
    if (placed.length === 0) {
      placed.push({ x: 0, y: 0, r });
      result[i] = { x: 0, y: 0 };
      continue;
    }

    const candidates: Array<{ x: number; y: number }> = [];

    // Angular sweep around every already-placed circle
    for (const p of placed) {
      const d = p.r + r + 2;
      const steps = Math.max(24, Math.round((Math.PI * 2 * d) / (r + 2)));
      for (let s = 0; s < steps; s++) {
        const a = (s / steps) * Math.PI * 2;
        candidates.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d });
      }
    }

    // Tangent to every pair among the most recent placed circles
    const from = Math.max(0, placed.length - 16);
    for (let a = from; a < placed.length; a++) {
      for (let b = a + 1; b < placed.length; b++) {
        candidates.push(...tangentToTwo(placed[a], placed[b], r));
      }
    }

    let bestX = 0;
    let bestY = 0;
    let bestDist = Infinity;

    for (const { x, y } of candidates) {
      if (!hasOverlap(x, y, r, placed)) {
        const dist = Math.hypot(x, y);
        if (dist < bestDist) {
          bestDist = dist;
          bestX = x;
          bestY = y;
        }
      }
    }

    // Hard fallback: walk along x-axis until clear
    if (bestDist === Infinity) {
      for (let d = placed[0].r + r + 2; d < 20000; d += r * 0.5) {
        if (!hasOverlap(d, 0, r, placed)) {
          bestX = d;
          bestY = 0;
          break;
        }
      }
    }

    placed.push({ x: bestX, y: bestY, r });
    result[i] = { x: bestX, y: bestY };
  }

  return result;
}

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
  r: number;
  portrait: string | undefined;
  tierColor: string;
  qualityBorder: string;
}

// ── Chart canvas ─────────────────────────────────────────────────────────────

interface BubbleCanvasProps {
  bubbles: BubbleItem[];
  positions: Array<{ x: number; y: number }>;
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

  // Bounding box
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  bubbles.forEach((b, idx) => {
    const { x, y } = positions[idx];
    minX = Math.min(minX, x - b.r);
    maxX = Math.max(maxX, x + b.r);
    minY = Math.min(minY, y - b.r);
    maxY = Math.max(maxY, y + b.r);
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
        const cx = positions[idx].x + ox;
        const cy = positions[idx].y + oy;
        const d = b.r * 2;

        const inner = (
          <Box
            style={{
              position: 'absolute',
              left: Math.round(cx - b.r),
              top: Math.round(cy - b.r),
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

  // Compute packed positions (memoized — only recomputes when bubbles change)
  const positions = useMemo(
    () => packCircles(bubbles.map((b) => b.r)),
    [bubbles]
  );

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
        scrollAreaComponent={ScrollArea.Autosize}
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

          <BubbleCanvas
            bubbles={bubbles}
            positions={positions}
            interactive
          />
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
