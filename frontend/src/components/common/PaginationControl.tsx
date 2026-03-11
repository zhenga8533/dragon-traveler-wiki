import { Group, Paper, Select, Stack, Text } from '@mantine/core';
import { useIsMobile } from '../../hooks';

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Scroll the page to the top after changing page. Default: false. */
  scrollToTop?: boolean;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
}

export default function PaginationControl({
  currentPage,
  totalPages,
  onChange,
  scrollToTop = false,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationControlProps) {
  const isMobile = useIsMobile();
  const hasPagination = totalPages > 1;
  const hasPageSizeSelector =
    pageSize !== undefined &&
    pageSizeOptions !== undefined &&
    pageSizeOptions.length > 1 &&
    onPageSizeChange !== undefined;
  const rangeStart =
    totalItems && totalItems > 0 && pageSize
      ? (currentPage - 1) * pageSize + 1
      : 0;
  const rangeEnd =
    totalItems && totalItems > 0 && pageSize
      ? Math.min(totalItems, currentPage * pageSize)
      : 0;
  const pageSizeData = (pageSizeOptions ?? []).map((option) => ({
    value: String(option),
    label: `${option} / page`,
  }));
  const pageNumberData = Array.from({ length: totalPages }, (_, index) => {
    const pageNumber = index + 1;

    return {
      value: String(pageNumber),
      label: `Page ${pageNumber}`,
    };
  });
  const summaryValue =
    totalItems !== undefined && pageSize !== undefined
      ? `${rangeStart}-${rangeEnd} of ${totalItems}`
      : `${currentPage} of ${totalPages}`;
  const summaryLabel =
    totalItems !== undefined && pageSize !== undefined
      ? `Showing items · page ${currentPage} of ${totalPages}`
      : hasPagination
        ? 'Current page'
        : undefined;

  if (!hasPagination && !hasPageSizeSelector) return null;

  function handleChange(page: number) {
    if (page === currentPage) {
      return;
    }

    onChange(page);
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <nav aria-label="Pagination navigation">
      <Stack gap="xs">
        <Paper
          withBorder
          radius="xl"
          p={isMobile ? 'sm' : 'md'}
          bg="var(--mantine-color-body)"
          style={{ boxShadow: 'var(--mantine-shadow-xs)' }}
        >
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
            <Group
              justify="space-between"
              align="flex-end"
              wrap="wrap"
              gap="sm"
              style={{ flex: 1 }}
            >
              <Stack gap={2}>
                {summaryLabel && (
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                    {summaryLabel}
                  </Text>
                )}
                <Text size="sm" fw={600}>
                  {summaryValue}
                </Text>
              </Stack>

              <Group gap="sm" align="flex-end" wrap="wrap">
                {hasPagination && (
                  <Stack gap={4} align={isMobile ? 'stretch' : 'flex-end'}>
                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                      Page
                    </Text>
                    <Select
                      aria-label="Page number"
                      value={String(currentPage)}
                      data={pageNumberData}
                      onChange={(value) => {
                        if (!value) {
                          return;
                        }

                        handleChange(Number(value));
                      }}
                      allowDeselect={false}
                      size="sm"
                      radius="xl"
                      searchable={totalPages > 12}
                      w={isMobile ? '100%' : 136}
                      comboboxProps={{ position: 'bottom-end' }}
                      styles={{
                        input: {
                          fontWeight: 600,
                        },
                      }}
                    />
                  </Stack>
                )}

                {hasPageSizeSelector && (
                  <Stack gap={4} align={isMobile ? 'stretch' : 'flex-end'}>
                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                      Items per page
                    </Text>
                    <Select
                      aria-label="Items per page"
                      value={pageSize === undefined ? null : String(pageSize)}
                      data={pageSizeData}
                      onChange={(value) => {
                        if (!value || !onPageSizeChange) {
                          return;
                        }

                        onPageSizeChange(Number(value));
                      }}
                      allowDeselect={false}
                      size="sm"
                      radius="xl"
                      w={isMobile ? '100%' : 132}
                      comboboxProps={{ position: 'bottom-end' }}
                      styles={{
                        input: {
                          fontWeight: 600,
                        },
                      }}
                    />
                  </Stack>
                )}
              </Group>
            </Group>
          </Group>
        </Paper>
      </Stack>
    </nav>
  );
}
