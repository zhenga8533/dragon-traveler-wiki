import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type VideoHTMLAttributes,
} from 'react';

export interface SafeVideoProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'children'> {
  src?: string;
  sourceType?: string;
}

const SafeVideo = forwardRef<HTMLVideoElement, SafeVideoProps>(
  (
    {
      src,
      sourceType = 'video/mp4',
      autoPlay,
      muted,
      playsInline = true,
      preload,
      ...props
    },
    forwardedRef
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(forwardedRef, () => videoRef.current as HTMLVideoElement);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      if (muted) {
        video.muted = true;
        video.defaultMuted = true;
      }

      video.load();

      if (!autoPlay) return;

      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Mobile browsers may block autoplay in low power or data saver modes.
        });
      }
    }, [autoPlay, muted, src]);

    if (!src) return null;

    return (
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        preload={preload ?? (autoPlay ? 'auto' : 'metadata')}
        {...props}
      >
        <source src={src} type={sourceType} />
      </video>
    );
  }
);

SafeVideo.displayName = 'SafeVideo';

export default SafeVideo;
