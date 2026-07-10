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
}

const SafeVideo = forwardRef<HTMLVideoElement, SafeVideoProps>(
  (
    {
      src,
      autoPlay,
      muted,
      playsInline = true,
      preload,
      ...props
    },
    forwardedRef
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(
      forwardedRef,
      () => videoRef.current as HTMLVideoElement,
      []
    );

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      if (muted) {
        video.muted = true;
        video.defaultMuted = true;
      }

      video.load();

      if (!autoPlay) return;

      const play = () => {
        const playPromise = video.play();
        if (playPromise) {
          playPromise.catch(() => {
            // Mobile browsers may block autoplay in low power or data saver modes.
          });
        }
      };

      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        play();
        return;
      }

      video.addEventListener('canplay', play, { once: true });
      return () => video.removeEventListener('canplay', play);
    }, [autoPlay, muted, src]);

    if (!src) return null;

    return (
      <video
        key={src}
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        preload={preload ?? (autoPlay ? 'auto' : 'metadata')}
        {...props}
      />
    );
  }
);

SafeVideo.displayName = 'SafeVideo';

export default SafeVideo;
