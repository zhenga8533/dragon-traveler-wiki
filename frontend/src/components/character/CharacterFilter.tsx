import { Group, Image, Stack, Text } from '@mantine/core';
import { CLASS_ICON_MAP } from '../../assets/class';
import { FACTION_ICON_MAP } from '../../assets/faction';
import { QUALITY_ICON_MAP } from '../../assets/quality';
import { getStatusEffectIcon } from '../../assets/status_effect';
import {
  CLASS_ORDER,
  FACTION_NAMES,
  QUALITY_ORDER,
} from '../../constants/colors';
import { IMAGE_SIZE } from '../../constants/ui';
import { useIsMobile } from '../../hooks';
import type { CharacterClass } from '../../types/character';
import type { FactionName } from '../../types/faction';
import type { Quality } from '../../types/quality';
import type { CharacterFilters } from '../../utils/filter-characters';
import { EMPTY_FILTERS } from '../../utils/filter-characters';
import {
  FilterChipGroup,
  FilterClearButton,
  FilterMultiSelect,
  FilterSearchInput,
  FilterSection,
  type FilterChipOption,
} from '../common/FilterControls';

const QUALITIES: Quality[] = [...QUALITY_ORDER];

export interface CharacterFilterProps {
  filters: CharacterFilters;
  onChange: (filters: CharacterFilters) => void;
  effectOptions: string[];
  showTierFilter?: boolean;
  tierOptions?: string[];
}

export default function CharacterFilter({
  filters,
  onChange,
  effectOptions,
  showTierFilter = false,
  tierOptions = [],
}: CharacterFilterProps) {
  const isMobile = useIsMobile();
  const chipSize = isMobile ? 'md' : 'xs';
  const hasFilters =
    filters.search !== '' ||
    filters.qualities.length > 0 ||
    filters.classes.length > 0 ||
    filters.factions.length > 0 ||
    (showTierFilter && filters.tiers.length > 0) ||
    filters.statusEffects.length > 0 ||
    filters.globalOnly !== null;

  return (
    <Stack gap={8}>
      <Group gap="xs" align="center" wrap="wrap">
        <FilterSearchInput
          placeholder="Search by name..."
          value={filters.search}
          onChange={(e) =>
            onChange({ ...filters, search: e.currentTarget.value })
          }
          size={isMobile ? 'md' : 'xs'}
          style={{ flex: 1, minWidth: 180 }}
        />
        {hasFilters && (
          <FilterClearButton
            size={isMobile ? 'md' : 'compact-xs'}
            onClick={() => onChange(EMPTY_FILTERS)}
          />
        )}
      </Group>

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

      <FilterSection label="Quality">
        <FilterChipGroup
          size={chipSize}
          value={filters.qualities}
          onChange={(val) =>
            onChange({ ...filters, qualities: val as Quality[] })
          }
          options={QUALITIES.map(
            (q): FilterChipOption => ({
              value: q,
              label: (
                <Group gap={4} wrap="nowrap" align="center">
                  <Image
                    src={QUALITY_ICON_MAP[q]}
                    alt={q}
                    w={IMAGE_SIZE.ICON_SM}
                    h={IMAGE_SIZE.ICON_SM}
                    fit="contain"
                  />
                  <span>{q}</span>
                </Group>
              ),
            })
          )}
        />
      </FilterSection>

      <FilterSection label="Class">
        <FilterChipGroup
          size={chipSize}
          value={filters.classes}
          onChange={(val) =>
            onChange({ ...filters, classes: val as CharacterClass[] })
          }
          options={CLASS_ORDER.map(
            (c): FilterChipOption => ({
              value: c,
              label: (
                <Group gap={4} wrap="nowrap" align="center">
                  <Image
                    src={CLASS_ICON_MAP[c]}
                    alt={c}
                    w={IMAGE_SIZE.ICON_SM}
                    h={IMAGE_SIZE.ICON_SM}
                    fit="contain"
                  />
                  <span>{c}</span>
                </Group>
              ),
            })
          )}
        />
      </FilterSection>

      <FilterSection label="Faction">
        <FilterChipGroup
          size={chipSize}
          value={filters.factions}
          onChange={(val) =>
            onChange({ ...filters, factions: val as FactionName[] })
          }
          options={FACTION_NAMES.map(
            (f): FilterChipOption => ({
              value: f,
              label: (
                <Group gap={4} wrap="nowrap" align="center">
                  <Image
                    src={FACTION_ICON_MAP[f]}
                    alt={f}
                    w={IMAGE_SIZE.ICON_SM}
                    h={IMAGE_SIZE.ICON_SM}
                    fit="contain"
                  />
                  <span>{f}</span>
                </Group>
              ),
            })
          )}
        />
      </FilterSection>

      {showTierFilter && (
        <FilterSection label="Tier">
          <FilterChipGroup
            size={chipSize}
            value={filters.tiers}
            onChange={(val) => onChange({ ...filters, tiers: val as string[] })}
            options={tierOptions.map((tier) => ({ value: tier, label: tier }))}
          />
        </FilterSection>
      )}

      {effectOptions.length > 0 && (
        <FilterSection label="Effects">
          <FilterMultiSelect
            data={effectOptions}
            value={filters.statusEffects}
            onChange={(val) => onChange({ ...filters, statusEffects: val })}
            placeholder="Filter by status effect..."
            renderOption={({ option }) => {
              const iconSrc = getStatusEffectIcon(option.label);
              return (
                <Group gap="xs" align="center">
                  {iconSrc ? (
                    <Image src={iconSrc} alt="" w={18} h={18} fit="contain" />
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
    </Stack>
  );
}
