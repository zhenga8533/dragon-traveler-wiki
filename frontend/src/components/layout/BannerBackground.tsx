import { getHomeHeroPlaceholderGradient } from '@/constants/styles';
import { TRANSITION } from '@/constants/ui';
import { BannerContext, UiOpacityContext } from '@/contexts';
import { useDarkMode } from '@/hooks';
import { Box } from '@mantine/core';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';

const measuredHeightBySource = new Map<string, number>();
const PARALLAX_RATE = 0.14;

export default function BannerBackground() {
  const isDark = useDarkMode();
  const { selectedBanner, bannerLoaded, setBannerLoaded, slowScrollEnabled } =
    useContext(BannerContext);
  const { bannerMediaOpacity, bannerOverlayOpacity } =
    useContext(UiOpacityContext);
  const selectedBannerSrc = selectedBanner?.src;
  const [measuredMedia, setMeasuredMedia] = useState<{
    src: string;
    height: number;
  } | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slowScrollEnabled) {
      setScrollY(0);
      return;
    }

    if (typeof window === 'undefined') return;

    let frameId = 0;
    const update = () => {
      frameId = 0;
      setScrollY(window.scrollY || window.pageYOffset || 0);
    };
    const handleScroll = () => {
      if (frameId !== 0) return;
      frameId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [slowScrollEnabled]);

  const updateMeasuredHeight = useCallback(
    (height: number) => {
      if (height <= 0) return;
      if (!selectedBannerSrc) return;
      measuredHeightBySource.set(selectedBannerSrc, height);
      setMeasuredMedia({ src: selectedBannerSrc, height });
    },
    [selectedBannerSrc]
  );

  const imgRef = useCallback(
    (el: HTMLImageElement | null) => {
      if (!el) return;
      const update = () => {
        if (el.naturalHeight > 0) updateMeasuredHeight(el.naturalHeight);
      };
      const markLoaded = () => setBannerLoaded(true);
      if (el.complete) {
        update();
        markLoaded();
      }
      el.addEventListener('load', update, { once: true });
      el.addEventListener('load', markLoaded, { once: true });
    },
    [setBannerLoaded, updateMeasuredHeight]
  );

  const videoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (!el) return;
      const update = () => {
        if (el.videoHeight > 0) updateMeasuredHeight(el.videoHeight);
      };
      const markLoaded = () => setBannerLoaded(true);
      if (el.readyState >= 1) update();
      if (el.readyState >= 2) markLoaded();
      el.addEventListener('loadedmetadata', update, { once: true });
      el.addEventListener('loadeddata', markLoaded, { once: true });
    },
    [setBannerLoaded, updateMeasuredHeight]
  );

  const cachedHeight = selectedBannerSrc
    ? measuredHeightBySource.get(selectedBannerSrc)
    : undefined;
  const mediaHeight = selectedBannerSrc
    ? (cachedHeight ??
      (measuredMedia?.src === selectedBannerSrc ? measuredMedia.height : 0))
    : 0;

  const height = mediaHeight > 0 ? mediaHeight : 350;
  const parallaxOffset = scrollY * PARALLAX_RATE;
  const outerStyle = slowScrollEnabled
    ? {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none' as const,
        zIndex: 0,
      }
    : {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        height,
        overflow: 'hidden' as const,
        pointerEvents: 'none' as const,
        zIndex: 0,
      };
  const stageStyle = slowScrollEnabled
    ? {
        position: 'sticky' as const,
        top: 0,
        height: `max(${height}px, 100dvh)`,
        overflow: 'hidden' as const,
      }
    : {
        position: 'relative' as const,
        height: '100%',
        overflow: 'hidden' as const,
      };
  const driftingStyle = slowScrollEnabled
    ? {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        height: `calc(100% + ${parallaxOffset}px)`,
        transform: `translateY(-${parallaxOffset}px) scale(1.08)`,
        transformOrigin: 'center top',
        willChange: 'transform',
      }
    : {
        position: 'absolute' as const,
        inset: 0,
      };

  return (
    <Box ref={containerRef} style={outerStyle}>
      <Box style={stageStyle}>
        <Box style={driftingStyle}>
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: getHomeHeroPlaceholderGradient(isDark),
            }}
          />
          {selectedBanner?.type === 'video' ? (
            <video
              ref={videoRef}
              src={selectedBanner.src}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setBannerLoaded(true)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                opacity: bannerLoaded ? bannerMediaOpacity : 0,
                transition: `opacity ${TRANSITION.SLOW} ${TRANSITION.EASE}`,
              }}
            />
          ) : selectedBanner ? (
            <img
              ref={imgRef}
              src={selectedBanner.src}
              alt=""
              fetchPriority="high"
              onLoad={() => setBannerLoaded(true)}
              style={{
                display: 'block',
                width: '100%',
                visibility: 'hidden',
              }}
            />
          ) : null}
          {selectedBanner && selectedBanner.type !== 'video' && (
            <img
              src={selectedBanner.src}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                opacity: bannerLoaded ? bannerMediaOpacity : 0,
                transition: `opacity ${TRANSITION.SLOW} ${TRANSITION.EASE}`,
              }}
            />
          )}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: isDark
                ? `rgba(0, 0, 0, ${bannerOverlayOpacity})`
                : `rgba(255, 255, 255, ${bannerOverlayOpacity})`,
            }}
          />
          <Box
            style={{
              position: 'absolute',
              width: 340,
              height: 340,
              top: -130,
              left: -80,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(236,72,153,0.32) 0%, rgba(236,72,153,0) var(--dt-gradient-radial-falloff))',
              filter: 'blur(4px)',
              pointerEvents: 'none',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              width: 360,
              height: 360,
              bottom: -170,
              right: -90,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0) var(--dt-gradient-radial-falloff))',
              filter: 'blur(6px)',
              pointerEvents: 'none',
            }}
          />
        </Box>
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, transparent var(--dt-gradient-overlay-mid), var(--mantine-color-body) 100%)',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to right, var(--mantine-color-body) 0%, transparent var(--dt-gradient-fade-edge-start), transparent var(--dt-gradient-fade-edge-end), var(--mantine-color-body) 100%)',
          }}
        />
      </Box>
    </Box>
  );
}
