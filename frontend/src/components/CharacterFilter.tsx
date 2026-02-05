import {
  TextInput,
  Chip,
  Group,
  Stack,
  Button,
  MultiSelect,
  Text,
  Image,
} from '@mantine/core';
import { IoSearch, IoClose } from 'react-icons/io5';
import type { Quality, CharacterClass, Faction } from '../types/character';
import type { CharacterFilters } from '../utils/filter-characters';
import { EMPTY_FILTERS } from '../utils/filter-characters';
import { CLASS_ICON_MAP } from '../assets/class';
import { FACTION_ICON_MAP } from '../assets/faction';

const QUALITIES: Quality[] = ['Myth', 'Legend+', 'Legend', 'Epic', 'Elite'];
const CLASSES: CharacterClass[] = ['Guardian', 'Priest', 'Assassin', 'Warrior', 'Archer', 'Mage'];
const FACTIONS: Faction[] = [
  'Elemental Echo',
  'Wild Spirit',
  'Arcane Wisdom',
  'Sanctum Glory',
  'Otherworld Return',
  'Illusion Veil',
];

export default function CharacterFilter({
  filters,
  onChange,
  effectOptions,
}: {
  filters: CharacterFilters;
  onChange: (filters: CharacterFilters) => void;
  effectOptions: string[];
}) {
  const hasFilters =
    filters.search !== '' ||
    filters.qualities.length > 0 ||
    filters.classes.length > 0 ||
    filters.factions.length > 0 ||
    filters.statusEffects.length > 0;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <TextInput
          placeholder="Search by name..."
          leftSection={<IoSearch size={16} />}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.currentTarget.value })}
          style={{ flex: 1 }}
        />
        {hasFilters && (
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            leftSection={<IoClose size={14} />}
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            Clear all
          </Button>
        )}
      </Group>

      <Stack gap="xs">
        <Text size="xs" fw={500} c="dimmed">Quality</Text>
        <Chip.Group
          multiple
          value={filters.qualities}
          onChange={(val) => onChange({ ...filters, qualities: val as Quality[] })}
        >
          <Group gap="xs">
            {QUALITIES.map((q) => (
              <Chip key={q} value={q} size="xs">{q}</Chip>
            ))}
          </Group>
        </Chip.Group>
      </Stack>

      <Stack gap="xs">
        <Text size="xs" fw={500} c="dimmed">Class</Text>
        <Chip.Group
          multiple
          value={filters.classes}
          onChange={(val) => onChange({ ...filters, classes: val as CharacterClass[] })}
        >
          <Group gap="xs">
            {CLASSES.map((c) => (
              <Chip key={c} value={c} size="xs">
                <Group gap={4} wrap="nowrap" align="center">
                  <Image src={CLASS_ICON_MAP[c]} alt={c} w={14} h={14} fit="contain" />
                  <span>{c}</span>
                </Group>
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Stack>

      <Stack gap="xs">
        <Text size="xs" fw={500} c="dimmed">Faction</Text>
        <Chip.Group
          multiple
          value={filters.factions}
          onChange={(val) => onChange({ ...filters, factions: val as Faction[] })}
        >
          <Group gap="xs" wrap="wrap">
            {FACTIONS.map((f) => (
              <Chip key={f} value={f} size="xs">
                <Group gap={4} wrap="nowrap" align="center">
                  <Image src={FACTION_ICON_MAP[f]} alt={f} w={14} h={14} fit="contain" />
                  <span>{f}</span>
                </Group>
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Stack>

      {effectOptions.length > 0 && (
        <Stack gap="xs">
          <Text size="xs" fw={500} c="dimmed">Status Effects</Text>
          <MultiSelect
            data={effectOptions}
            value={filters.statusEffects}
            onChange={(val) => onChange({ ...filters, statusEffects: val })}
            placeholder="Filter by status effect..."
            searchable
            clearable
            size="xs"
          />
        </Stack>
      )}
    </Stack>
  );
}
