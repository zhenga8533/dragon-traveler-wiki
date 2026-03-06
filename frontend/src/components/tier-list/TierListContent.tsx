import {
  Badge,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { getTierColor, TIER_ORDER } from '../../constants/colors';
import {
  getContentTypeColor,
  normalizeContentType,
} from '../../constants/content-types';
import { CHARACTER_GRID_SPACING } from '../../constants/ui';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../../contexts';
import type { Character } from '../../types/character';
import type { TierList as TierListType } from '../../types/tier-list';
import {
  getCharacterBaseSlug,
  getCharacterIdentityKey,
  getCharacterRoutePath,
  getCharacterRoutePathByName,
} from '../../utils/character-route';
import CharacterCard from '../character/CharacterCard';
import CharacterPortrait from '../character/CharacterPortrait';
import ClassTag from '../common/ClassTag';
import CollapsibleSectionCard from '../common/CollapsibleSectionCard';
import FactionTag from '../common/FactionTag';
import LastUpdated from '../common/LastUpdated';
import QualityIcon from '../common/QualityIcon';

interface TierListContentProps {
  tierList: TierListType;
  resolveTierEntryCharacter: (
    entry: TierListType['entries'][number]
  ) => Character | null | undefined;
  characterNameCounts: Map<string, number>;
  viewMode: string;
  headerActions: ReactNode;
  exportRefCallback?: (node: HTMLDivElement | null) => void;
}

export default function TierListContent({
  tierList,
  resolveTierEntryCharacter,
  characterNameCounts,
  viewMode,
  headerActions,
  exportRefCallback,
}: TierListContentProps) {
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];
  const tierOrder = tierList.tiers?.map((t) => t.name) ?? TIER_ORDER;
  const definedTierSet = new Set(tierOrder);
  const extraTiers = [...new Set(tierList.entries.map((e) => e.tier))].filter(
    (t) => !definedTierSet.has(t)
  );
  const allTierOrder = [...tierOrder, ...extraTiers];

  const byTier = allTierOrder
    .map((tier, tierIndex) => ({
      tier,
      tierIndex,
      note: tierList.tiers?.find((t) => t.name === tier)?.note,
      entries: tierList.entries.filter((e) => e.tier === tier),
    }))
    .filter((g) => g.entries.length > 0);

  return (
    <Stack gap="md">
      <Stack gap={6}>
        <Group gap="xs" wrap="wrap" mb={2} align="center">
          {tierList.content_type && (
            <Badge
              variant="light"
              color={getContentTypeColor(tierList.content_type, 'All')}
              size="sm"
            >
              {normalizeContentType(tierList.content_type, 'All')}
            </Badge>
          )}
          {tierList.author && (
            <Text size="sm" c="dimmed">
              by{' '}
              <Text span c={`${accent.primary}.7`} inherit fw={600}>
                {tierList.author}
              </Text>
            </Text>
          )}
          {tierList.description && (
            <>
              <Text size="sm" c="dimmed">
                •
              </Text>
              <Text size="sm" c="dimmed">
                {tierList.description}
              </Text>
            </>
          )}
        </Group>
        <Group gap="xs" wrap="wrap">
          <LastUpdated timestamp={tierList.last_updated} />
          {headerActions}
        </Group>
      </Stack>

      <div ref={exportRefCallback}>
        <Stack gap="md">
          {byTier.map(({ tier, tierIndex, note, entries }) => {
            const tierNote = note?.trim() || '';
            return (
              <CollapsibleSectionCard
                key={tier}
                defaultExpanded
                header={
                  <Stack gap={4}>
                    <Badge
                      variant="filled"
                      color={getTierColor(tier, tierIndex)}
                      size="lg"
                      radius="sm"
                    >
                      {tier} Tier
                    </Badge>
                    {tierNote && (
                      <Text size="xs" c="dimmed">
                        {tierNote}
                      </Text>
                    )}
                  </Stack>
                }
              >
                {viewMode === 'grid' ? (
                  <SimpleGrid
                    cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
                    spacing={CHARACTER_GRID_SPACING}
                    data-export-cols-desktop="6"
                  >
                    {entries.map((entry) => {
                      const char = resolveTierEntryCharacter(entry);
                      const routePath = char
                        ? getCharacterRoutePath(char, characterNameCounts)
                        : getCharacterRoutePathByName(entry.character_name);
                      const entryNote = entry.note?.trim() || undefined;
                      const isMultiQuality =
                        char &&
                        (characterNameCounts.get(
                          getCharacterBaseSlug(char.name)
                        ) ?? 1) > 1;
                      return (
                        <CharacterCard
                          key={`${getCharacterIdentityKey(entry.character_name, entry.character_quality)}-${entry.tier}`}
                          name={char?.name ?? entry.character_name}
                          label={
                            isMultiQuality
                              ? `${char!.name} (${char!.quality})`
                              : undefined
                          }
                          quality={char?.quality}
                          routePath={routePath}
                          note={entryNote}
                        />
                      );
                    })}
                  </SimpleGrid>
                ) : (
                  <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                    <Table striped highlightOnHover style={{ minWidth: 460 }}>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Character</Table.Th>
                          <Table.Th>Quality</Table.Th>
                          <Table.Th>Class</Table.Th>
                          <Table.Th>Factions</Table.Th>
                          <Table.Th>Note</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {entries.map((entry) => {
                          const char = resolveTierEntryCharacter(entry);
                          const routePath = char
                            ? getCharacterRoutePath(char, characterNameCounts)
                            : getCharacterRoutePathByName(entry.character_name);
                          const resolvedName =
                            char?.name ?? entry.character_name;
                          const isMultiQuality =
                            char &&
                            (characterNameCounts.get(
                              getCharacterBaseSlug(char.name)
                            ) ?? 1) > 1;
                          const displayName = isMultiQuality
                            ? `${char!.name} (${char!.quality})`
                            : resolvedName;
                          const entryNote = entry.note?.trim() || '';
                          return (
                            <Table.Tr
                              key={`${getCharacterIdentityKey(entry.character_name, entry.character_quality)}-${entry.tier}`}
                            >
                              <Table.Td>
                                <Group gap="sm" wrap="nowrap">
                                  <CharacterPortrait
                                    name={resolvedName}
                                    size={32}
                                    quality={char?.quality}
                                    routePath={routePath}
                                  />
                                  <Text
                                    component={Link}
                                    to={routePath}
                                    size="sm"
                                    fw={500}
                                    c="teal"
                                  >
                                    {displayName}
                                  </Text>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                {char ? (
                                  <QualityIcon
                                    quality={char.quality}
                                    size={18}
                                  />
                                ) : (
                                  <Text size="sm" c="dimmed">
                                    —
                                  </Text>
                                )}
                              </Table.Td>
                              <Table.Td>
                                {char ? (
                                  <ClassTag
                                    characterClass={char.character_class}
                                    size="sm"
                                  />
                                ) : (
                                  <Text size="sm" c="dimmed">
                                    —
                                  </Text>
                                )}
                              </Table.Td>
                              <Table.Td>
                                {char && char.factions.length > 0 ? (
                                  <Group gap={4} wrap="wrap">
                                    {char.factions.map((faction) => (
                                      <FactionTag
                                        key={faction}
                                        faction={faction}
                                        size="xs"
                                      />
                                    ))}
                                  </Group>
                                ) : (
                                  <Text size="sm" c="dimmed">
                                    —
                                  </Text>
                                )}
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="dimmed">
                                  {entryNote || '—'}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                )}
              </CollapsibleSectionCard>
            );
          })}
        </Stack>
      </div>
    </Stack>
  );
}
