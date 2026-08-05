import { DatePickerInput } from '@mantine/dates';
import { Group, Text } from '@mantine/core';
import EntityFilter from '@/components/common/EntityFilter';
import {
  FilterMultiSelect,
  FilterSection,
} from '@/components/common/FilterControls';
import SafeImage from '@/components/ui/SafeImage';
import {
  EMPTY_EVENT_FILTERS,
  type EventFilters,
} from '@/features/wiki/events/filters';
import { useIsMobile } from '@/hooks';

interface EventFilterProps {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
  serverOptions: string[];
  typeOptions: string[];
  characterOptions: string[];
  portraitByReference: Map<string, string>;
}

export default function EventFilter({
  filters,
  onChange,
  serverOptions,
  typeOptions,
  characterOptions,
  portraitByReference,
}: EventFilterProps) {
  const isMobile = useIsMobile();
  const chipSize = isMobile ? 'md' : 'xs';
  const hasFilters =
    filters.search !== '' ||
    filters.servers.length > 0 ||
    filters.types.length > 0 ||
    filters.characters.length > 0 ||
    filters.dateRange[0] !== null ||
    filters.dateRange[1] !== null;
  const groups = [
    serverOptions.length > 0
      ? { key: 'servers', label: 'Server', options: serverOptions }
      : null,
    typeOptions.length > 0
      ? { key: 'types', label: 'Type', options: typeOptions }
      : null,
  ].filter(
    (group): group is { key: string; label: string; options: string[] } =>
      group !== null,
  );

  return (
    <EntityFilter
      groups={groups}
      selected={{ servers: filters.servers, types: filters.types }}
      onChange={(key, value) => onChange({ ...filters, [key]: value })}
      onClear={() => onChange(EMPTY_EVENT_FILTERS)}
      hasActiveFilters={hasFilters}
      search={filters.search}
      onSearchChange={(search) => onChange({ ...filters, search })}
      searchPlaceholder="Search by name, type, or character..."
      afterGroups={
        <>
          {characterOptions.length > 0 ? (
            <FilterSection label="Character">
              <FilterMultiSelect
                data={characterOptions}
                value={filters.characters}
                onChange={(characters) => onChange({ ...filters, characters })}
                placeholder="Filter by character..."
                renderOption={({ option }) => {
                  const portrait = portraitByReference.get(option.value);
                  return (
                    <Group gap="xs" align="center">
                      {portrait ? (
                        <SafeImage
                          src={portrait}
                          alt=""
                          w={20}
                          h={20}
                          fit="contain"
                          radius="sm"
                        />
                      ) : null}
                      <Text size="sm">{option.label}</Text>
                    </Group>
                  );
                }}
                searchable={characterOptions.length >= 8}
                clearable
                size={chipSize}
                style={{ flex: 1, minWidth: 180 }}
                comboboxProps={{ withinPortal: !isMobile }}
              />
            </FilterSection>
          ) : null}

          <FilterSection label="Date Range">
            <DatePickerInput
              type="range"
              value={filters.dateRange}
              onChange={(dateRange) => onChange({ ...filters, dateRange })}
              placeholder="Pick date range"
              clearable
              size={chipSize}
              valueFormat="MMM D, YYYY"
              style={{ minWidth: 220 }}
            />
          </FilterSection>
        </>
      }
    />
  );
}
