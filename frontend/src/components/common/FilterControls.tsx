import {
  Button,
  Chip,
  Group,
  MultiSelect,
  Text,
  TextInput,
  type MultiSelectProps,
  type TextInputProps,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { IoClose, IoSearch } from 'react-icons/io5';
import { IMAGE_SIZE } from '../../constants/ui';
import { useFilterTheme } from '../../hooks/use-filter-theme';

export interface FilterSearchInputProps extends TextInputProps {
  iconSize?: number;
}

export function FilterSearchInput({
  iconSize = IMAGE_SIZE.ICON_MD,
  color,
  leftSection,
  ...props
}: FilterSearchInputProps) {
  const { accent, searchIconColor } = useFilterTheme();

  return (
    <TextInput
      color={color ?? accent.primary}
      leftSection={
        leftSection ?? <IoSearch size={iconSize} color={searchIconColor} />
      }
      {...props}
    />
  );
}

export function FilterMultiSelect({ color, ...props }: MultiSelectProps) {
  const { accent } = useFilterTheme();

  return <MultiSelect color={color ?? accent.primary} {...props} />;
}

export interface FilterClearButtonProps {
  onClick: () => void;
  size?: 'compact-xs' | 'xs' | 'sm' | 'md';
  label?: string;
}

export function FilterClearButton({
  onClick,
  size = 'compact-xs',
  label = 'Clear',
}: FilterClearButtonProps) {
  const { accent } = useFilterTheme();

  return (
    <Button
      variant="subtle"
      color={accent.primary}
      size={size}
      leftSection={<IoClose size={IMAGE_SIZE.ICON_SM} />}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export interface FilterSectionProps {
  label: string;
  children: ReactNode;
}

export function FilterSection({ label, children }: FilterSectionProps) {
  return (
    <Group gap="xs" align="center" wrap="wrap">
      <Text
        size="xs"
        fw={600}
        tt="uppercase"
        c="dimmed"
        style={{ minWidth: 60 }}
      >
        {label}
      </Text>
      {children}
    </Group>
  );
}

export interface FilterChipOption {
  value: string;
  label: ReactNode;
}

export interface FilterChipGroupProps {
  value: string[];
  onChange: (values: string[]) => void;
  options: FilterChipOption[];
  size?: 'xs' | 'md';
}

export function FilterChipGroup({
  value,
  onChange,
  options,
  size = 'xs',
}: FilterChipGroupProps) {
  const { accent } = useFilterTheme();

  return (
    <Chip.Group multiple value={value} onChange={onChange}>
      <Group gap={4} wrap="wrap">
        {options.map((option) => (
          <Chip
            key={option.value}
            value={option.value}
            size={size}
            color={accent.primary}
          >
            {option.label}
          </Chip>
        ))}
      </Group>
    </Chip.Group>
  );
}
