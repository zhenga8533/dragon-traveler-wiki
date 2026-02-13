import { useReducedMotion } from '@mantine/hooks';
import { useEffect, useRef, useState } from 'react';
import { TRANSITION } from '../constants/ui';

type ScrollRevealOptions = {
  staggerIndex?: number;
  threshold?: number;
  distance?: number;
  durationMs?: number;
};

export function useScrollReveal({
  staggerIndex = 0,
  threshold = 0.1,
  distance = 20,
  durationMs = 400,
}: ScrollRevealOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion, threshold]);

  const delay = staggerIndex * 100;

  const style: React.CSSProperties = reduceMotion
    ? { opacity: 1, transform: 'none' }
    : {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : `translateY(${distance}px)`,
        transition: `opacity ${durationMs}ms ${TRANSITION.EASE} ${delay}ms, transform ${durationMs}ms ${TRANSITION.EASE} ${delay}ms`,
      };

  return { ref, style };
}
