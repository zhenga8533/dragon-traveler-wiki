import { IMAGE_SIZE } from '@/constants/ui';
import { useGradientAccent, useMobileTooltip } from '@/hooks';
import { ActionIcon, Tooltip } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { lazy, Suspense, useEffect, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { OPEN_GLOBAL_SEARCH_EVENT } from '@/utils/global-search-events';

const SearchModal = lazy(() => import('./SearchModal'));
export { OPEN_GLOBAL_SEARCH_EVENT } from '@/utils/global-search-events';

function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const { accent } = useGradientAccent();
  const mobileTooltip = useMobileTooltip();
  const label = 'Search (/)';

  return (
    <Tooltip label={label} {...mobileTooltip} position="bottom">
      <ActionIcon
        variant="default"
        color={accent.primary}
        size="lg"
        onClick={onOpen}
        aria-label={label}
        aria-haspopup="dialog"
      >
        <IoSearch size={IMAGE_SIZE.ICON_LG} />
      </ActionIcon>
    </Tooltip>
  );
}

export default function LazySearchModal() {
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    const requestSearch = () => setRequested(true);
    window.addEventListener(OPEN_GLOBAL_SEARCH_EVENT, requestSearch);
    return () =>
      window.removeEventListener(OPEN_GLOBAL_SEARCH_EVENT, requestSearch);
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
