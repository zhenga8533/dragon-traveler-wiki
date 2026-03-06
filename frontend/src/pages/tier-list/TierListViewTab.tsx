import {
  Badge,
  Collapse,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import CharacterCard from '../../components/character/CharacterCard';
import CharacterPortrait from '../../components/character/CharacterPortrait';
import ChangeHistory from '../../components/common/ChangeHistory';
import ClassTag from '../../components/common/ClassTag';
import CollapsibleSectionCard from '../../components/common/CollapsibleSectionCard';
import EntityActionButtons from '../../components/common/EntityActionButtons';
import type { ChipFilterGroup } from '../../components/common/EntityFilter';
import EntityFilter from '../../components/common/EntityFilter';
import FactionTag from '../../components/common/FactionTag';
import NoResultsSuggestions from '../../components/common/NoResultsSuggestions';
import QualityIcon from '../../components/common/QualityIcon';
import TierListContent from '../../components/tier-list/TierListContent';
import { getCardHoverProps } from '../../constants/styles';
import { BREAKPOINTS, CHARACTER_GRID_SPACING } from '../../constants/ui';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../../contexts';
import type { ChangesFile } from '../../types/changes';
import type { Character } from '../../types/character';
import type { TierList as TierListType } from '../../types/tier-list';
import {
  getCharacterBaseSlug,
  getCharacterIdentityKey,
  getCharacterRoutePath,
} from '../../utils/character-route';
import { sortCharactersByQuality } from '../../utils/filter-characters';

interface TierListViewTabProps {
  visibleTierLists: TierListType[];
  characters: Character[];
  resolveTierEntryCharacter: (
    entry: TierListType['entries'][number]
  ) => Character | null | undefined;
  characterNameCounts: Map<string, number>;
  viewMode: string;
  filterOpen: boolean;
  entityFilterGroups: ChipFilterGroup[];
  viewFilters: Record<string, string[]>;
  search: string;
  onFilterChange: (key: string, values: string[]) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  tierListChanges: ChangesFile;
  onRequestEdit: (tierList: TierListType) => void;
  onRequestExport: (name: string) => void;
  isExporting: string | null;
  exportRefCallback: (name: string, node: HTMLDivElement | null) => void;
}

export default function TierListViewTab({
  visibleTierLists,
  characters,
  resolveTierEntryCharacter,
  characterNameCounts,
  viewMode,
  filterOpen,
  entityFilterGroups,
  viewFilters,
  search,
  onFilterChange,
  onSearchChange,
  onClearFilters,
  onOpenFilters,
  tierListChanges,
  onRequestEdit,
  onRequestExport,
  isExporting,
  exportRefCallback,
}: TierListViewTabProps) {
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];

  return (
    <>
      <Collapse in={filterOpen}>
        <Paper
          p="sm"
          radius="md"
          withBorder
          {...getCardHoverProps()}
          bg="var(--mantine-color-body)"
        >
          <EntityFilter
            groups={entityFilterGroups}
            selected={viewFilters}
            onChange={onFilterChange}
            onClear={onClearFilters}
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search tier lists..."
          />
        </Paper>
      </Collapse>

      {visibleTierLists.length === 0 && (
        <NoResultsSuggestions
          title="No tier lists found"
          message="No tier lists match the current filters."
          onReset={onClearFilters}
          onOpenFilters={onOpenFilters}
        />
      )}

      {visibleTierLists.length > 0 && (
        <Tabs defaultValue={visibleTierLists[0]?.name}>
          <ScrollArea type="auto" scrollbarSize={5} offsetScrollbars>
            <Tabs.List style={{ flexWrap: 'nowrap', minWidth: 'max-content' }}>
              {visibleTierLists.map((tierList) => (
                <Tabs.Tab
                  key={tierList.name}
                  value={tierList.name}
                  style={{ minHeight: 40 }}
                >
                  {tierList.name}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </ScrollArea>

          {visibleTierLists.map((tierList) => {
            const rankedNames = new Set(
              tierList.entries.map((e) => {
                const resolved = resolveTierEntryCharacter(e);
                return resolved
                  ? getCharacterIdentityKey(resolved)
                  : getCharacterIdentityKey(
                      e.character_name,
                      e.character_quality
                    );
              })
            );
            const unranked = sortCharactersByQuality(
              characters.filter(
                (c) => !rankedNames.has(getCharacterIdentityKey(c))
              )
            );

            const headerActions = (
              <EntityActionButtons
                onEdit={() => onRequestEdit(tierList)}
                onExport={() => onRequestExport(tierList.name)}
                isExporting={isExporting === tierList.name}
                size={isMobile ? 'xs' : 'compact-xs'}
                variant="light"
              />
            );

            return (
              <Tabs.Panel key={tierList.name} value={tierList.name} pt="md">
                <Stack gap="md">
                  <TierListContent
                    tierList={tierList}
                    resolveTierEntryCharacter={resolveTierEntryCharacter}
                    characterNameCounts={characterNameCounts}
                    viewMode={viewMode}
                    headerActions={headerActions}
                    exportRefCallback={(node) =>
                      exportRefCallback(tierList.name, node)
                    }
                  />

                  {unranked.length > 0 && (
                    <CollapsibleSectionCard
                      defaultExpanded={false}
                      header={
                        <Badge
                          variant="filled"
                          color="gray"
                          size="lg"
                          radius="sm"
                        >
                          Unranked
                        </Badge>
                      }
                    >
                      {viewMode === 'grid' ? (
                        <SimpleGrid
                          cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
                          spacing={CHARACTER_GRID_SPACING}
                        >
                          {unranked.map((c) => {
                            const isMultiQuality =
                              (characterNameCounts.get(
                                getCharacterBaseSlug(c.name)
                              ) ?? 1) > 1;
                            return (
                              <CharacterCard
                                key={getCharacterIdentityKey(c)}
                                name={c.name}
                                label={
                                  isMultiQuality
                                    ? `${c.name} (${c.quality})`
                                    : undefined
                                }
                                quality={c.quality}
                                routePath={getCharacterRoutePath(
                                  c,
                                  characterNameCounts
                                )}
                              />
                            );
                          })}
                        </SimpleGrid>
                      ) : (
                        <ScrollArea
                          type="auto"
                          scrollbarSize={6}
                          offsetScrollbars
                        >
                          <Table
                            striped
                            highlightOnHover
                            style={{ minWidth: 460 }}
                          >
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th>Character</Table.Th>
                                <Table.Th>Quality</Table.Th>
                                <Table.Th>Class</Table.Th>
                                <Table.Th>Factions</Table.Th>
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {unranked.map((c) => {
                                const isMultiQuality =
                                  (characterNameCounts.get(
                                    getCharacterBaseSlug(c.name)
                                  ) ?? 1) > 1;
                                const displayName = isMultiQuality
                                  ? `${c.name} (${c.quality})`
                                  : c.name;
                                return (
                                  <Table.Tr key={getCharacterIdentityKey(c)}>
                                    <Table.Td>
                                      <Group gap="sm" wrap="nowrap">
                                        <CharacterPortrait
                                          name={c.name}
                                          size={32}
                                          quality={c.quality}
                                        />
                                        <Text
                                          component={Link}
                                          to={getCharacterRoutePath(
                                            c,
                                            characterNameCounts
                                          )}
                                          size="sm"
                                          fw={500}
                                          c={`${accent.primary}.7`}
                                        >
                                          {displayName}
                                        </Text>
                                      </Group>
                                    </Table.Td>
                                    <Table.Td>
                                      <QualityIcon
                                        quality={c.quality}
                                        size={18}
                                      />
                                    </Table.Td>
                                    <Table.Td>
                                      <ClassTag
                                        characterClass={c.character_class}
                                        size="sm"
                                      />
                                    </Table.Td>
                                    <Table.Td>
                                      <Group gap={4} wrap="wrap">
                                        {c.factions.map((faction) => (
                                          <FactionTag
                                            key={faction}
                                            faction={faction}
                                            size="xs"
                                          />
                                        ))}
                                      </Group>
                                    </Table.Td>
                                  </Table.Tr>
                                );
                              })}
                            </Table.Tbody>
                          </Table>
                        </ScrollArea>
                      )}
                    </CollapsibleSectionCard>
                  )}

                  <ChangeHistory history={tierListChanges[tierList.name]} />
                </Stack>
              </Tabs.Panel>
            );
          })}
        </Tabs>
      )}
    </>
  );
}
