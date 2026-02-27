import { Badge, Button, Collapse, Group, Paper, Text } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useContext, useEffect, useMemo, useState } from 'react';
import { IoFilter } from 'react-icons/io5';
import { TierListReferenceContext } from '../../contexts';
import type { Character } from '../../types/character';
import type { CharacterFilters } from '../../utils/filter-characters';
import {
  EMPTY_FILTERS,
  extractAllEffectRefs,
  filterCharacters,
  sortCharactersByQuality,
} from '../../utils/filter-characters';
import PaginationControl from '../common/PaginationControl';
import CharacterFilter from './CharacterFilter';

const ROWS_PER_PAGE = 6;

interface FilterableCharacterPoolProps {
  characters: Character[];
  children: (
    filtered: Character[],
    filterHeader: React.ReactNode,
    paginationControl: React.ReactNode
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
  const [page, setPage] = useState(1);

  // Mirror the SimpleGrid breakpoints: base: 2, xs: 3, sm: 4, md: 6
  const isMd = useMediaQuery('(min-width: 62em)');
  const isSm = useMediaQuery('(min-width: 48em)');
  const isXs = useMediaQuery('(min-width: 36em)');
  const cols = isMd ? 6 : isSm ? 4 : isXs ? 3 : 2;
  const pageSize = cols * ROWS_PER_PAGE;

  const effectOptions = useMemo(
    () => extractAllEffectRefs(characters),
    [characters]
  );

  const tierOptions = useMemo(() => {
    if (!selectedTierListName) return [];
    const list = tierLists.find((l) => l.name === selectedTierListName);
    if (!list) return [];
    const seen = new Set<string>();
    const tiers: string[] = [];
    for (const t of list.tiers ?? []) {
      if (!seen.has(t.name)) {
        seen.add(t.name);
        tiers.push(t.name);
      }
    }
    if (tiers.length === 0) {
      for (const e of list.entries) {
        if (!seen.has(e.tier)) {
          seen.add(e.tier);
          tiers.push(e.tier);
        }
      }
    }
    tiers.push('Unranked');
    return tiers;
  }, [tierLists, selectedTierListName]);

  // Clear tier filters that no longer exist in the newly selected tier list
  useEffect(() => {
    if (filters.tiers.length === 0) return;
    const valid = new Set(tierOptions);
    const next = filters.tiers.filter((t) => valid.has(t));
    if (next.length !== filters.tiers.length) {
      queueMicrotask(() => {
        setFilters((f) => ({ ...f, tiers: next }));
      });
    }
  }, [tierOptions, filters.tiers]);

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

  // Reset to page 1 whenever filters or tier selection change
  useEffect(() => {
    queueMicrotask(() => {
      setPage(1);
    });
  }, [filters, selectedTierListName]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Clamp in case pageSize grows (resize) or filtered shrinks
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

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
            tierOptions={tierOptions}
          />
        </Paper>
      </Collapse>
    </>
  );

  const paginationControl = (
    <PaginationControl
      currentPage={safePage}
      totalPages={totalPages}
      onChange={setPage}
    />
  );

  return <>{children(paginated, filterHeader, paginationControl)}</>;
}
