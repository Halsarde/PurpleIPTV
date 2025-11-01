import React, { useEffect, useRef } from 'react';

type Subtitle = { label: string; src: string; lang?: string };

type Props = {
  src: string;
  type?: string; // e.g., 'application/x-mpegURL', 'video/mp4'
  poster?: string;
  subtitles?: Subtitle[];
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  preferredQuality?: 'auto' | '1080p' | '720p' | '480p';
  onQualitiesChange?: (qualities: Array<{ label: string; height: number }>) => void;
  onReady?: () => void;
  onError?: (message: string) => void;
};

const ProVideoPlayer: React.FC<Props> = ({
  src,
  type = 'application/x-mpegURL',
  poster,
  subtitles = [],
  autoplay = true,
  controls = true,
  muted = false,
  preferredQuality = 'auto',
  onQualitiesChange,
  onReady,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any | null>(null);
  const errTimerRef = useRef<number | null>(null);

  const ensureCss = (href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };

  const ensureScript = (srcUrl: string) =>
    new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${srcUrl}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = srcUrl;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load video.js script'));
      document.body.appendChild(s);
    });

  useEffect(() => {
    if (!videoRef.current) return;
    const setup = async () => {
      try {
        ensureCss('https://cdn.jsdelivr.net/npm/video.js@8/dist/video-js.min.css');
        await ensureScript('https://cdn.jsdelivr.net/npm/video.js@8/dist/video.min.js');

        const vjs = (window as any).videojs;
        if (!vjs) throw new Error('video.js not available');

        const player = vjs(videoRef.current!, {
          autoplay,
          controls,
          muted,
          preload: 'auto',
          liveui: true,
          responsive: true,
          fluid: true,
          sources: [{ src, type }],
          poster,
          html5: {
            vhs: {
              enableLowInitialPlaylist: true,
              limitRenditionByPlayerDimensions: true,
              useDevicePixelRatio: true,
            }
          }
        });
        playerRef.current = player;

        const applyQuality = (label: string) => {
          try {
            const tech = player.tech && player.tech();
            const vhs = tech && (tech as any).vhs;
            const reps = vhs && vhs.representations && vhs.representations();
            if (!reps || !reps.length) return;
            if (label === 'auto') {
              reps.forEach((r: any) => r.enabled(true));
              return;
            }
            const target = parseInt(label, 10);
            reps.forEach((r: any) => r.enabled(r.height === target));
          } catch {}
        };

        const emitQualities = () => {
          try {
            if (!onQualitiesChange) return;
            const tech = player.tech && player.tech();
            const vhs = tech && (tech as any).vhs;
            const reps = vhs && vhs.representations && vhs.representations();
            if (!reps || !reps.length) return;
            const heights: number[] = Array.from(
              new Set(
                (reps as any[])
                  .map((r: any) => Number(r?.height) || 0)
                  .filter((h: number) => h > 0)
              )
            ) as number[];
            heights.sort((a, b) => b - a);
            const list = [{ label: 'Auto', height: 0 }, ...heights.map((h) => ({ label: `${h}p`, height: h }))];
            onQualitiesChange(list);
          } catch {}
        };

        const clearErrTimer = () => {
          if (errTimerRef.current) {
            window.clearTimeout(errTimerRef.current);
            errTimerRef.current = null;
          }
        };

        const reportErrorSafely = () => {
          try {
            const el = videoRef.current as HTMLVideoElement | null;
            const isPlaying = !!el && !player.paused();
            const hasVideoFrame = !!el && (el.videoWidth || 0) > 0 && el.readyState >= 2;
            if (isPlaying && hasVideoFrame) return; // ignore transient errors during stable playback
          } catch {}
          const err = player.error();
          onError?.(err?.message || 'Playback error');
        };

        player.on('error', () => {
            clearErrTimer();
            // debounce: many streams emit non-fatal errors before selecting rendition
            errTimerRef.current = window.setTimeout(reportErrorSafely, 1200);
        });

        player.ready(() => {
          clearErrTimer();
          subtitles.forEach((s) => {
            if (!s?.src) return;
            player.addRemoteTextTrack(
              {
                kind: 'subtitles',
                src: s.src,
                srclang: s.lang || 'en',
                label: s.label || s.lang || 'Subtitle',
                default: false,
              },
              false
            );
          });
          onReady?.();
          applyQuality(preferredQuality);
          emitQualities();

          // Detect audio-only playback and retry once with cache-busting if no video frames
          let retried = false;
          const checkVideo = () => {
            const el = videoRef.current as any;
            if (!el) return;
            if ((el.videoWidth || 0) === 0 && !retried && !el.paused) {
              retried = true;
              try {
                const u = new URL(src, window.location.href);
                u.searchParams.set('t', Date.now().toString());
                player.src({ src: u.toString(), type });
                player.play?.();
              } catch {}
            }
          };
          player.on('playing', () => { clearErrTimer(); setTimeout(checkVideo, 800); });
          player.on('loadeddata', () => { clearErrTimer(); emitQualities(); });
          player.on('canplay', () => { clearErrTimer(); emitQualities(); });
          player.on('timeupdate', () => setTimeout(checkVideo, 0));
        });
      } catch (e: any) {
        onError?.(e?.message || 'Failed to initialize player');
      }
    };

    setup();

    return () => {
      try { playerRef.current?.dispose?.(); } catch {}
      playerRef.current = null;
      if (errTimerRef.current) { window.clearTimeout(errTimerRef.current); errTimerRef.current = null; }
      try {
        const el = videoRef.current;
        if (el) {
          el.pause();
          el.removeAttribute('src');
          el.load();
        }
      } catch {}
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.src({ src, type });
    try {
      // re-apply quality after source update
      const tech = player.tech && player.tech();
      const vhs = tech && (tech as any).vhs;
      if (vhs && vhs.representations) {
        const reps = vhs.representations();
        if (reps && reps.length) {
          if (preferredQuality === 'auto') reps.forEach((r: any)=> r.enabled(true));
          else {
            const target = parseInt(preferredQuality, 10);
            reps.forEach((r: any)=> r.enabled(r.height === target));
          }
        }
      }
    } catch {}
  }, [src, type, preferredQuality]);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-big-play-centered" playsInline />
    </div>
  );
};

export default ProVideoPlayer;
