import { Box, useComputedColorScheme } from '@mantine/core';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getHomeHeroPlaceholderGradient } from '../../constants/styles';
import { TRANSITION } from '../../constants/ui';
import { BannerContext } from '../../contexts';

export default function BannerBackground() {
  const isDark = useComputedColorScheme('light') === 'dark';
  const { selectedBanner, bannerLoaded, setBannerLoaded } =
    useContext(BannerContext);
  const [mediaHeight, setMediaHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const imgRef = useCallback((el: HTMLImageElement | null) => {
    if (!el) return;
    const update = () => setMediaHeight(el.offsetHeight);
    if (el.complete) update();
    el.addEventListener('load', update);
  }, []);

  const videoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (!el) return;
      const update = () => {
        if (el.videoWidth > 0 && el.videoHeight > 0) {
          const containerWidth =
            containerRef.current?.offsetWidth ?? el.clientWidth;
          setMediaHeight(
            Math.round(containerWidth * (el.videoHeight / el.videoWidth))
          );
        }
      };
      if (el.readyState >= 1) update();
      el.addEventListener('loadedmetadata', update);
    },
    [selectedBanner?.src]
  );

  // Recalculate on window resize
  useEffect(() => {
    if (selectedBanner?.type !== 'video') return;

    const video = containerRef.current?.querySelector('video');
    if (!video) return;

    const onResize = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const containerWidth = containerRef.current?.offsetWidth ?? 0;
        setMediaHeight(
          Math.round(containerWidth * (video.videoHeight / video.videoWidth))
        );
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [selectedBanner?.type, selectedBanner?.src]);

  const height = mediaHeight > 0 ? mediaHeight : 350;

  return (
    <Box
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
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
            opacity: bannerLoaded ? 1 : 0,
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
      {/* Visible cover image (absolute, fills measured height) */}
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
            opacity: bannerLoaded ? 1 : 0,
            transition: `opacity ${TRANSITION.SLOW} ${TRANSITION.EASE}`,
          }}
        />
      )}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'rgba(0, 0, 0, 0.5)'
            : 'rgba(255, 255, 255, 0.5)',
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
            'radial-gradient(circle, rgba(236,72,153,0.32) 0%, rgba(236,72,153,0) 72%)',
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
            'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0) 74%)',
          filter: 'blur(6px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, transparent 40%, var(--mantine-color-body) 100%)',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to right, var(--mantine-color-body) 0%, transparent 10%, transparent 90%, var(--mantine-color-body) 100%)',
        }}
      />
    </Box>
  );
}
