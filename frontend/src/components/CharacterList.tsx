import {
  Badge,
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
import { getPortrait } from '../assets/character';
import { QUALITY_ICON_MAP } from '../assets/quality';
import { CLASS_ICON_MAP } from '../assets/class';
import { FACTION_ICON_MAP } from '../assets/faction';
import {
  CHARACTER_GRID_COLS,
  CHARACTER_GRID_SPACING,
  STORAGE_KEY,
} from '../constants/ui';
import { TierListReferenceContext } from '../contexts';
import {
  useFilteredData,
  useFilterPanel,
  useFilters,
  useViewMode,
} from '../hooks/use-filters';
import type { Character } from '../types/character';
import type { CharacterFilters } from '../utils/filter-characters';
import {
  EMPTY_FILTERS,
  extractAllEffectRefs,
  filterCharacters,
  sortCharactersByQuality,
} from '../utils/filter-characters';
import CharacterCard, { QUALITY_BORDER_COLOR } from './CharacterCard';
import CharacterFilter from './CharacterFilter';
import FilterToolbar from './FilterToolbar';

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

  const filteredAndSorted = useFilteredData({
    data: characters,
    filters,
    filterFn: filterCharacters,
    sortFn: (filtered) => sortCharactersByQuality(filtered),
  });

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.qualities.length +
    filters.classes.length +
    filters.factions.length +
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
            {filteredAndSorted.map((char) => (
              <CharacterCard
                key={char.name}
                name={char.name}
                quality={char.quality}
                tierLabel={getTierLabel(char.name)}
                is_global={char.is_global}
              />
            ))}
          </SimpleGrid>
        ) : (
          <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
            <Table striped highlightOnHover style={{ minWidth: 560 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Quality</Table.Th>
                  <Table.Th>Class</Table.Th>
                  <Table.Th>Factions</Table.Th>
                  <Table.Th>Global</Table.Th>
                  {selectedTierListName && <Table.Th>Tier</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredAndSorted.map((char) => (
                  <Table.Tr key={char.name} style={{ cursor: 'pointer' }}>
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
                              flexShrink: 0,
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
                      <Badge
                        variant="light"
                        size="sm"
                        color={char.is_global ? 'green' : 'orange'}
                      >
                        {char.is_global ? 'Global' : 'TW / CN'}
                      </Badge>
                    </Table.Td>
                    {selectedTierListName && (
                      <Table.Td>
                        <Text size="sm">{getTierLabel(char.name)}</Text>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Stack>
    </Paper>
  );
}
