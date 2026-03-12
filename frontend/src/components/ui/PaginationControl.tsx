import { useIsMobile } from '@/hooks';
import { ActionIcon, Group, Paper, Select, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function LabelText({ children }: { children: ReactNode }) {
  return (
    <Text size="xs" c="dimmed" fw={600} tt="uppercase">
      {children}
    </Text>
  );
}

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
  const hasItems = totalItems === undefined ? totalPages > 0 : totalItems > 0;
  const hasPagination = totalPages > 1;
  const hasPageSizeSelector =
    hasItems &&
    pageSize !== undefined &&
    pageSizeOptions !== undefined &&
    pageSizeOptions.length > 1 &&
    onPageSizeChange !== undefined;
  const hasItemsCount =
    totalItems !== undefined && totalItems > 0 && pageSize !== undefined;
  const rangeStart = hasItemsCount ? (currentPage - 1) * pageSize + 1 : 0;
  const rangeEnd = hasItemsCount
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

  const hasItemsData = totalItems !== undefined && pageSize !== undefined;
  const summaryValue = hasItemsData
    ? `${rangeStart}-${rangeEnd} of ${totalItems}`
    : `${currentPage} of ${totalPages}`;
  const summaryLabel = hasItemsData
    ? `Showing items · page ${currentPage} of ${totalPages}`
    : hasPagination
      ? 'Current page'
      : undefined;

  if (!hasItems || (!hasPagination && !hasPageSizeSelector)) return null;

  const commonSelectProps = {
    allowDeselect: false,
    size: 'sm' as const,
    radius: 'xl',
    comboboxProps: { position: 'bottom-end' as const },
    styles: { input: { fontWeight: 600 } },
  };

  const commonActionIconProps = {
    variant: 'subtle',
    color: 'gray',
    size: 'md',
    radius: 'xl',
  } as const;

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
          <Group
            justify={isMobile ? 'center' : 'space-between'}
            align={isMobile ? 'center' : 'flex-end'}
            wrap="wrap"
            gap="sm"
          >
            <Stack
              gap={2}
              align={isMobile ? 'center' : 'flex-start'}
              style={{ flexShrink: 0 }}
            >
              {summaryLabel && <LabelText>{summaryLabel}</LabelText>}
              <Text size="sm" fw={600}>
                {summaryValue}
              </Text>
            </Stack>

            <Group
              gap="sm"
              align={isMobile ? 'center' : 'flex-end'}
              justify={isMobile ? 'center' : 'flex-end'}
              wrap="wrap"
              style={{ flexGrow: 1 }}
            >
              {hasPagination && (
                <Group
                  gap="xs"
                  wrap="nowrap"
                  align={isMobile ? 'center' : 'flex-end'}
                >
                  <ActionIcon
                    {...commonActionIconProps}
                    onClick={() => handleChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                  >
                    <FaChevronLeft size={14} />
                  </ActionIcon>

                  <Stack
                    gap={4}
                    align={isMobile ? 'center' : 'flex-end'}
                    style={{ flex: isMobile ? 1 : undefined }}
                  >
                    <LabelText>Page</LabelText>
                    <Select
                      {...commonSelectProps}
                      aria-label="Page number"
                      value={String(currentPage)}
                      data={pageNumberData}
                      onChange={(value) => {
                        if (!value) {
                          return;
                        }

                        handleChange(Number(value));
                      }}
                      searchable={totalPages > 12}
                      w={isMobile ? '100%' : 136}
                    />
                  </Stack>

                  <ActionIcon
                    {...commonActionIconProps}
                    onClick={() => handleChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    aria-label="Next page"
                  >
                    <FaChevronRight size={14} />
                  </ActionIcon>
                </Group>
              )}

              {hasPageSizeSelector && (
                <Stack gap={4} align={isMobile ? 'center' : 'flex-end'}>
                  <LabelText>Items per page</LabelText>
                  <Select
                    {...commonSelectProps}
                    aria-label="Items per page"
                    value={pageSize === undefined ? null : String(pageSize)}
                    data={pageSizeData}
                    onChange={(value) => {
                      if (!value || !onPageSizeChange) {
                        return;
                      }

                      onPageSizeChange(Number(value));
                    }}
                    w={isMobile ? '100%' : 132}
                  />
                </Stack>
              )}
            </Group>
          </Group>
        </Paper>
      </Stack>
    </nav>
  );
}
