import { ActionIcon, Affix, Transition } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { IoArrowUp } from 'react-icons/io5';

export default function ScrollToTop() {
  const [scroll, scrollTo] = useWindowScroll();

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
