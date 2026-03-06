import {
  Badge,
  Box,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IoFlash } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import CharacterPortrait from '../../components/character/CharacterPortrait';
import ClassTag from '../../components/common/ClassTag';
import FactionTag from '../../components/common/FactionTag';
import NoteTooltipIcon from '../../components/common/NoteTooltipIcon';
import QualityIcon from '../../components/common/QualityIcon';
import { getCardHoverProps } from '../../constants/styles';
import { useMobileTooltip } from '../../hooks';
import type { Character } from '../../types/character';
import type { TeamMember } from '../../types/team';
import { resolveCharacterByNameAndQuality } from '../../utils/character-route';

const BG_ROW_COLORS = ['red', 'orange', 'blue'] as const;
const BG_ROW_LABELS = ['Front', 'Middle', 'Back'] as const;
const BG_COL_LABELS = ['Left', 'Center', 'Right'] as const;
const BG_ROW_HINTS = [
  'Guardian · Warrior · Assassin',
  'Warrior · Priest · Mage · Archer · Assassin',
  'Priest · Mage · Archer · Assassin',
] as const;

function buildPositionGrid(members: TeamMember[]): (TeamMember | null)[][] {
  const grid: (TeamMember | null)[][] = Array.from({ length: 3 }, () =>
    Array(3).fill(null)
  );
  const unpositioned: TeamMember[] = [];
  for (const member of members) {
    if (member.position) {
      const { row, col } = member.position;
      if (row >= 0 && row < 3 && col >= 0 && col < 3) {
        grid[row][col] = member;
      } else {
        unpositioned.push(member);
      }
    } else {
      unpositioned.push(member);
    }
  }
  for (const member of unpositioned) {
    placed: for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!grid[r][c]) {
          grid[r][c] = member;
          break placed;
        }
      }
    }
  }
  return grid;
}

export function BattlefieldGrid({
  members,
  charMap,
  characterByIdentity,
  getCharacterPath,
  factionColor,
  isDark,
  tooltipProps,
}: {
  members: TeamMember[];
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  getCharacterPath: (
    characterName: string,
    characterQuality?: string | null
  ) => string;
  factionColor: string;
  isDark: boolean;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
}) {
  const grid = buildPositionGrid(members);
  const accentColor = `var(--mantine-color-${factionColor}-${isDark ? 7 : 5})`;
  const isMobile = useMediaQuery('(max-width: 30em)');

  return (
    <Stack gap={isMobile ? 'xs' : 'sm'}>
      {grid.map((row, rowIdx) => (
        <Group
          key={rowIdx}
          gap={isMobile ? 'xs' : 'sm'}
          align="stretch"
          wrap="nowrap"
        >
          {/* Row indicator */}
          <Tooltip label={BG_ROW_HINTS[rowIdx]} withArrow position="right">
            <Box
              style={{
                width: isMobile ? 20 : 24,
                minWidth: isMobile ? 20 : 24,
                flexShrink: 0,
                borderRadius: 'var(--mantine-radius-sm)',
                background: `var(--mantine-color-${BG_ROW_COLORS[rowIdx]}-5)`,
                color: 'var(--mantine-color-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: isMobile ? 9 : 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                lineHeight: 1,
                textTransform: 'uppercase',
                userSelect: 'none',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  transform: 'scaleY(1.2)',
                  transformOrigin: 'center',
                }}
              >
                {BG_ROW_LABELS[rowIdx]}
              </span>
            </Box>
          </Tooltip>

          {/* 3 cells */}
          <SimpleGrid
            cols={{ base: 1, xs: 2, sm: 3 }}
            spacing={{ base: 'xs', sm: 'sm' }}
            style={{ flex: 1 }}
          >
            {row.map((member, colIdx) => {
              if (!member) {
                return (
                  <Paper
                    key={colIdx}
                    radius="md"
                    withBorder
                    {...getCardHoverProps({
                      style: {
                        minHeight: isMobile ? 72 : 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.25,
                        borderStyle: 'dashed',
                      },
                    })}
                  >
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      {BG_COL_LABELS[colIdx]}
                    </Text>
                    <Text size="xs" c="dimmed">
                      —
                    </Text>
                  </Paper>
                );
              }

              const character = resolveCharacterByNameAndQuality(
                member.character_name,
                member.character_quality,
                charMap,
                characterByIdentity
              );
              const routePath = getCharacterPath(
                member.character_name,
                member.character_quality
              );
              const resolvedName = character?.name ?? member.character_name;
              return (
                <Paper
                  key={colIdx}
                  p={isMobile ? 'xs' : 'sm'}
                  radius="md"
                  withBorder
                  {...getCardHoverProps({
                    style: {
                      borderTop: `3px solid ${accentColor}`,
                    },
                  })}
                >
                  <Stack gap={6} align="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      {BG_COL_LABELS[colIdx]}
                    </Text>
                    <Box pos="relative">
                      <Tooltip label={`View ${resolvedName}`} {...tooltipProps}>
                        <CharacterPortrait
                          name={resolvedName}
                          size={isMobile ? 64 : 72}
                          quality={character?.quality}
                          borderWidth={3}
                          link
                          routePath={routePath}
                        />
                      </Tooltip>
                      {(member.note?.trim() || '').length > 0 && (
                        <NoteTooltipIcon
                          note={member.note?.trim() ?? ''}
                          ariaLabel={`Show note for ${resolvedName}`}
                          stopPropagation
                          wrapperStyle={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                          }}
                        />
                      )}
                      {member.overdrive_order != null && (
                        <Badge
                          size="md"
                          circle
                          variant="filled"
                          color={factionColor}
                          style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                        >
                          {member.overdrive_order}
                        </Badge>
                      )}
                    </Box>

                    <Text
                      fw={700}
                      size={isMobile ? 'xs' : 'sm'}
                      ta="center"
                      component={Link}
                      to={routePath}
                      c="violet"
                      style={{ textDecoration: 'none' }}
                      lineClamp={1}
                    >
                      {resolvedName}
                    </Text>

                    {character && (
                      <Group gap={4} justify="center" wrap="nowrap">
                        <QualityIcon
                          quality={character.quality}
                          size={isMobile ? 14 : 16}
                        />
                        <ClassTag
                          characterClass={character.character_class}
                          size="xs"
                        />
                      </Group>
                    )}

                    {character && (
                      <Group gap={4} justify="center" wrap="wrap">
                        {character.factions.map((f) => (
                          <FactionTag key={f} faction={f} size="xs" />
                        ))}
                      </Group>
                    )}

                    {member.overdrive_order != null && (
                      <Group gap={4} justify="center">
                        <IoFlash
                          size={11}
                          color={`var(--mantine-color-${factionColor}-5)`}
                        />
                        <Text size="xs" c="dimmed">
                          Overdrive #{member.overdrive_order}
                        </Text>
                      </Group>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Group>
      ))}
    </Stack>
  );
}
