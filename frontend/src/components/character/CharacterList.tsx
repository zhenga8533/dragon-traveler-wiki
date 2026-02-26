import {
  Group,
  Image,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPortrait } from '../../assets/character';
import { CLASS_ICON_MAP } from '../../assets/class';
import { FACTION_ICON_MAP } from '../../assets/faction';
import { QUALITY_ICON_MAP } from '../../assets/quality';
import { QUALITY_BORDER_COLOR, TIER_ORDER } from '../../constants/colors';
import {
  CURSOR_POINTER_STYLE,
  FLEX_SHRINK_0_STYLE,
} from '../../constants/styles';
import {
  CHARACTER_GRID_COLS,
  CHARACTER_GRID_SPACING,
  PAGE_SIZE,
  STORAGE_KEY,
} from '../../constants/ui';
import { TierListReferenceContext } from '../../contexts';
import {
  useFilterPanel,
  useFilters,
  useViewMode,
} from '../../hooks/use-filters';
import { usePagination } from '../../hooks/use-pagination';
import { applyDir, useSortState } from '../../hooks/use-sort';
import type { Character } from '../../types/character';
import type { CharacterFilters } from '../../utils/filter-characters';
import {
  compareCharactersByQualityThenName,
  EMPTY_FILTERS,
  extractAllEffectRefs,
  filterCharacters,
} from '../../utils/filter-characters';
import GlobalBadge from '../common/GlobalBadge';
import PaginationControl from '../common/PaginationControl';
import SortableTh from '../common/SortableTh';
import TierBadge from '../common/TierBadge';
import FilterToolbar from '../layout/FilterToolbar';
import CharacterCard from './CharacterCard';
import CharacterFilter from './CharacterFilter';

interface CharacterListProps {
  characters: Character[];
  cols?: { base?: number; xs?: number; sm?: number; md?: number };
  spacing?: number | string;
  showFilter?: boolean;
}

export default function CharacterList({
  characters,
  cols = CHARACTER_GRID_COLS,
  spacing = CHARACTER_GRID_SPACING,
  showFilter = true,
}: CharacterListProps) {
  const { tierLists, selectedTierListName } = useContext(
    TierListReferenceContext
  );
  const { filters, setFilters } = useFilters<CharacterFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.CHARACTER_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.CHARACTER_VIEW_MODE,
    defaultMode: 'grid',
  });
  const { sortState, handleSort } = useSortState(STORAGE_KEY.CHARACTER_SORT);
  const { col: sortCol, dir: sortDir } = sortState;

  const effectOptions = useMemo(
    () => extractAllEffectRefs(characters),
    [characters]
  );

  const tierLookup = useMemo(() => {
    const map = new Map<string, string>();
    if (!selectedTierListName) return map;
    const list = tierLists.find((l) => l.name === selectedTierListName);
    if (!list) return map;
    for (const entry of list.entries) {
      map.set(entry.character_name, entry.tier);
    }
    return map;
  }, [tierLists, selectedTierListName]);

  const getTierLabel = (name: string) => {
    if (!selectedTierListName) return undefined;
    return tierLookup.get(name) ?? 'Unranked';
  };

  const filteredAndSorted = useMemo(() => {
    const filtered = filterCharacters(
      characters,
      filters,
      selectedTierListName ? tierLookup : undefined
    );
    return [...filtered].sort((a, b) => {
      if (sortCol) {
        let cmp = 0;
        if (sortCol === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (sortCol === 'quality') {
          cmp = compareCharactersByQualityThenName(a, b);
        } else if (sortCol === 'factions') {
          cmp = (a.factions[0] ?? '').localeCompare(b.factions[0] ?? '');
        } else if (sortCol === 'global') {
          cmp = (b.is_global ? 1 : 0) - (a.is_global ? 1 : 0);
        } else if (sortCol === 'tier') {
          const tA = tierLookup.get(a.name) ?? '';
          const tB = tierLookup.get(b.name) ?? '';
          const iA = (TIER_ORDER as readonly string[]).indexOf(tA);
          const iB = (TIER_ORDER as readonly string[]).indexOf(tB);
          cmp = (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
        }
        if (cmp !== 0) return applyDir(cmp, sortDir);
      }
      // Default: quality > name
      return compareCharactersByQualityThenName(a, b);
    });
  }, [characters, filters, sortCol, sortDir, tierLookup, selectedTierListName]);

  const { page, setPage, totalPages, offset } = usePagination(
    filteredAndSorted.length,
    PAGE_SIZE,
    JSON.stringify(filters)
  );
  const pageItems = filteredAndSorted.slice(offset, offset + PAGE_SIZE);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.qualities.length +
    filters.classes.length +
    filters.factions.length +
    (selectedTierListName ? filters.tiers.length : 0) +
    filters.statusEffects.length +
    (filters.globalOnly !== null ? 1 : 0);

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        {showFilter ? (
          <FilterToolbar
            count={filteredAndSorted.length}
            noun="character"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterCount={activeFilterCount}
            filterOpen={filterOpen}
            onFilterToggle={toggleFilter}
          >
            <CharacterFilter
              filters={filters}
              onChange={setFilters}
              effectOptions={effectOptions}
              showTierFilter={Boolean(selectedTierListName)}
            />
          </FilterToolbar>
        ) : (
          <Group justify="space-between" align="center" wrap="wrap">
            <Text size="sm" c="dimmed">
              {filteredAndSorted.length} character
              {filteredAndSorted.length !== 1 ? 's' : ''}
            </Text>
          </Group>
        )}

        {filteredAndSorted.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="md">
            No characters match the current filters.
          </Text>
        ) : viewMode === 'grid' ? (
          <SimpleGrid cols={cols} spacing={spacing}>
            {pageItems.map((char) => (
              <CharacterCard
                key={char.name}
                name={char.name}
                quality={char.quality}
                tierLabel={getTierLabel(char.name)}
              />
            ))}
          </SimpleGrid>
        ) : (
          <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
            <Table striped highlightOnHover style={{ minWidth: 560 }}>
              <Table.Thead>
                <Table.Tr>
                  <SortableTh
                    sortKey="name"
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSort={handleSort}
                  >
                    Name
                  </SortableTh>
                  <SortableTh
                    sortKey="quality"
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSort={handleSort}
                  >
                    Quality
                  </SortableTh>
                  <Table.Th>Class</Table.Th>
                  <SortableTh
                    sortKey="factions"
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSort={handleSort}
                  >
                    Factions
                  </SortableTh>
                  <SortableTh
                    sortKey="global"
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSort={handleSort}
                  >
                    Global
                  </SortableTh>
                  {selectedTierListName && (
                    <SortableTh
                      sortKey="tier"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onSort={handleSort}
                    >
                      Tier
                    </SortableTh>
                  )}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pageItems.map((char) => (
                  <Table.Tr key={char.name} style={CURSOR_POINTER_STYLE}>
                    <Table.Td>
                      <UnstyledButton
                        component={Link}
                        to={`/characters/${encodeURIComponent(char.name)}`}
                      >
                        <Group gap="sm" wrap="nowrap">
                          <Image
                            src={getPortrait(char.name)}
                            alt={char.name}
                            h={40}
                            w={40}
                            fit="cover"
                            radius="50%"
                            fallbackSrc={`https://placehold.co/40x40?text=${encodeURIComponent(char.name.charAt(0))}`}
                            style={{
                              border: `3px solid ${char.quality ? QUALITY_BORDER_COLOR[char.quality] : 'var(--mantine-color-gray-5)'}`,
                              ...FLEX_SHRINK_0_STYLE,
                            }}
                          />
                          <Text size="sm" fw={500} c="violet">
                            {char.name}
                          </Text>
                        </Group>
                      </UnstyledButton>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label={char.quality}>
                        <Image
                          src={QUALITY_ICON_MAP[char.quality]}
                          alt={char.quality}
                          h={20}
                          w="auto"
                          fit="contain"
                        />
                      </Tooltip>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Image
                          src={CLASS_ICON_MAP[char.character_class]}
                          alt={char.character_class}
                          w={20}
                          h={20}
                          fit="contain"
                        />
                        <Text size="sm">{char.character_class}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {char.factions.map((faction) => (
                          <Tooltip key={faction} label={faction}>
                            <Image
                              src={FACTION_ICON_MAP[faction]}
                              alt={faction}
                              w={20}
                              h={20}
                              fit="contain"
                            />
                          </Tooltip>
                        ))}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <GlobalBadge isGlobal={char.is_global} size="sm" />
                    </Table.Td>
                    {selectedTierListName && (
                      <Table.Td>
                        {(() => {
                          const tier = getTierLabel(char.name);
                          return tier ? (
                            <TierBadge tier={tier} size="sm" />
                          ) : null;
                        })()}
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}

        <PaginationControl
          currentPage={page}
          totalPages={totalPages}
          onChange={setPage}
        />
      </Stack>
    </Paper>
  );
}
