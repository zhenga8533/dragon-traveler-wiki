import {
  Badge,
  Container,
  Group,
  Image,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPortrait } from '../assets/character';
import { getNoblePhantasmIcon } from '../assets/noble_phantasm';
import GlobalBadge from '../components/common/GlobalBadge';
import LastUpdated from '../components/common/LastUpdated';
import SortableTh from '../components/common/SortableTh';
import EntityFilter from '../components/EntityFilter';
import FilteredListShell from '../components/layout/FilteredListShell';
import ListPageShell from '../components/layout/ListPageShell';
import SuggestModal, { type FieldDef } from '../components/tools/SuggestModal';
import {
  CARD_HOVER_STYLES,
  CURSOR_POINTER_STYLE,
  FLEX_1_STYLE,
  LINK_BLOCK_RESET_STYLE,
  LINK_RESET_STYLE,
  cardHoverHandlers,
} from '../constants/styles';
import { PAGE_SIZE, STORAGE_KEY } from '../constants/ui';
import { useDataFetch, useMobileTooltip } from '../hooks';
import {
  countActiveFilters,
  useFilterPanel,
  useFilters,
  useViewMode,
} from '../hooks/use-filters';
import { usePagination } from '../hooks/use-pagination';
import { applyDir, useSortState } from '../hooks/use-sort';
import type { Character } from '../types/character';
import type { NoblePhantasm } from '../types/noble-phantasm';
import { getLatestTimestamp } from '../utils';

interface NoblePhantasmFilters {
  search: string;
}

const EMPTY_FILTERS: NoblePhantasmFilters = {
  search: '',
};

export default function NoblePhantasms() {
  const tooltipProps = useMobileTooltip();
  const navigate = useNavigate();
  const {
    data: noblePhantasms,
    loading,
    error,
  } = useDataFetch<NoblePhantasm[]>('data/noble_phantasm.json', []);
  const { data: characters } = useDataFetch<Character[]>(
    'data/characters.json',
    []
  );

  const noblePhantasmFields = useMemo<FieldDef[]>(() => {
    const characterOptions = characters
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b));
    const characterIcons: Record<string, string> = {};
    for (const name of characterOptions) {
      const portrait = getPortrait(name);
      if (portrait) characterIcons[name] = portrait;
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
        name: 'character',
        label: 'Character',
        type: 'select',
        required: true,
        options: characterOptions,
        optionIcons: characterIcons,
      },
      {
        name: 'is_global',
        label: 'Available on Global server',
        type: 'boolean',
      },
      {
        name: 'lore',
        label: 'Lore',
        type: 'textarea',
        placeholder: 'Noble Phantasm lore',
      },
    ];
  }, [characters]);

  const { filters, setFilters } = useFilters<NoblePhantasmFilters>({
    emptyFilters: EMPTY_FILTERS,
    storageKey: STORAGE_KEY.NOBLE_PHANTASM_FILTERS,
  });
  const { isOpen: filterOpen, toggle: toggleFilter } = useFilterPanel();
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.NOBLE_PHANTASM_VIEW_MODE,
    defaultMode: 'grid',
  });
  const { sortState, handleSort } = useSortState(
    STORAGE_KEY.NOBLE_PHANTASM_SORT
  );
  const { col: sortCol, dir: sortDir } = sortState;

  const filtered = useMemo(() => {
    return noblePhantasms
      .filter((np) => {
        if (!filters.search) return true;
        const q = filters.search.toLowerCase();
        return (
          np.name.toLowerCase().includes(q) ||
          (np.character || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortCol) {
          let cmp = 0;
          if (sortCol === 'name') {
            cmp = a.name.localeCompare(b.name);
          } else if (sortCol === 'character') {
            const cA = a.character ?? '';
            const cB = b.character ?? '';
            if (!cA && cB) return 1;
            if (cA && !cB) return -1;
            cmp = cA.localeCompare(cB);
          } else if (sortCol === 'effects') {
            cmp = b.effects.length - a.effects.length;
          } else if (sortCol === 'skills') {
            cmp = b.skills.length - a.skills.length;
          } else if (sortCol === 'global') {
            cmp = (b.is_global ? 1 : 0) - (a.is_global ? 1 : 0);
          }
          if (cmp !== 0) return applyDir(cmp, sortDir);
        }
        const charCmp = (a.character ?? '').localeCompare(b.character ?? '');
        if (charCmp !== 0) return charCmp;
        return a.name.localeCompare(b.name);
      });
  }, [noblePhantasms, filters.search, sortCol, sortDir]);

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    PAGE_SIZE,
    JSON.stringify(filters)
  );
  const pageItems = filtered.slice(offset, offset + PAGE_SIZE);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(noblePhantasms),
    [noblePhantasms]
  );

  const activeFilterCount = countActiveFilters(filters);

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Noble Phantasms</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <SuggestModal
            buttonLabel="Suggest a Noble Phantasm"
            modalTitle="Suggest a New Noble Phantasm"
            issueTitle="[Noble Phantasm] New noble phantasm suggestion"
            fields={noblePhantasmFields}
          />
        </Group>

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
            filterContent={
              <EntityFilter
                groups={[]}
                selected={{}}
                onChange={() => {}}
                onClear={() => setFilters(EMPTY_FILTERS)}
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
            gridContent={
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {pageItems.map((np) => {
                  const iconSrc = getNoblePhantasmIcon(np.name);
                  const portrait = np.character
                    ? getPortrait(np.character)
                    : undefined;
                  return (
                    <Paper
                      key={np.name}
                      component={Link}
                      to={`/noble-phantasms/${encodeURIComponent(np.name)}`}
                      p="md"
                      radius="md"
                      withBorder
                      style={{
                        ...CARD_HOVER_STYLES,
                        ...LINK_BLOCK_RESET_STYLE,
                      }}
                      {...cardHoverHandlers}
                    >
                      <Group gap="md" align="flex-start" wrap="nowrap">
                        {iconSrc && (
                          <Image
                            src={iconSrc}
                            alt={np.name}
                            w={56}
                            h={56}
                            fit="contain"
                            radius="sm"
                            loading="lazy"
                          />
                        )}
                        <Stack gap={4} style={FLEX_1_STYLE}>
                          <Group gap="xs" align="center" wrap="nowrap">
                            {portrait && (
                              <Image
                                src={portrait}
                                alt={np.character || ''}
                                w={20}
                                h={20}
                                fit="cover"
                                radius="xl"
                                loading="lazy"
                              />
                            )}
                            <Text fw={700} c="violet" lineClamp={1}>
                              {np.name}
                            </Text>
                          </Group>
                          <Group gap="xs" wrap="wrap">
                            {np.character && (
                              <Badge variant="light" size="sm" color="blue">
                                {np.character}
                              </Badge>
                            )}
                            <GlobalBadge isGlobal={np.is_global} size="sm" />
                            <Badge variant="light" size="sm" color="grape">
                              {np.effects.length} effect
                              {np.effects.length !== 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="light" size="sm" color="indigo">
                              {np.skills.length} skill
                              {np.skills.length !== 1 ? 's' : ''}
                            </Badge>
                          </Group>
                          <Tooltip
                            label={np.lore}
                            multiline
                            maw={360}
                            {...tooltipProps}
                          >
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              {np.lore}
                            </Text>
                          </Tooltip>
                        </Stack>
                      </Group>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            }
            tableContent={
              <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                <Table striped highlightOnHover style={{ minWidth: 820 }}>
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
                      <SortableTh
                        sortKey="global"
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      >
                        Global
                      </SortableTh>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pageItems.map((np) => {
                      const iconSrc = getNoblePhantasmIcon(np.name);
                      const portrait = np.character
                        ? getPortrait(np.character)
                        : undefined;
                      return (
                        <Table.Tr
                          key={np.name}
                          style={CURSOR_POINTER_STYLE}
                          onClick={() =>
                            navigate(
                              `/noble-phantasms/${encodeURIComponent(np.name)}`
                            )
                          }
                        >
                          <Table.Td>
                            {iconSrc ? (
                              <Image
                                src={iconSrc}
                                alt={np.name}
                                w={40}
                                h={40}
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
                          <Table.Td>
                            <Text
                              component={Link}
                              to={`/noble-phantasms/${encodeURIComponent(np.name)}`}
                              size="sm"
                              fw={600}
                              c="violet"
                              style={LINK_RESET_STYLE}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {np.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs" wrap="nowrap">
                              {portrait && (
                                <Image
                                  src={portrait}
                                  alt={np.character || ''}
                                  w={20}
                                  h={20}
                                  fit="cover"
                                  radius="xl"
                                  loading="lazy"
                                />
                              )}
                              <Text
                                size="sm"
                                c={np.character ? undefined : 'dimmed'}
                                lineClamp={1}
                              >
                                {np.character || '—'}
                              </Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{np.effects.length}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{np.skills.length}</Text>
                          </Table.Td>
                          <Table.Td>
                            <GlobalBadge isGlobal={np.is_global} size="sm" />
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
