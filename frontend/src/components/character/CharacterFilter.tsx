import {
  Button,
  Chip,
  Group,
  Image,
  MultiSelect,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IoClose, IoSearch } from 'react-icons/io5';
import { FACTION_ICON_MAP } from '../../assets/faction';
import { QUALITY_ICON_MAP } from '../../assets/quality';
import { getStatusEffectIcon } from '../../assets/status_effect';
import {
  CLASS_ORDER,
  FACTION_NAMES,
  QUALITY_ORDER,
} from '../../constants/colors';
import { FLEX_1_MIN_WIDTH_180_STYLE } from '../../constants/styles';
import { IMAGE_SIZE } from '../../constants/ui';
import type { CharacterClass } from '../../types/character';
import type { FactionName } from '../../types/faction';
import type { Quality } from '../../types/quality';
import type { CharacterFilters } from '../../utils/filter-characters';
import { EMPTY_FILTERS } from '../../utils/filter-characters';

const QUALITIES: Quality[] = [...QUALITY_ORDER];

const LABEL_STYLE = { minWidth: 60 } as const;

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
        <TextInput
          placeholder="Search by name..."
          leftSection={<IoSearch size={IMAGE_SIZE.ICON_MD} />}
          value={filters.search}
          onChange={(e) =>
            onChange({ ...filters, search: e.currentTarget.value })
          }
          size="xs"
          style={FLEX_1_MIN_WIDTH_180_STYLE}
        />
        {hasFilters && (
          <Button
            variant="subtle"
            color="gray"
            size="compact-xs"
            leftSection={<IoClose size={IMAGE_SIZE.ICON_SM} />}
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            Clear
          </Button>
        )}
      </Group>

      <Group gap="xs" align="center" wrap="wrap">
        <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={LABEL_STYLE}>
          Server
        </Text>
        <Chip.Group
          multiple
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
        >
          <Group gap={4}>
            <Chip value="global" size="xs">
              Global
            </Chip>
            <Chip value="cn" size="xs">
              TW / CN
            </Chip>
          </Group>
        </Chip.Group>
      </Group>

      <Group gap="xs" align="center" wrap="wrap">
        <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={LABEL_STYLE}>
          Quality
        </Text>
        <Chip.Group
          multiple
          value={filters.qualities}
          onChange={(val) =>
            onChange({ ...filters, qualities: val as Quality[] })
          }
        >
          <Group gap={4} wrap="wrap">
            {QUALITIES.map((q) => (
              <Chip key={q} value={q} size="xs">
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
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Group>

      <Group gap="xs" align="center" wrap="wrap">
        <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={LABEL_STYLE}>
          Class
        </Text>
        <Chip.Group
          multiple
          value={filters.classes}
          onChange={(val) =>
            onChange({ ...filters, classes: val as CharacterClass[] })
          }
        >
          <Group gap={4} wrap="wrap">
            {CLASS_ORDER.map((c) => (
              <Chip key={c} value={c} size="xs">
                {c}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Group>

      <Group gap="xs" align="center" wrap="wrap">
        <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={LABEL_STYLE}>
          Faction
        </Text>
        <Chip.Group
          multiple
          value={filters.factions}
          onChange={(val) =>
            onChange({ ...filters, factions: val as FactionName[] })
          }
        >
          <Group gap={4} wrap="wrap">
            {FACTION_NAMES.map((f) => (
              <Chip key={f} value={f} size="xs">
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
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Group>

      {showTierFilter && (
        <Group gap="xs" align="center" wrap="wrap">
          <Text
            size="xs"
            fw={600}
            tt="uppercase"
            c="dimmed"
            style={LABEL_STYLE}
          >
            Tier
          </Text>
          <Chip.Group
            multiple
            value={filters.tiers}
            onChange={(val) => onChange({ ...filters, tiers: val as string[] })}
          >
            <Group gap={4} wrap="wrap">
              {tierOptions.map((tier) => (
                <Chip key={tier} value={tier} size="xs">
                  {tier}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Group>
      )}

      {effectOptions.length > 0 && (
        <Group gap="xs" align="center" wrap="wrap">
          <Text
            size="xs"
            fw={600}
            tt="uppercase"
            c="dimmed"
            style={LABEL_STYLE}
          >
            Effects
          </Text>
          <MultiSelect
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
            size="xs"
            style={FLEX_1_MIN_WIDTH_180_STYLE}
          />
        </Group>
      )}
    </Stack>
  );
}
