import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import {
  createQualityFilterGroup,
  orderFilterOptions,
} from '@/components/common/EntityFilterGroups';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ExportButton from '@/components/tools/ExportButton';
import SuggestModal from '@/components/tools/SuggestModal';
import {
  GOLDEN_ALLIANCE_EFFECTS_FIELDS,
  GOLDEN_ALLIANCE_FIELDS,
  HOWLKIN_FIELDS,
  HOWLKIN_STATS_FIELDS,
} from '@/features/wiki/howlkins/form-fields';
import { QUALITY_ORDER } from '@/constants/quality';
import { PAGE_SIZE, STORAGE_KEY } from '@/constants/ui';

import HowlkinsTab from '@/features/wiki/howlkins/components/HowlkinsTab';
import GoldenAlliancesTab from '@/features/wiki/howlkins/components/GoldenAlliancesTab';
import type { GoldenAlliance, Howlkin } from '@/features/wiki/howlkins/types';
import { useGoldenAlliances, useHowlkins } from '@/features/wiki/hooks/use-wiki-data';
import {
  applyDir,
  useFilteredPageData,
  useGradientAccent,
  useSearchParamFilter,
  useSecondaryTabList,
  useTabParam,
} from '@/hooks';
import type { Quality } from '@/types/quality';
import { getLatestTimestamp } from '@/utils';
import { Container, Group, Stack, Tabs } from '@mantine/core';
import { useCallback, useMemo } from 'react';

interface HowlkinFilters {
  search: string;
  qualities: Quality[];
}

const EMPTY_FILTERS: HowlkinFilters = {
  search: '',
  qualities: [],
};

export default function Howlkins() {
  const { accent } = useGradientAccent();
  const [activeTab, handleTabChange] = useTabParam('tab', 'howlkins', [
    'howlkins',
    'golden-alliances',
  ]);

  const {
    data: howlkins,
    loading: howlkinsLoading,
    error: howlkinsError,
    retry: retryHowlkins,
  } = useHowlkins();

  const {
    data: goldenAlliances,
    loading: alliancesLoading,
    error: alliancesError,
  } = useGoldenAlliances();

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
    pageItems: howlkinPageItems,
    filtered,
    page: howlkinPage,
    setPage: setHowlkinPage,
    totalPages: howlkinTotalPages,
    pageSize: howlkinPageSize,
    setPageSize: setHowlkinPageSize,
    pageSizeOptions: howlkinPageSizeOptions,
    activeFilterCount,
  } = useFilteredPageData(howlkins, {
    emptyFilters: EMPTY_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.HOWLKIN_FILTERS,
      viewMode: STORAGE_KEY.HOWLKIN_VIEW_MODE,
      sort: STORAGE_KEY.HOWLKIN_SORT,
    },
    defaultViewMode: 'grid',
    filterFn: (howlkin, filters) => {
      if (
        filters.search &&
        !howlkin.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.qualities.length > 0 &&
        !filters.qualities.includes(howlkin.quality)
      ) {
        return false;
      }
      return true;
    },
    sortFn: (a, b, col, dir) => {
      if (col) {
        let cmp = 0;
        if (col === 'name') {
          cmp = a.name.localeCompare(b.name);
        } else if (col === 'quality') {
          cmp =
            QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality);
        }
        if (cmp !== 0) return applyDir(cmp, dir);
      }
      // Default: quality > name
      const qA = QUALITY_ORDER.indexOf(a.quality);
      const qB = QUALITY_ORDER.indexOf(b.quality);
      if (qA !== qB) return qA - qB;
      return a.name.localeCompare(b.name);
    },
  });
  useSearchParamFilter(setFilters);

  const qualityOptions = useMemo(() => {
    return orderFilterOptions(
      howlkins.flatMap((howlkin) => (howlkin.quality ? [howlkin.quality] : [])),
      QUALITY_ORDER
    );
  }, [howlkins]);

  const filterGroups: ChipFilterGroup[] = useMemo(() => {
    if (qualityOptions.length === 0) return [];
    return [createQualityFilterGroup({ options: qualityOptions })];
  }, [qualityOptions]);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(howlkins),
    [howlkins]
  );

  const mostRecentAllianceUpdate = useMemo(
    () => getLatestTimestamp(goldenAlliances),
    [goldenAlliances]
  );

  const howlkinMap = useMemo(() => {
    const map = new Map<string, Howlkin>();
    for (const h of howlkins) {
      map.set(h.slug, h);
    }
    return map;
  }, [howlkins]);

  const howlkinToAlliance = useMemo(() => {
    const map = new Map<string, string>();
    for (const alliance of goldenAlliances) {
      for (const slug of alliance.howlkins) {
        map.set(slug, alliance.slug);
      }
    }
    return map;
  }, [goldenAlliances]);

  const allianceSearchFn = useCallback(
    (alliance: GoldenAlliance, query: string) =>
      alliance.name.toLowerCase().includes(query) ||
      alliance.howlkins.some((h) => h.toLowerCase().includes(query)),
    []
  );

  const {
    search: allianceSearch,
    setSearch: setAllianceSearch,
    filtered: filteredAlliances,
    pageItems: alliancePageItems,
    page: alliancePage,
    setPage: setAlliancePage,
    totalPages: allianceTotalPages,
    pageSize: alliancePageSize,
    setPageSize: setAlliancePageSize,
    pageSizeOptions: alliancePageSizeOptions,
  } = useSecondaryTabList(goldenAlliances, {
    searchFn: allianceSearchFn,
    storageKeys: { search: STORAGE_KEY.GOLDEN_ALLIANCE_SEARCH },
    pageSize: PAGE_SIZE,
  });

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader
          title="Howlkins"
          timestamp={
            activeTab === 'golden-alliances'
              ? mostRecentAllianceUpdate
              : mostRecentUpdate
          }
        >
          {activeTab === 'golden-alliances' ? (
            <Group gap="xs">
              <ExportButton data={goldenAlliances} filename="golden-alliances.json" />
              <SuggestModal
                buttonLabel="Suggest"
                modalTitle="Suggest a New Golden Alliance"
                issueTitle="[Golden Alliance] New golden alliance suggestion"
                fields={GOLDEN_ALLIANCE_FIELDS}
                arrayFields={GOLDEN_ALLIANCE_EFFECTS_FIELDS}
              />
            </Group>
          ) : (
            <Group gap="xs">
              <ExportButton data={howlkins} filename="howlkins.json" />
              <SuggestModal
                buttonLabel="Suggest"
                modalTitle="Suggest a New Howlkin"
                issueTitle="[Howlkin] New howlkin suggestion"
                fields={HOWLKIN_FIELDS}
                arrayFields={HOWLKIN_STATS_FIELDS}
              />
            </Group>
          )}
        </ListPageHeader>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="howlkins">Howlkins</Tabs.Tab>
            <Tabs.Tab value="golden-alliances">Golden Alliances</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="howlkins" pt="md">
            <HowlkinsTab
              loading={howlkinsLoading}
              error={howlkinsError}
              onRetry={retryHowlkins}
              howlkins={howlkins}
              filtered={filtered}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              activeFilterCount={activeFilterCount}
              filterOpen={filterOpen}
              onFilterToggle={toggleFilter}
              onResetFilters={resetFilters}
              page={howlkinPage}
              totalPages={howlkinTotalPages}
              onPageChange={setHowlkinPage}
              pageSize={howlkinPageSize}
              pageSizeOptions={howlkinPageSizeOptions}
              onPageSizeChange={setHowlkinPageSize}
              filters={filters}
              onFiltersChange={setFilters}
              filterGroups={filterGroups}
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
              pageItems={howlkinPageItems}
              howlkinToAlliance={howlkinToAlliance}
              accent={accent}
            />
          </Tabs.Panel>

          <Tabs.Panel value="golden-alliances" pt="md">
            <GoldenAlliancesTab
              loading={alliancesLoading}
              error={alliancesError}
              goldenAlliances={goldenAlliances}
              search={allianceSearch}
              onSearchChange={setAllianceSearch}
              filtered={filteredAlliances}
              page={alliancePage}
              totalPages={allianceTotalPages}
              onPageChange={setAlliancePage}
              pageItems={alliancePageItems}
              pageSize={alliancePageSize}
              pageSizeOptions={alliancePageSizeOptions}
              onPageSizeChange={setAlliancePageSize}
              howlkinMap={howlkinMap}
              accent={accent}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
