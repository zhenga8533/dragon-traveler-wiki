import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import PaginationControl from '@/components/ui/PaginationControl';
import { Paper, Stack, TextInput } from '@mantine/core';
import type { ReactNode } from 'react';
import { IoSearch } from 'react-icons/io5';

interface SearchableGridPanelProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  hasResults: boolean;
  noResultsTitle: string;
  noResultsMessage: string;
  onResetSearch: () => void;
  resetLabel?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (size: number) => void;
  children: ReactNode;
}

export default function SearchableGridPanel({
  search,
  onSearchChange,
  searchPlaceholder,
  hasResults,
  noResultsTitle,
  noResultsMessage,
  onResetSearch,
  resetLabel = 'Clear search',
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  children,
}: SearchableGridPanelProps) {
  return (
    <Paper p="md" radius="md" withBorder data-no-hover>
      <Stack gap="md">
        <TextInput
          placeholder={searchPlaceholder}
          leftSection={<IoSearch size={14} />}
          value={search}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
        />

        {hasResults ? (
          children
        ) : (
          <NoResultsSuggestions
            title={noResultsTitle}
            message={noResultsMessage}
            onReset={onResetSearch}
            resetLabel={resetLabel}
          />
        )}

        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={onPageChange}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={onPageSizeChange}
        />
      </Stack>
    </Paper>
  );
}
