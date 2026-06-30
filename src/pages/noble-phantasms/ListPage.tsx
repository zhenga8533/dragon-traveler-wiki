import ExpandableText from '@/components/ui/ExpandableText';
import SafeImage from '@/components/ui/SafeImage';
import {
  Container,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useMemo } from 'react';
import { getPortrait } from '@/assets';
import { getNoblePhantasmIcon } from '@/assets';
import CharacterTag from '@/features/characters/components/CharacterTag';
import EntityTableLinkCell from '@/components/common/EntityTableLinkCell';
import EntitySummaryCard from '@/components/common/EntitySummaryCard';
import EntityFilter from '@/components/common/EntityFilter';
import SortableTh from '@/components/ui/SortableTh';
import FilteredListShell from '@/components/layout/FilteredListShell';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ListPageShell from '@/components/layout/ListPageShell';
import ExportButton from '@/components/tools/ExportButton';
import SuggestModal, { type FieldDef } from '@/components/tools/SuggestModal';
import { getMinWidthStyle } from '@/constants/styles';
import { IMAGE_SIZE, STORAGE_KEY } from '@/constants/ui';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useNoblePhantasms, useStatusEffects } from '@/features/wiki/hooks/use-wiki-data';
import {
  applyDir,
  useFilteredPageData,
  useGradientAccent,
} from '@/hooks';
import RichText from '@/components/common/RichText';
import { getLatestTimestamp } from '@/utils';
import { getCharacterRouteSlug } from '@/features/characters/utils/character-route';

interface NoblePhantasmFilters {
  search: string;
}

const EMPTY_FILTERS: NoblePhantasmFilters = {
  search: '',
};

export default function NoblePhantasms() {
  const { accent } = useGradientAccent();
  const {
    data: noblePhantasms,
    loading,
    error,
  } = useNoblePhantasms();
  const { data: characters } = useCharacters();
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
      const portrait = getPortrait(char.name, slug);
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
        name: 'character_slug',
        label: 'Character',
        type: 'select',
        required: true,
        options: characterOptions,
        optionIcons: characterIcons,
      },
    ];
  }, [characters]);

  const charNameBySlug = useMemo(
    () => new Map(characters.map((c) => [c.slug, c.name])),
    [characters]
  );

  const charBySlug = useMemo(
    () => new Map(characters.map((c) => [c.slug, c])),
    [characters]
  );

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
    emptyFilters: EMPTY_FILTERS,
    storageKeys: {
      filters: STORAGE_KEY.NOBLE_PHANTASM_FILTERS,
      viewMode: STORAGE_KEY.NOBLE_PHANTASM_VIEW_MODE,
      sort: STORAGE_KEY.NOBLE_PHANTASM_SORT,
    },
    defaultViewMode: 'grid',
    filterFn: (np, filters) => {
      if (!filters.search) return true;
      const q = filters.search.toLowerCase();
      const charName = charNameBySlug.get(np.character_slug ?? '') ?? '';
      return (
        np.name.toLowerCase().includes(q) ||
        charName.toLowerCase().includes(q)
      );
    },
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
          <Group gap="xs">
            <ExportButton data={noblePhantasms} filename="noble-phantasm.json" />
            <SuggestModal
              buttonLabel="Suggest"
              modalTitle="Suggest a New Noble Phantasm"
              issueTitle="[Noble Phantasm] New noble phantasm suggestion"
              fields={noblePhantasmFields}
            />
          </Group>
        </ListPageHeader>

        <ListPageShell
          loading={loading}
          error={error}
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
              <EntityFilter
                groups={[]}
                selected={{}}
                onChange={() => {}}
                onClear={resetFilters}
                search={filters.search}
                onSearchChange={(value) =>
                  setFilters({ ...filters, search: value })
                }
                searchPlaceholder="Search by name or character..."
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
                      metadata={
                        <Group gap="xs" wrap="wrap">
                          {np.character_slug && charNameBySlug.get(np.character_slug) && (
                            <CharacterTag
                              name={charNameBySlug.get(np.character_slug)!}
                              size="sm"
                              color={accent.secondary}
                              link={false}
                              routePath={`/characters/${np.character_slug}`}
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
                                name={charNameBySlug.get(np.character_slug)!}
                                size="sm"
                                color={accent.secondary}
                                link={false}
                                routePath={`/characters/${np.character_slug}`}
                              />
                            ) : (
                              <Text size="sm" c="dimmed">
                                —
                              </Text>
                            )}
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
      </Stack>
    </Container>
  );
}
