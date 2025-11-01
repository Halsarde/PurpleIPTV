declare module 'video.js' {
  export interface VideoJsSource {
    src: string;
    type?: string;
  }

  export interface VideoJsPlayerOptions {
    autoplay?: boolean;
    controls?: boolean;
    muted?: boolean;
    preload?: 'auto' | 'metadata' | 'none' | string;
    liveui?: boolean;
    responsive?: boolean;
    fluid?: boolean;
    poster?: string;
    sources?: VideoJsSource[];
  }

  export interface VideoJsPlayer {
    src(source: VideoJsSource | VideoJsSource[]): void;
    dispose(): void;
    on(event: string, handler: (...args: any[]) => void): void;
    ready(callback: () => void): void;
    error(): { code?: number; message?: string } | null;
    addRemoteTextTrack(
      track: { kind: string; src: string; srclang: string; label: string; default?: boolean },
      manualCleanup?: boolean
    ): any;
  }

  const videojs: (element: HTMLVideoElement, options?: VideoJsPlayerOptions) => VideoJsPlayer;
  export default videojs;
}

