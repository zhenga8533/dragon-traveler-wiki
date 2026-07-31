import ExpandableText from '@/components/ui/ExpandableText';
import SafeImage from '@/components/ui/SafeImage';
import {
  Container,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
} from '@mantine/core';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CharacterSkinContext } from '@/contexts';
import { getPortrait } from '@/assets';
import { getNoblePhantasmIcon } from '@/assets';
import CharacterTag from '@/features/characters/components/CharacterTag';
import EntityTableLinkCell from '@/components/common/EntityTableLinkCell';
import EntitySummaryCard from '@/components/common/EntitySummaryCard';
import SortableTh from '@/components/ui/SortableTh';
import FilteredListShell from '@/components/layout/FilteredListShell';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ListPageShell from '@/components/layout/ListPageShell';
import ExportButton from '@/components/tools/ExportButton';
import SuggestModal, { type FieldDef } from '@/components/tools/SuggestModal';
import { getMinWidthStyle } from '@/constants/styles';
import { IMAGE_SIZE, PAGE_SIZE, STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useNoblePhantasms, useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import {
  applyDir,
  useFilterPanel,
  useFilteredPageData,
  useGradientAccent,
  useMobileTooltip,
  useSecondaryTabList,
  useTabParam,
} from '@/hooks';
import RichText from '@/components/common/RichText';
import {
  getLatestTimestamp,
  readStoredJson,
  writeStoredJson,
} from '@/utils';
import { getCharacterRouteSlug } from '@/features/characters/utils/character-route';
import { buildCharacterByIdentityMap } from '@/features/characters/utils/character-route';
import QualityIcon from '@/components/ui/QualityIcon';
import { QUALITY_ORDER } from '@/constants/quality';
import NoblePhantasmUsageTab, {
  type NoblePhantasmUsage,
  type NoblePhantasmUsageQualityFilter,
} from '@/features/wiki/noble-phantasms/components/NoblePhantasmUsageTab';
import NoblePhantasmFilter from '@/features/wiki/noble-phantasms/components/NoblePhantasmFilter';
import {
  EMPTY_NOBLE_PHANTASM_FILTERS,
  matchesNoblePhantasmFilters,
} from '@/features/wiki/noble-phantasms/utils/filter-noble-phantasms';

const USAGE_QUALITY_OPTIONS: {
  value: NoblePhantasmUsageQualityFilter;
  label: string;
}[] = [
  { value: 'ssr-plus', label: 'SSR+ and above' },
  { value: 'ssr', label: 'SSR and above' },
  { value: 'all', label: 'All characters' },
];

const USAGE_QUALITY_THRESHOLD: Record<
  NoblePhantasmUsageQualityFilter,
  number
> = {
  'ssr-plus': QUALITY_ORDER.indexOf('SSR+'),
  ssr: QUALITY_ORDER.indexOf('SSR'),
  all: QUALITY_ORDER.length - 1,
};

const DEFAULT_USAGE_QUALITY_FILTER: NoblePhantasmUsageQualityFilter =
  'ssr-plus';

export default function NoblePhantasms() {
  const { getSelectedSkin } = useContext(CharacterSkinContext);
  const { accent } = useGradientAccent();
  const tooltipProps = useMobileTooltip();
  const { isOpen: usageFilterOpen, toggle: toggleUsageFilter } =
    useFilterPanel();
  const [activeTab, handleTabChange] = useTabParam(
    'tab',
    'noble-phantasms',
    ['noble-phantasms', 'usage']
  );
  const {
    data: noblePhantasms,
    loading,
    error,
    retry,
  } = useNoblePhantasms();
  const {
    data: characters,
    loading: charactersLoading,
    error: charactersError,
  } = useCharacters();
  const { data: statusEffects } = useStatusEffects();

  const noblePhantasmFields = useMemo<FieldDef[]>(() => {
    const nameCounts = new Map<string, number>();
    for (const char of characters) {
      nameCounts.set(char.name, (nameCounts.get(char.name) ?? 0) + 1);
    }
    const characterOptions = characters
      .map((c) => {
        const slug = getCharacterRouteSlug(c);
        const label =
          (nameCounts.get(c.name) ?? 1) > 1
            ? `${c.name} (${c.quality})`
            : c.name;
        return { value: slug, label };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
    const characterIcons: Record<string, string> = {};
    for (const char of characters) {
      const slug = getCharacterRouteSlug(char);
      const portrait = getPortrait(char.name, slug, getSelectedSkin(slug));
      if (portrait) characterIcons[slug] = portrait;
    }
    return [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        placeholder: 'Noble Phantasm name',
      },
      {
        name: 'quality',
        label: 'Quality',
        type: 'select',
        required: true,
        options: QUALITY_ORDER,
      },
      {
        name: 'character_slug',
        label: 'Character',
        type: 'select',
        required: true,
        options: characterOptions,
        optionIcons: characterIcons,
      },
    ];
  }, [characters, getSelectedSkin]);

  const charNameBySlug = useMemo(
    () =>
      new Map(
        [...buildCharacterByIdentityMap(characters)].map(([slug, character]) => [
          slug,
          character.name,
        ])
      ),
    [characters]
  );

  const charBySlug = useMemo(
    () => buildCharacterByIdentityMap(characters),
    [characters]
  );

  const linkedCharacterOptions = useMemo(() => {
    const linkedCharacters = [
      ...new Map(
        noblePhantasms.flatMap((item) => {
          if (!item.character_slug) return [];
          const character = charBySlug.get(item.character_slug);
          return character
            ? [[item.character_slug, character] as const]
            : [];
        })
      ).entries(),
    ];
    const nameCounts = new Map<string, number>();
    for (const [, character] of linkedCharacters) {
      nameCounts.set(
        character.name,
        (nameCounts.get(character.name) ?? 0) + 1
      );
    }

    return linkedCharacters
      .map(([slug, character]) => ({
        value: slug,
        label:
          (nameCounts.get(character.name) ?? 1) > 1
            ? `${character.name} (${character.quality})`
            : character.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [charBySlug, noblePhantasms]);

  const [usageQualityFilter, setUsageQualityFilter] =
    useState<NoblePhantasmUsageQualityFilter>(() => {
      if (typeof window === 'undefined') return DEFAULT_USAGE_QUALITY_FILTER;
      const stored = window.localStorage.getItem(
        STORAGE_KEY.NOBLE_PHANTASM_USAGE_QUALITY_FILTER
      );
      return USAGE_QUALITY_OPTIONS.some((option) => option.value === stored)
        ? (stored as NoblePhantasmUsageQualityFilter)
        : DEFAULT_USAGE_QUALITY_FILTER;
    });
  const [usageLinkedCharacterSlugs, setUsageLinkedCharacterSlugs] = useState<
    string[]
  >(() =>
    readStoredJson(
      STORAGE_KEY.NOBLE_PHANTASM_USAGE_CHARACTERS,
      [],
      (value): value is string[] =>
        Array.isArray(value) &&
        value.every((item) => typeof item === 'string')
    )
  );

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY.NOBLE_PHANTASM_USAGE_QUALITY_FILTER,
      usageQualityFilter
    );
  }, [usageQualityFilter]);

  useEffect(() => {
    writeStoredJson(
      STORAGE_KEY.NOBLE_PHANTASM_USAGE_CHARACTERS,
      usageLinkedCharacterSlugs
    );
  }, [usageLinkedCharacterSlugs]);

  const usageEligibleCharacters = useMemo(() => {
    const threshold = USAGE_QUALITY_THRESHOLD[usageQualityFilter];
    return characters.filter(
      (character) => QUALITY_ORDER.indexOf(character.quality) <= threshold
    );
  }, [characters, usageQualityFilter]);

  const noblePhantasmUsage = useMemo<NoblePhantasmUsage[]>(() => {
    const itemByReference = new Map(
      noblePhantasms.flatMap((item) => [
        [item.slug, item] as const,
        ...(item.legacy_slug
          ? ([[item.legacy_slug, item]] as const)
          : []),
      ])
    );
    const charactersByItem = new Map<string, typeof characters>();

    for (const character of usageEligibleCharacters) {
      const reference = character.recommended_noble_phantasm?.trim();
      if (!reference) continue;

      const item = itemByReference.get(reference);
      if (!item) continue;

      const usingCharacters = charactersByItem.get(item.slug) ?? [];
      usingCharacters.push(character);
      charactersByItem.set(item.slug, usingCharacters);
    }

    return noblePhantasms
      .map((item) => {
        const usingCharacters = [...(charactersByItem.get(item.slug) ?? [])].sort(
          (a, b) =>
            QUALITY_ORDER.indexOf(a.quality) -
              QUALITY_ORDER.indexOf(b.quality) ||
            a.name.localeCompare(b.name)
        );
        return {
          item,
          characters: usingCharacters,
          count: usingCharacters.length,
          percentage: usageEligibleCharacters.length
            ? Math.round(
                (usingCharacters.length / usageEligibleCharacters.length) * 100
              )
            : 0,
        };
      })
      .sort(
        (a, b) => b.count - a.count || a.item.name.localeCompare(b.item.name)
      );
  }, [noblePhantasms, usageEligibleCharacters]);

  const usageSearchFn = useCallback(
    (entry: NoblePhantasmUsage, query: string) => {
      const characterName =
        charNameBySlug.get(entry.item.character_slug ?? '') ?? '';
      return (
        entry.item.name.toLowerCase().includes(query) ||
        characterName.toLowerCase().includes(query)
      );
    },
    [charNameBySlug]
  );

  const usageWithLinkedCharacterFilter = useMemo(
    () =>
      usageLinkedCharacterSlugs.length === 0
        ? noblePhantasmUsage
        : noblePhantasmUsage.filter(
            ({ item }) =>
              item.character_slug &&
              usageLinkedCharacterSlugs.includes(item.character_slug)
          ),
    [noblePhantasmUsage, usageLinkedCharacterSlugs]
  );

  const usageSortFn = useCallback(
    (
      a: NoblePhantasmUsage,
      b: NoblePhantasmUsage,
      col: string | null,
      dir: 'asc' | 'desc'
    ) => {
      let cmp: number;
      if (col === 'name') {
        cmp = a.item.name.localeCompare(b.item.name);
      } else if (col === 'rarity') {
        cmp =
          QUALITY_ORDER.indexOf(a.item.quality) -
            QUALITY_ORDER.indexOf(b.item.quality) ||
          a.item.name.localeCompare(b.item.name);
      } else if (col === 'character') {
        cmp =
          (charNameBySlug.get(a.item.character_slug ?? '') ?? '').localeCompare(
            charNameBySlug.get(b.item.character_slug ?? '') ?? ''
          ) || a.item.name.localeCompare(b.item.name);
      } else if (col === 'count') {
        cmp = a.count - b.count;
      } else {
        return 0;
      }
      return applyDir(cmp, dir);
    },
    [charNameBySlug]
  );

  const {
    search: usageSearch,
    setSearch: setUsageSearch,
    sortCol: usageSortCol,
    sortDir: usageSortDir,
    handleSort: handleUsageSort,
    filtered: filteredUsage,
    pageItems: usagePageItems,
    page: usagePage,
    setPage: setUsagePage,
    totalPages: usageTotalPages,
    pageSize: usagePageSize,
    setPageSize: setUsagePageSize,
    pageSizeOptions: usagePageSizeOptions,
  } = useSecondaryTabList(usageWithLinkedCharacterFilter, {
    searchFn: usageSearchFn,
    sortFn: usageSortFn,
    storageKeys: {
      search: STORAGE_KEY.NOBLE_PHANTASM_USAGE_SEARCH,
      sort: STORAGE_KEY.NOBLE_PHANTASM_USAGE_SORT,
    },
    pageSize: PAGE_SIZE,
    extraPaginationKey: usageQualityFilter,
  });

  const [expandedUsageItems, setExpandedUsageItems] = useState<Set<string>>(
    () => new Set()
  );

  const toggleExpandedUsageItem = (slug: string) => {
    setExpandedUsageItems((current) => {
      const next = new Set(current);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const usageFilterCount =
    (usageSearch ? 1 : 0) +
    (usageQualityFilter !== DEFAULT_USAGE_QUALITY_FILTER ? 1 : 0) +
    usageLinkedCharacterSlugs.length;

  const resetUsageFilters = () => {
    setUsageSearch('');
    setUsageQualityFilter(DEFAULT_USAGE_QUALITY_FILTER);
    setUsageLinkedCharacterSlugs([]);
  };

  const {
    filters,
    setFilters,
    resetFilters,
    filterOpen,
    toggleFilter,
    viewMode,
    setViewMode,
    sortCol,
    sortDir,
    handleSort,
    pageItems,
    filtered,
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize,
    pageSizeOptions,
    activeFilterCount,
  } = useFilteredPageData(noblePhantasms, {
    emptyFilters: EMPTY_NOBLE_PHANTASM_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.NOBLE_PHANTASM_FILTERS,
      viewMode: STORAGE_KEY.NOBLE_PHANTASM_VIEW_MODE,
      sort: STORAGE_KEY.NOBLE_PHANTASM_SORT,
    },
    defaultViewMode: 'grid',
    filterFn: (np, filters) =>
      matchesNoblePhantasmFilters(np, filters, charBySlug),
    sortFn: (a, b, col, dir) => {
      if (col) {
        let cmp = 0;
        if (col === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (col === 'character') {
          const cA = charNameBySlug.get(a.character_slug ?? '') ?? '';
          const cB = charNameBySlug.get(b.character_slug ?? '') ?? '';
          if (!cA && cB) return 1;
          if (cA && !cB) return -1;
          cmp = cA.localeCompare(cB);
        } else if (col === 'rarity') {
          cmp =
            QUALITY_ORDER.indexOf(a.quality) -
              QUALITY_ORDER.indexOf(b.quality) ||
            a.name.localeCompare(b.name);
        } else if (col === 'effects') {
          cmp = b.effects.length - a.effects.length;
        } else if (col === 'skills') {
          cmp = b.skills.length - a.skills.length;
        }
        if (cmp !== 0) return applyDir(cmp, dir);
      }
      const cA = charNameBySlug.get(a.character_slug ?? '') ?? '';
      const cB = charNameBySlug.get(b.character_slug ?? '') ?? '';
      const charCmp = cA.localeCompare(cB);
      if (charCmp !== 0) return charCmp;
      return a.name.localeCompare(b.name);
    },
  });

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(noblePhantasms),
    [noblePhantasms]
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Noble Phantasms" timestamp={mostRecentUpdate}>
          {activeTab === 'usage' ? null : (
            <Group gap="xs">
              <ExportButton
                data={noblePhantasms}
                filename="noble-phantasm.json"
              />
              <SuggestModal
                buttonLabel="Suggest"
                modalTitle="Suggest a New Noble Phantasm"
                issueTitle="[Noble Phantasm] New noble phantasm suggestion"
                fields={noblePhantasmFields}
              />
            </Group>
          )}
        </ListPageHeader>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="noble-phantasms">Noble Phantasms</Tabs.Tab>
            <Tabs.Tab value="usage">Usage</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="noble-phantasms" pt="md">
            <ListPageShell
              loading={loading}
              error={error}
              onRetry={retry}
              errorTitle="Could not load noble phantasms"
              hasData={noblePhantasms.length > 0}
              emptyMessage="No noble phantasm data available yet."
              skeletonCards={4}
            >
              <FilteredListShell
            count={filtered.length}
            noun="noble phantasm"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterCount={activeFilterCount}
            filterOpen={filterOpen}
            onFilterToggle={toggleFilter}
            onResetFilters={resetFilters}
            filterContent={
              <NoblePhantasmFilter
                filters={filters}
                onChange={setFilters}
              />
            }
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={setPageSize}
            gridContent={
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {pageItems.map((np) => {
                  const iconSrc = getNoblePhantasmIcon(np.slug);
                  const linkedChar = np.character_slug ? charBySlug.get(np.character_slug) : undefined;
                  return (
                    <EntitySummaryCard
                      key={np.name}
                      to={`/noble-phantasms/${np.slug}`}
                      title={np.name}
                      imageSrc={iconSrc}
                      titleAccessory={<QualityIcon quality={np.quality} />}
                      metadata={
                        <Group gap="xs" wrap="wrap">
                          {np.character_slug && charNameBySlug.get(np.character_slug) && (
                            <CharacterTag
                              slug={np.character_slug}
                              size="sm"
                              color={accent.secondary}
                              link={false}
                            />
                          )}
                        </Group>
                      }
                      description={
                        (np.effects[0]?.description || np.skills[0]?.description) && (
                          <ExpandableText size="xs">
                            <RichText
                              text={
                                np.effects[0]?.description ??
                                np.skills[0]?.description ??
                                ''
                              }
                              statusEffects={statusEffects}
                              skills={linkedChar?.skills}
                              talent={linkedChar?.talent}
                            />
                          </ExpandableText>
                        )
                      }
                    />
                  );
                })}
              </SimpleGrid>
            }
            tableContent={
              <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                <Table striped highlightOnHover style={getMinWidthStyle(800)}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Icon</Table.Th>
                      <SortableTh
                        sortKey="name"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Name
                      </SortableTh>
                      <SortableTh
                        sortKey="character"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Character
                      </SortableTh>
                      <SortableTh
                        sortKey="rarity"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Rarity
                      </SortableTh>
                      <SortableTh
                        sortKey="effects"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Effects
                      </SortableTh>
                      <SortableTh
                        sortKey="skills"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Skills
                      </SortableTh>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pageItems.map((np) => {
                      const iconSrc = getNoblePhantasmIcon(np.slug);
                      return (
                        <Table.Tr key={np.name}>
                          <Table.Td>
                            {iconSrc ? (
                              <SafeImage
                                src={iconSrc}
                                alt={np.name}
                                w={IMAGE_SIZE.PORTRAIT_SM}
                                h={IMAGE_SIZE.PORTRAIT_SM}
                                fit="contain"
                                radius="sm"
                                loading="lazy"
                              />
                            ) : (
                              <Text c="dimmed" size="sm">
                                —
                              </Text>
                            )}
                          </Table.Td>
                          <EntityTableLinkCell
                            to={`/noble-phantasms/${np.slug}`}
                          >
                            {np.name}
                          </EntityTableLinkCell>
                          <Table.Td>
                            {np.character_slug && charNameBySlug.get(np.character_slug) ? (
                              <CharacterTag
                                slug={np.character_slug}
                                size="sm"
                                color={accent.secondary}
                                link={false}
                              />
                            ) : (
                              <Text size="sm" c="dimmed">
                                —
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <QualityIcon quality={np.quality} />
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{np.effects.length}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{np.skills.length}</Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            }
              />
            </ListPageShell>
          </Tabs.Panel>

          <Tabs.Panel value="usage" pt="md">
            <NoblePhantasmUsageTab
              loading={loading || charactersLoading}
              error={error || charactersError}
              noblePhantasms={noblePhantasms}
              filteredUsage={filteredUsage}
              usageEligibleCharacters={usageEligibleCharacters}
              usageFilterCount={usageFilterCount}
              usageFilterOpen={usageFilterOpen}
              onUsageFilterToggle={toggleUsageFilter}
              usageSearch={usageSearch}
              onUsageSearchChange={setUsageSearch}
              onResetUsageFilters={resetUsageFilters}
              usageQualityFilter={usageQualityFilter}
              onUsageQualityFilterChange={setUsageQualityFilter}
              usageQualityOptions={USAGE_QUALITY_OPTIONS}
              linkedCharacterOptions={linkedCharacterOptions}
              linkedCharacterSlugs={usageLinkedCharacterSlugs}
              onLinkedCharacterSlugsChange={setUsageLinkedCharacterSlugs}
              usageSortCol={usageSortCol}
              usageSortDir={usageSortDir}
              onUsageSort={handleUsageSort}
              usagePageItems={usagePageItems}
              expandedUsageItems={expandedUsageItems}
              onToggleExpandedUsageItem={toggleExpandedUsageItem}
              usagePage={usagePage}
              usageTotalPages={usageTotalPages}
              onUsagePageChange={setUsagePage}
              usagePageSize={usagePageSize}
              usagePageSizeOptions={usagePageSizeOptions}
              onUsagePageSizeChange={setUsagePageSize}
              accent={accent}
              tooltipProps={tooltipProps}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
