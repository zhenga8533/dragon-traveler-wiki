import {
  ActionIcon,
  Badge,
  Button,
  Collapse,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { IoFilter, IoGrid, IoList } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { getPortrait } from '../assets/character';
import { QUALITY_ICON_MAP } from '../assets/character_quality';
import { CLASS_ICON_MAP } from '../assets/class';
import { FACTION_ICON_MAP } from '../assets/faction';
import { QUALITY_ORDER } from '../constants/colors';
import type { Character } from '../types/character';
import type { CharacterFilters } from '../utils/filter-characters';
import {
  EMPTY_FILTERS,
  extractAllEffectRefs,
  filterCharacters,
} from '../utils/filter-characters';
import CharacterCard, { QUALITY_BORDER_COLOR } from './CharacterCard';
import CharacterFilter from './CharacterFilter';

type ViewMode = 'grid' | 'list';
const VIEW_MODE_STORAGE_KEY = 'characters:viewMode';

interface CharacterListProps {
  characters: Character[];
  cols?: { base?: number; xs?: number; sm?: number; md?: number };
  spacing?: number | string;
  showFilter?: boolean;
}

export default function CharacterList({
  characters,
  cols = { base: 4, xs: 5, sm: 6, md: 8 },
  spacing = 4,
  showFilter = true,
}: CharacterListProps) {
  const [filters, setFilters] = useState<CharacterFilters>(EMPTY_FILTERS);
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') {
      return 'grid';
    }
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === 'grid' || stored === 'list' ? stored : 'grid';
  });

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const effectOptions = useMemo(
    () => extractAllEffectRefs(characters),
    [characters]
  );

  const filteredAndSorted = useMemo(() => {
    const filtered = filterCharacters(characters, filters);
    return filtered.sort((a, b) => {
      // Sort by quality first (using QUALITY_ORDER)
      const qualityIndexA = QUALITY_ORDER.indexOf(a.quality);
      const qualityIndexB = QUALITY_ORDER.indexOf(b.quality);

      if (qualityIndexA !== qualityIndexB) {
        return qualityIndexA - qualityIndexB;
      }

      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [characters, filters]);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.qualities.length +
    filters.classes.length +
    filters.factions.length +
    filters.statusEffects.length;

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            {filteredAndSorted.length} character
            {filteredAndSorted.length !== 1 ? 's' : ''}
          </Text>
          <Group gap="xs">
            <Group gap={4}>
              <Tooltip label="Grid view">
                <ActionIcon
                  variant={viewMode === 'grid' ? 'filled' : 'default'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <IoGrid size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="List view">
                <ActionIcon
                  variant={viewMode === 'list' ? 'filled' : 'default'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <IoList size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
            {showFilter && (
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
            )}
          </Group>
        </Group>

        {showFilter && (
          <Collapse in={filterOpen}>
            <Paper p="md" radius="md" withBorder>
              <CharacterFilter
                filters={filters}
                onChange={setFilters}
                effectOptions={effectOptions}
              />
            </Paper>
          </Collapse>
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
              />
            ))}
          </SimpleGrid>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Quality</Table.Th>
                <Table.Th>Class</Table.Th>
                <Table.Th>Factions</Table.Th>
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
                        <Text size="sm" fw={500}>
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
                        w={24}
                        h={24}
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
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Paper>
  );
}
