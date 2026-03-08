import { Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { CHARACTER_GRID_COLS, CHARACTER_GRID_SPACING } from '../../constants/ui';
import { useCharacterListData } from '../../hooks/use-character-list-data';
import type { Character } from '../../types/character';
import { EMPTY_FILTERS } from '../../utils/filter-characters';
import {
  getCharacterIdentityKey,
  getCharacterRoutePath,
} from '../../utils/character-route';
import NoResultsSuggestions from '../common/NoResultsSuggestions';
import PaginationControl from '../common/PaginationControl';
import FilterToolbar from '../layout/FilterToolbar';
import CharacterCard from './CharacterCard';
import CharacterFilter from './CharacterFilter';
import CharacterTable from './CharacterTable';

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
  const {
    filters,
    setFilters,
    filterOpen,
    toggleFilter,
    viewMode,
    setViewMode,
    sortCol,
    sortDir,
    handleSort,
    characterNameCounts,
    effectOptions,
    tierOptions,
    selectedTierListName,
    getTierLabel,
    filteredAndSorted,
    pageItems,
    page,
    setPage,
    totalPages,
    activeFilterCount,
  } = useCharacterListData(characters);

  return (
    <Paper p="md" radius="md" withBorder data-no-hover>
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
              tierOptions={tierOptions}
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
          <NoResultsSuggestions
            title="No characters found"
            message="No characters match the current filters."
            onReset={() => setFilters(EMPTY_FILTERS)}
            onOpenFilters={showFilter ? toggleFilter : undefined}
          />
        ) : viewMode === 'grid' ? (
          <SimpleGrid cols={cols} spacing={spacing}>
            {pageItems.map((char) => (
              <CharacterCard
                key={getCharacterIdentityKey(char)}
                name={char.name}
                quality={char.quality}
                tierLabel={getTierLabel(char)}
                routePath={getCharacterRoutePath(char, characterNameCounts)}
              />
            ))}
          </SimpleGrid>
        ) : (
          <CharacterTable
            pageItems={pageItems}
            characterNameCounts={characterNameCounts}
            sortCol={sortCol}
            sortDir={sortDir}
            handleSort={handleSort}
            selectedTierListName={selectedTierListName}
            getTierLabel={getTierLabel}
          />
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
