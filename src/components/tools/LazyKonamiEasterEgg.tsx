import { lazy, Suspense, useEffect, useState } from 'react';

const KonamiEasterEgg = lazy(() => import('./KonamiEasterEgg'));

export default function LazyKonamiEasterEgg() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setEnabled(true), 1500);
    return () => window.clearTimeout(timeout);
  }, []);

  return enabled ? (
    <Suspense fallback={null}>
      <KonamiEasterEgg />
    </Suspense>
  ) : null;
}
