import { Button, Group, Pagination, Stack, TextInput } from '@mantine/core';
import { useState } from 'react';
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
  const [jumpValue, setJumpValue] = useState('');

  if (totalPages <= 1) return null;

  function handleChange(page: number) {
    onChange(page);
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleJumpSubmit() {
    const parsed = Number.parseInt(jumpValue, 10);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(Math.max(1, parsed), totalPages);
    setJumpValue(String(clamped));
    handleChange(clamped);
  }

  const showJumpControl = totalPages >= 15;

  return (
    <Stack mt="md" gap="xs" align="center">
      <Pagination
        value={currentPage}
        onChange={handleChange}
        total={totalPages}
        size={isMobile ? 'md' : 'sm'}
        siblings={isMobile ? 1 : 1}
        boundaries={isMobile ? 1 : 2}
        withEdges={totalPages > 5}
      />

      {showJumpControl && (
        <Group gap="xs" align="center" wrap="nowrap">
          <TextInput
            aria-label="Jump to page"
            placeholder={`1-${totalPages}`}
            value={jumpValue}
            onChange={(event) => {
              const digitsOnly = event.currentTarget.value.replace(/\D+/g, '');
              setJumpValue(digitsOnly);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleJumpSubmit();
              }
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            w={isMobile ? 96 : 112}
            size={isMobile ? 'sm' : 'xs'}
          />
          <Button
            variant="default"
            size={isMobile ? 'sm' : 'xs'}
            onClick={handleJumpSubmit}
          >
            Go
          </Button>
        </Group>
      )}
    </Stack>
  );
}
