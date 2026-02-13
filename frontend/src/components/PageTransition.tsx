import { Box } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { TRANSITION } from '../constants/ui';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const nodeRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (reduceMotion) {
      return;
    }

    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      const el = nodeRef.current;
      if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      }
    }
  }, [location.pathname, reduceMotion]);

  return (
    <Box
      ref={nodeRef}
      style={{
        transition: reduceMotion
          ? 'none'
          : `opacity ${TRANSITION.FAST} ${TRANSITION.EASE}, transform ${TRANSITION.FAST} ${TRANSITION.EASE}`,
      }}
    >
      {children}
    </Box>
  );
}
