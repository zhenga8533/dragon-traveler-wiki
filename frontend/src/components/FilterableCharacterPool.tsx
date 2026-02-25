import { Badge, Button, Collapse, Group, Paper, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useContext, useMemo, useState } from 'react';
import { IoFilter } from 'react-icons/io5';
import { TierListReferenceContext } from '../contexts';
import type { Character } from '../types/character';
import type { CharacterFilters } from '../utils/filter-characters';
import {
  EMPTY_FILTERS,
  extractAllEffectRefs,
  filterCharacters,
  sortCharactersByQuality,
} from '../utils/filter-characters';
import CharacterFilter from './CharacterFilter';

interface FilterableCharacterPoolProps {
  characters: Character[];
  children: (
    filtered: Character[],
    filterHeader: React.ReactNode
  ) => React.ReactNode;
}

export default function FilterableCharacterPool({
  characters,
  children,
}: FilterableCharacterPoolProps) {
  const { tierLists, selectedTierListName } = useContext(
    TierListReferenceContext
  );
  const [filters, setFilters] = useState<CharacterFilters>(EMPTY_FILTERS);
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);

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

  const filtered = useMemo(() => {
    const filteredChars = filterCharacters(
      characters,
      filters,
      selectedTierListName ? tierLookup : undefined
    );
    return sortCharactersByQuality(filteredChars);
  }, [characters, filters, tierLookup, selectedTierListName]);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.qualities.length +
    filters.classes.length +
    filters.factions.length +
    (selectedTierListName ? filters.tiers.length : 0) +
    filters.statusEffects.length +
    (filters.globalOnly !== null ? 1 : 0);

  const filterHeader = (
    <>
      <Group justify="space-between" align="center" wrap="wrap">
        <Text size="sm" c="dimmed">
          {filtered.length} available character
          {filtered.length !== 1 ? 's' : ''}
        </Text>
        <Button
          variant="default"
          size="xs"
          leftSection={<IoFilter size={16} />}
          rightSection={
            activeFilterCount > 0 ? (
              <Badge size="xs" circle variant="filled">
                {activeFilterCount}
              </Badge>
            ) : null
          }
          onClick={toggleFilter}
        >
          Filters
        </Button>
      </Group>

      <Collapse in={filterOpen}>
        <Paper p="md" radius="md" withBorder>
          <CharacterFilter
            filters={filters}
            onChange={setFilters}
            effectOptions={effectOptions}
            showTierFilter={Boolean(selectedTierListName)}
          />
        </Paper>
      </Collapse>
    </>
  );

  return <>{children(filtered, filterHeader)}</>;
}
