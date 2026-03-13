import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classes from '@/styles/sandstorm.module.css';

interface Props {
  active: boolean;
}

const TEXT = 'Shurima, your emperor has returned!';

// Randomised once at module load so values differ on every page visit
const PARTICLES = Array.from({ length: 110 }, () => ({
  top: Math.random() * 100,
  size: Math.random() * 18 + 3,
  opacity: Math.random() * 0.55 + 0.3,
  duration: Math.random() * 5 + 1.5,
  delay: Math.random() * 6,
  drift: (Math.random() - 0.5) * 180,
  alt: Math.random() > 0.6,
}));

const STREAKS = Array.from({ length: 35 }, () => ({
  top: Math.random() * 100,
  width: Math.random() * 200 + 50,
  height: Math.random() * 2.5 + 0.8,
  opacity: Math.random() * 0.4 + 0.12,
  duration: Math.random() * 3 + 1,
  delay: Math.random() * 6,
  drift: (Math.random() - 0.5) * 90,
}));

interface LetterProp {
  char: string;
  delay: number;
  top: number;
  drift: number;
  rot: number;
  speed: number;
  opacity: number;
}

function makeLetterProps(): LetterProp[] {
  const props: LetterProp[] = [];
  let delay = 0;

  const words = TEXT.split(' ');

  // Each word gets a distinct vertical lane (28–68 %) with a small random nudge
  const wordTops = words.map((_, wi) => {
    const base = 28 + (wi / Math.max(words.length - 1, 1)) * 40;
    return base + (Math.random() - 0.5) * 8;
  });

  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi];
    const laneTop = wordTops[wi];
    // Shared crossing speed per word keeps letters in formation
    const wordSpeed = Math.random() * 1.2 + 5.5;

    const chars = Array.from(word).map((char) => ({
      char,
      top: laneTop + (Math.random() - 0.5) * 6,
      drift: (Math.random() - 0.5) * 14,
      rot: (Math.random() - 0.5) * 10,
      speed: wordSpeed + (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.25 + 0.75,
    }));

    // Delays assigned in reverse so the last letter emerges from the left first
    for (let ci = chars.length - 1; ci >= 0; ci--) {
      props.push({ ...chars[ci], delay });
      delay += 110;
    }

    if (wi < words.length - 1) {
      delay += 500; // wide gap so consecutive words don't overlap on screen
    }
  }

  return props;
}

export default function SandstormOverlay({ active }: Props) {
  const [mounted, setMounted] = useState(false);
  // Bumped on every activation; used as key to remount content and restart animations
  const [activationId, setActivationId] = useState(0);
  const unmountTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (active) {
      clearTimeout(unmountTimer.current);
      setMounted(true);
      setActivationId((id) => id + 1);
    } else {
      unmountTimer.current = setTimeout(() => setMounted(false), 800);
    }
    return () => clearTimeout(unmountTimer.current);
  }, [active]);

  // Regenerated on every activation for fresh randomness
  const letterProps = useMemo(() => makeLetterProps(), [activationId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className={`${classes.overlay} ${!active ? classes.fadeOut : ''}`}>
      {/* key remounts all content on each activation, restarting every animation */}
      <div key={activationId} className={classes.content}>
        <div className={classes.dimLayer} />
        <div className={classes.sandLayer} />

        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className={`${classes.particle} ${p.alt ? classes.alt : ''}`}
            style={
              {
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                '--p-opacity': p.opacity,
                '--p-dur': `${p.duration}s`,
                '--p-delay': `${p.delay}s`,
                '--p-drift': `${p.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}

        {STREAKS.map((s, i) => (
          <span
            key={i}
            className={classes.streak}
            style={
              {
                top: `${s.top}%`,
                width: s.width,
                height: s.height,
                '--p-opacity': s.opacity,
                '--p-dur': `${s.duration}s`,
                '--p-delay': `${s.delay}s`,
                '--p-drift': `${s.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}

        {letterProps.map((lp, i) => (
          <span
            key={i}
            className={classes.letter}
            style={
              {
                top: `${lp.top}%`,
                '--l-delay': `${lp.delay}ms`,
                '--l-drift': `${lp.drift}px`,
                '--l-rot': lp.rot,
                '--l-dur': `${lp.speed}s`,
                '--l-opacity': lp.opacity,
              } as React.CSSProperties
            }
          >
            {lp.char}
          </span>
        ))}
      </div>
    </div>,
    document.body
  );
}
