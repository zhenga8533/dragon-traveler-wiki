import { Box, Group, NumberInput, Pagination, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { BREAKPOINTS } from '../../constants/ui';
import { useIsMobile } from '../../hooks';

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Scroll the page to the top after changing page. Default: false. */
  scrollToTop?: boolean;
}

export default function PaginationControl({
  currentPage,
  totalPages,
  onChange,
  scrollToTop = false,
}: PaginationControlProps) {
  const isMobile = useIsMobile();
  const isCompactPagination = useMediaQuery(BREAKPOINTS.COMPACT) ?? false;
  const [jumpValue, setJumpValue] = useState<string | number>(currentPage);
  const hasManyPages = totalPages > 12;
  const maxPageDigits = String(totalPages).length;
  const controlSize = isMobile ? 32 : 36;
  const inputHeight = isMobile ? 28 : 30;

  useEffect(() => {
    setJumpValue(currentPage);
  }, [currentPage]);

  if (totalPages <= 1) return null;

  function handleChange(page: number) {
    if (page === currentPage) {
      return;
    }

    onChange(page);
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function clampPage(value: string | number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return null;
    }

    return Math.min(Math.max(1, Math.round(parsed)), totalPages);
  }

  function handleJumpSubmit() {
    const clamped = clampPage(jumpValue);

    if (clamped === null) {
      return;
    }

    setJumpValue(clamped);
    handleChange(clamped);
  }

  const siblings = isCompactPagination
    ? 0
    : isMobile
      ? 1
      : hasManyPages
        ? 1
        : 2;
  const boundaries = isCompactPagination
    ? 0
    : isMobile
      ? 0
      : hasManyPages
        ? 1
        : 2;
  const paginationSize = isMobile ? 'xs' : 'sm';
  const withEdges = !isMobile && totalPages > 5;
  const pageInputWidth = Math.min(
    isMobile ? 56 : 64,
    Math.max(34, maxPageDigits * 10)
  );

  return (
    <nav aria-label="Pagination navigation">
      <Stack gap="xs" align="center">
        <Box
          style={{
            overflowX: 'auto',
            maxWidth: '100%',
            scrollbarWidth: 'none',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Pagination
            value={currentPage}
            onChange={handleChange}
            total={totalPages}
            size={paginationSize}
            siblings={siblings}
            boundaries={boundaries}
            withEdges={withEdges}
            styles={{
              root: {
                flexWrap: 'nowrap',
              },
              control: {
                flexShrink: 0,
                borderRadius: 999,
                borderColor: 'var(--mantine-color-default-border)',
                minWidth: controlSize,
                height: controlSize,
              },
              dots: {
                flexShrink: 0,
                minWidth: controlSize,
              },
            }}
          />
        </Box>

        {hasManyPages && (
          <Group gap="xs" align="center" justify="center" wrap="nowrap">
            <Text size="xs" c="dimmed">
              Page
            </Text>
            <NumberInput
              aria-label="Current page"
              value={jumpValue}
              onChange={setJumpValue}
              onBlur={handleJumpSubmit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleJumpSubmit();
                }
              }}
              min={1}
              max={totalPages}
              allowDecimal={false}
              allowNegative={false}
              clampBehavior="blur"
              hideControls
              size="xs"
              radius="xl"
              w={pageInputWidth}
              styles={{
                input: {
                  textAlign: 'center',
                  fontWeight: 600,
                  height: inputHeight,
                  minHeight: inputHeight,
                  paddingInline: 6,
                },
              }}
            />
            <Text size="xs" c="dimmed">
              of {totalPages}
            </Text>
          </Group>
        )}
      </Stack>
    </nav>
  );
}
