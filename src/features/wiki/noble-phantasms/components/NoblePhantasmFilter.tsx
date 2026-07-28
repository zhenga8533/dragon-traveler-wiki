import EntityFilter from '@/components/common/EntityFilter';
import { createQualityFilterGroup } from '@/components/common/EntityFilterGroups';
import {
  FilterChipGroup,
  FilterSection,
} from '@/components/common/FilterControls';
import {
  EMPTY_NOBLE_PHANTASM_FILTERS,
  type NoblePhantasmFilters,
} from '@/features/wiki/noble-phantasms/utils/filter-noble-phantasms';
import { useIsMobile } from '@/hooks';

interface NoblePhantasmFilterProps {
  filters: NoblePhantasmFilters;
  onChange: (filters: NoblePhantasmFilters) => void;
}

export default function NoblePhantasmFilter({
  filters,
  onChange,
}: NoblePhantasmFilterProps) {
  const isMobile = useIsMobile();

  return (
    <EntityFilter
      groups={[createQualityFilterGroup()]}
      selected={{ qualities: filters.qualities }}
      onChange={(key, values) => {
        if (key === 'qualities') {
          onChange({
            ...filters,
            qualities: values as NoblePhantasmFilters['qualities'],
          });
        }
      }}
      onClear={() => onChange(EMPTY_NOBLE_PHANTASM_FILTERS)}
      search={filters.search}
      onSearchChange={(search) => onChange({ ...filters, search })}
      searchPlaceholder="Search by name or character..."
      beforeGroups={
        <FilterSection label="Linked Character">
          <FilterChipGroup
            size={isMobile ? 'md' : 'xs'}
            value={filters.characterLinks}
            onChange={(values) =>
              onChange({
                ...filters,
                characterLinks:
                  values.length === 0
                    ? []
                    : [values[values.length - 1] as 'valid' | 'invalid'],
              })
            }
            options={[
              { value: 'valid', label: 'Yes' },
              { value: 'invalid', label: 'No' },
            ]}
          />
        </FilterSection>
      }
    />
  );
}
