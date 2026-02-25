import { ActionIcon, Affix, Transition } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { useEffect } from 'react';
import { IoArrowUp } from 'react-icons/io5';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const [scroll, scrollTo] = useWindowScroll();
  const location = useLocation();

  useEffect(() => {
    // Scroll to top with a small delay to ensure the page layout has settled
    const scrollTimeout = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, 0);

    return () => clearTimeout(scrollTimeout);
  }, [location.pathname, location.search]);

  return (
    <Affix position={{ bottom: 20, right: 20 }}>
      <Transition transition="slide-up" mounted={scroll.y > 300}>
        {(transitionStyles) => (
          <ActionIcon
            style={transitionStyles}
            size="lg"
            radius="xl"
            variant="filled"
            color="violet"
            onClick={() => scrollTo({ y: 0 })}
            aria-label="Scroll to top"
          >
            <IoArrowUp size={18} />
          </ActionIcon>
        )}
      </Transition>
    </Affix>
  );
}
