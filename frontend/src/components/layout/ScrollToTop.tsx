import { ActionIcon, Affix, Transition } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { useEffect } from 'react';
import { IoArrowUp } from 'react-icons/io5';
import { useLocation, useNavigationType } from 'react-router-dom';

const SCROLL_KEY = 'scroll-pos-';

// Disable browser's native scroll restoration so we can manage it ourselves
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

export default function ScrollToTop() {
  const [scroll, scrollTo] = useWindowScroll();
  const location = useLocation();
  const navigationType = useNavigationType();

  // Continuously save scroll position for the current history entry
  useEffect(() => {
    const key = location.key;
    const save = () => {
      sessionStorage.setItem(`${SCROLL_KEY}${key}`, String(window.scrollY));
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [location.key]);

  // Restore or reset scroll on navigation
  useEffect(() => {
    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem(`${SCROLL_KEY}${location.key}`);
      const y = saved ? parseInt(saved, 10) : 0;
      const id = setTimeout(() => {
        window.scrollTo({ top: y, behavior: 'instant' });
      }, 0);
      return () => clearTimeout(id);
    }

    const id = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, 0);
    return () => clearTimeout(id);
  }, [location.key, navigationType]);

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
