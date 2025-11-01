import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Episode, Playlist, Stream } from "../types";
import * as xtreamService from "../services/xtreamService";
import ProVideoPlayer from "../components/ProVideoPlayer";

type Subtitle = { label: string; src: string; lang?: string };

const computeStreamUrl = (
  playlist: Partial<Playlist> | undefined,
  stream: Stream | undefined,
  episode?: Episode
): string | null => {
  if (!stream) return null;
  const anyStream = stream as any;
  if (playlist?.loginType === "xtream" && playlist?.server_info && playlist?.user_info) {
    try {
      if (episode) {
        const ext = episode.container_extension || "mp4";
        return xtreamService.getSeriesStreamUrl(
          playlist as Playlist,
          Number(episode.stream_id || episode.id),
          ext
        );
      }
      if (stream.stream_type === "series") return null;
      if (stream.stream_type === "live") return xtreamService.getLiveStreamUrl(playlist as Playlist, stream.stream_id, "m3u8");
      if (stream.stream_type === "movie") {
        const ext = anyStream?.container_extension || "mp4";
        return xtreamService.getVodStreamUrl(playlist as Playlist, stream.stream_id, ext);
      }
    } catch (err) {
      console.error("Failed to build Xtream stream URL", err);
    }
  }
  return (
    episode?.direct_source ||
    anyStream?.url ||
    anyStream?.stream_url ||
    anyStream?.hls ||
    anyStream?.dash ||
    null
  );
};

const getSubtitles = (stream: Stream | undefined): Subtitle[] => {
  const anyStream = stream as any;
  if (Array.isArray(anyStream?.subtitles)) return anyStream.subtitles as Subtitle[];
  return [];
};

const PlayerScreen: React.FC = () => {
  const { screenParams, setScreen, playlist, addRecentlyWatched } = useAppContext() as any;
  const stream: Stream | undefined = screenParams?.stream;
  const episode: Episode | undefined = screenParams?.episode;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [retryOnce, setRetryOnce] = useState<boolean>(false);
  const [preferredQuality, setPreferredQuality] = useState<string>('auto');
  const [qualityList, setQualityList] = useState<Array<{label:string;height:number}>>([{label:'Auto',height:0}]);

  const log = (msg: string) => {
    const stamp = new Date().toISOString().split('T')[1].replace('Z','');
    setDebugLogs((prev) => [...prev.slice(-99), `[${stamp}] ${msg}`]);
  };

  const url = useMemo(() => computeStreamUrl(playlist, stream, episode), [playlist, stream, episode]);
  const subtitles = getSubtitles(stream);
  const mime = useMemo(() => {
    if (!url) return undefined;
    if (/\.m3u8(\?|$)/i.test(url)) return "application/x-mpegURL";
    if (/\.mpd(\?|$)/i.test(url)) return "application/dash+xml";
    if (/\.(mp4|m4v)(\?|$)/i.test(url)) return "video/mp4";
    return undefined;
  }, [url]);

  useEffect(() => {
    try {
      const { settingsService } = require('../services/settingsService');
      const s = settingsService.get();
      setPreferredQuality(s.quality);
    } catch {}
  }, []);

  useEffect(() => { setRetryOnce(false); }, [url]);

  // auto-retry once if loading too long
  useEffect(() => {
    if (!url) return;
    if (isReady) return;
    const t = setTimeout(() => {
      if (!isReady && !retryOnce) {
        setRetryOnce(true);
        setReloadKey((k) => k + 1);
      }
    }, 8000);
    return () => clearTimeout(t);
  }, [url, reloadKey, isReady, retryOnce]);

  // Mixed-content guard
  useEffect(() => {
    if (!containerRef.current) return;
    if (!url) {
      setError("Missing stream URL or unsupported stream type.");
      setIsBuffering(false);
      log('Error: Missing URL or unsupported stream type');
      return;
    }
    try {
      const isMixed = typeof window !== 'undefined' && window.location.protocol === 'https:' && /^http:\/\//i.test(url);
      if (isMixed) {
        setError('Stream uses http on an https site (mixed content). Use an https server URL or open the app over http.');
        log('Blocked mixed content: ' + url);
        setIsBuffering(false);
        return;
      }
    } catch {}
    setError(null);
    setIsReady(false);
    setIsBuffering(true);
  }, [url]);

  const title = (stream as any)?.name || (stream as any)?.title || "Now Playing";
  const handleBack = () => setScreen(stream?.stream_type !== 'live' ? 'details' : 'home', stream?.stream_type !== 'live' ? { stream } : undefined);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black text-white">
      {url && (
        <ProVideoPlayer
          key={reloadKey}
          src={url}
          type={mime}
          subtitles={subtitles}
          autoplay
          controls
          muted={false}
          preferredQuality={preferredQuality as any}
          onQualitiesChange={(q)=> setQualityList(q)}
          onReady={() => { setError(null); setIsReady(true); setIsBuffering(false); if (stream) addRecentlyWatched?.(stream); }}
          onError={(m) => { setError(m || 'Failed to load stream'); setIsBuffering(false); }}
        />
      )}

      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="bg-black/50 rounded-full p-2 hover:bg-black/75">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <span className="text-sm text-gray-300">
            {isBuffering ? "Buffering…" : isReady ? "Live" : "Loading…"}
          </span>
        </div>
      </div>

      {/* Dynamic quality selector */}
      <div className="absolute top-4 right-4 z-30">
        <select
          value={preferredQuality}
          onChange={(e)=> setPreferredQuality(e.target.value)}
          className="bg-black/50 text-white text-xs px-2 py-1 rounded border border-white/20"
        >
          {qualityList.map((q)=> (
            <option key={q.label} value={q.label.toLowerCase()}>{q.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="bg-red-600/30 border border-red-500 rounded-xl p-6 text-center max-w-md">
            <p className="font-semibold mb-2">Error</p>
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md"
            >
              Dismiss
            </button>
            <button
              onClick={() => { setError(null); setIsBuffering(true); setReloadKey((k) => k + 1); }}
              className="mt-4 ml-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Debug panel */}
      <div className="absolute bottom-4 left-4 space-y-2">
        <button onClick={() => setShowDebug((v) => !v)} className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md">
          {showDebug ? 'Hide Logs' : 'Show Logs'}
        </button>
        {showDebug && (
          <div className="max-w-md max-h-40 overflow-auto text-xs bg-black/70 border border-white/10 rounded-md p-2">
            {debugLogs.length === 0 ? (
              <div className="text-gray-400">No logs yet…</div>
            ) : (
              debugLogs.slice(-20).map((l, i) => (<div key={i} className="whitespace-pre-wrap">{l}</div>))
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default PlayerScreen;



