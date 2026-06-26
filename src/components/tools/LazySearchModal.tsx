import { IMAGE_SIZE } from '@/constants/ui';
import { useGradientAccent, useIsMobile, useMobileTooltip } from '@/hooks';
import {
  ActionIcon,
  Kbd,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { lazy, Suspense, useEffect, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { OPEN_GLOBAL_SEARCH_EVENT } from '@/utils/global-search-events';

const SearchModal = lazy(() => import('./SearchModal'));
export { OPEN_GLOBAL_SEARCH_EVENT } from '@/utils/global-search-events';

function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const { accent } = useGradientAccent();
  const isMobile = useIsMobile();
  const mobileTooltip = useMobileTooltip();
  const label = 'Search (/)';

  if (isMobile) {
    return (
      <Tooltip label={label} {...mobileTooltip} position="bottom">
        <ActionIcon
          variant="default"
          color={accent.primary}
          size="xl"
          onClick={onOpen}
          aria-label={label}
          aria-haspopup="dialog"
        >
          <IoSearch size={IMAGE_SIZE.ICON_LG} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <UnstyledButton
      onClick={onOpen}
      aria-label={label}
      aria-haspopup="dialog"
      className="search-pill-trigger"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 10px 5px 12px',
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--mantine-color-default-border)',
        background: 'var(--mantine-color-default)',
        color: 'var(--mantine-color-dimmed)',
        minWidth: 150,
      }}
    >
      <IoSearch
        size={IMAGE_SIZE.ICON_MD}
        color={`var(--mantine-color-${accent.primary}-6)`}
      />
      <Text size="sm" c="dimmed" style={{ flex: 1, userSelect: 'none' }}>
        Search...
      </Text>
      <Kbd size="xs">/</Kbd>
    </UnstyledButton>
  );
}

export default function LazySearchModal() {
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    const requestSearch = () => setRequested(true);
    window.addEventListener(OPEN_GLOBAL_SEARCH_EVENT, requestSearch);
    return () => window.removeEventListener(OPEN_GLOBAL_SEARCH_EVENT, requestSearch);
  }, []);
  useHotkeys([
    [
      '/',
      (event) => {
        event.preventDefault();
        setRequested(true);
      },
    ],
  ]);

  if (!requested) {
    return <SearchTrigger onOpen={() => setRequested(true)} />;
  }

  return (
    <Suspense fallback={<SearchTrigger onOpen={() => undefined} />}>
      <SearchModal initiallyOpened />
    </Suspense>
  );
}
