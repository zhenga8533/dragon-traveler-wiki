import { Badge, Button, Collapse, Group, Paper, Text } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useContext, useEffect, useMemo, useState } from 'react';
import { IoFilter } from 'react-icons/io5';
import { getCardHoverProps } from '../../constants/styles';
import { BREAKPOINTS } from '../../constants/ui';
import { TierListReferenceContext } from '../../contexts';
import { useGradientAccent } from '../../hooks';
import {
  buildRowAlignedPageSizeOptions,
  usePageSize,
  usePagination,
} from '../../hooks/use-pagination';
import type { Character } from '../../types/character';
import {
  buildCharacterByIdentityMap,
  buildPreferredCharacterByNameMap,
  getCharacterIdentityKey,
  resolveCharacterByNameAndQuality,
} from '../../utils/character-route';
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
  const { accent } = useGradientAccent();
  const [filters, setFilters] = useState<CharacterFilters>(EMPTY_FILTERS);
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);

  // Mirror the SimpleGrid breakpoints: base: 2, xs: 3, sm: 4, md: 6
  const isMd = useMediaQuery(BREAKPOINTS.MD);
  const isSm = useMediaQuery(BREAKPOINTS.DESKTOP);
  const isXs = useMediaQuery(BREAKPOINTS.XS);
  const cols = isMd ? 6 : isSm ? 4 : isXs ? 3 : 2;
  const pageSizeOptions = useMemo(
    () => buildRowAlignedPageSizeOptions(cols, [4, 6, 8, 10]),
    [cols]
  );
  const { pageSize, setPageSize } = usePageSize(pageSizeOptions, {
    defaultSize: cols * ROWS_PER_PAGE,
  });

  const effectOptions = useMemo(
    () => extractAllEffectRefs(characters),
    [characters]
  );

  const preferredCharacterByName = useMemo(
    () => buildPreferredCharacterByNameMap(characters),
    [characters]
  );

  const characterByIdentity = useMemo(
    () => buildCharacterByIdentityMap(characters),
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
      const resolved = resolveCharacterByNameAndQuality(
        entry.character_name,
        entry.character_quality,
        preferredCharacterByName,
        characterByIdentity
      );
      if (resolved) {
        map.set(getCharacterIdentityKey(resolved), entry.tier);
      }
    }
    return map;
  }, [
    tierLists,
    selectedTierListName,
    preferredCharacterByName,
    characterByIdentity,
  ]);

  const filtered = useMemo(() => {
    const filteredChars = filterCharacters(
      characters,
      filters,
      selectedTierListName ? tierLookup : undefined
    );
    return sortCharactersByQuality(filteredChars);
  }, [characters, filters, tierLookup, selectedTierListName]);

  const filterKey = JSON.stringify({ filters, selectedTierListName });
  const {
    page: safePage,
    setPage,
    totalPages,
    offset,
  } = usePagination(filtered.length, pageSize, filterKey);

  useEffect(() => {
    setPage(1);
  }, [pageSize, setPage]);

  const paginated = filtered.slice(offset, offset + pageSize);

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
          color={accent.primary}
          size="xs"
          leftSection={<IoFilter size={16} />}
          rightSection={
            activeFilterCount > 0 ? (
              <Badge size="xs" circle variant="filled" color={accent.primary}>
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
        <Paper p="md" radius="md" withBorder {...getCardHoverProps()}>
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
      totalItems={filtered.length}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      onPageSizeChange={setPageSize}
      scrollToTop
    />
  );

  return <>{children(paginated, filterHeader, paginationControl)}</>;
}
