import { getStatusEffectIcon } from '@/assets/status_effect';
import EntityFilter from '@/components/common/EntityFilter';
import {
  createClassFilterGroup,
  createFactionFilterGroup,
  createQualityFilterGroup,
} from '@/components/common/EntityFilterGroups';
import {
  FilterChipGroup,
  FilterMultiSelect,
  FilterSection,
} from '@/components/common/FilterControls';
import type { CharacterFilters } from '@/features/characters/utils/filter-characters';
import { EMPTY_FILTERS } from '@/features/characters/utils/filter-characters';
import { useIsMobile } from '@/hooks';
import { Group, Image, Select, SimpleGrid, Text } from '@mantine/core';

export interface CharacterFilterProps {
  filters: CharacterFilters;
  onChange: (filters: CharacterFilters) => void;
  effectOptions: string[];
  showTierFilter?: boolean;
  tierOptions?: string[];
  starLevelOptions?: { value: string; label: string }[];
}

export default function CharacterFilter({
  filters,
  onChange,
  effectOptions,
  showTierFilter = false,
  tierOptions = [],
  starLevelOptions = [],
}: CharacterFilterProps) {
  const isMobile = useIsMobile();
  const chipSize = isMobile ? 'md' : 'xs';
  const groups = [
    createQualityFilterGroup(),
    createClassFilterGroup(),
    createFactionFilterGroup(),
    ...(showTierFilter
      ? [{ key: 'tiers', label: 'Tier', options: tierOptions }]
      : []),
  ];

  const handleGroupChange = (key: string, values: string[]) => {
    switch (key) {
      case 'qualities':
        onChange({
          ...filters,
          qualities: values as CharacterFilters['qualities'],
        });
        return;
      case 'classes':
        onChange({
          ...filters,
          classes: values as CharacterFilters['classes'],
        });
        return;
      case 'factions':
        onChange({
          ...filters,
          factions: values as CharacterFilters['factions'],
        });
        return;
      case 'tiers':
        onChange({ ...filters, tiers: values });
        return;
      default:
        return;
    }
  };

  const hasOwnedFilter =
    filters.ownedOnly ||
    filters.minStarLevel !== null ||
    filters.maxStarLevel !== null;

  return (
    <EntityFilter
      groups={groups}
      selected={{
        qualities: filters.qualities,
        classes: filters.classes,
        factions: filters.factions,
        tiers: filters.tiers,
      }}
      onChange={handleGroupChange}
      onClear={() => onChange(EMPTY_FILTERS)}
      hasActiveFilters={
        filters.search !== '' ||
        filters.qualities.length > 0 ||
        filters.classes.length > 0 ||
        filters.factions.length > 0 ||
        (showTierFilter && filters.tiers.length > 0) ||
        filters.statusEffects.length > 0 ||
        filters.globalOnly !== null ||
        hasOwnedFilter
      }
      search={filters.search}
      onSearchChange={(value) => onChange({ ...filters, search: value })}
      searchPlaceholder="Search by name..."
      beforeGroups={
        <FilterSection label="Server">
          <FilterChipGroup
            size={chipSize}
            value={
              filters.globalOnly === null
                ? []
                : filters.globalOnly
                  ? ['global']
                  : ['cn']
            }
            onChange={(val) => {
              const next = val.length === 0 ? null : val[val.length - 1];
              onChange({
                ...filters,
                globalOnly:
                  next === 'global' ? true : next === 'cn' ? false : null,
              });
            }}
            options={[
              { value: 'global', label: 'Global' },
              { value: 'cn', label: 'TW / CN' },
            ]}
          />
        </FilterSection>
      }
      afterGroups={
        <>
          {effectOptions.length > 0 && (
            <FilterSection label="Effects">
              <FilterMultiSelect
                data={effectOptions}
                value={filters.statusEffects}
                onChange={(val) =>
                  onChange({ ...filters, statusEffects: val })
                }
                placeholder="Filter by status effect..."
                renderOption={({ option }) => {
                  const iconSrc = getStatusEffectIcon(option.label);
                  return (
                    <Group gap="xs" align="center">
                      {iconSrc ? (
                        <Image
                          src={iconSrc}
                          alt=""
                          w={18}
                          h={18}
                          fit="contain"
                        />
                      ) : null}
                      <Text size="sm">{option.label}</Text>
                    </Group>
                  );
                }}
                searchable={effectOptions.length >= 10}
                clearable
                size={chipSize}
                style={{ flex: 1, minWidth: 180 }}
                comboboxProps={{ withinPortal: !isMobile }}
              />
            </FilterSection>
          )}
          <FilterSection label="Owned Characters">
            <FilterChipGroup
              size={chipSize}
              value={filters.ownedOnly ? ['owned'] : []}
              onChange={(val) =>
                onChange({ ...filters, ownedOnly: val.includes('owned') })
              }
              options={[{ value: 'owned', label: 'Owned only' }]}
            />
            {starLevelOptions.length > 0 && (
              <SimpleGrid cols={2} spacing="xs">
                <Select
                  label="Min Star Level"
                  placeholder="Any"
                  size={chipSize}
                  data={starLevelOptions}
                  value={filters.minStarLevel}
                  onChange={(val) =>
                    onChange({ ...filters, minStarLevel: val })
                  }
                  clearable
                  comboboxProps={{ withinPortal: !isMobile }}
                />
                <Select
                  label="Max Star Level"
                  placeholder="Any"
                  size={chipSize}
                  data={starLevelOptions}
                  value={filters.maxStarLevel}
                  onChange={(val) =>
                    onChange({ ...filters, maxStarLevel: val })
                  }
                  clearable
                  comboboxProps={{ withinPortal: !isMobile }}
                />
              </SimpleGrid>
            )}
          </FilterSection>
        </>
      }
    />
  );
}
