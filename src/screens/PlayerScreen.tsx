import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Stream } from "../types";
import shaka from "shaka-player/dist/shaka-player.ui";
import { settingsService } from "../services/settingsService"; // ✅ أضفنا استيراد إعدادات المستخدم

type Subtitle = { label: string; src: string; lang?: string };
type QualityTrack = { label: string; height: number; id: number };

const getStreamUrl = (stream: Stream | undefined): string | null => {
  const anyStream = stream as any;
  return (
    anyStream?.url ||
    anyStream?.stream_url ||
    anyStream?.hls ||
    anyStream?.dash ||
    null
  );
};

const getSubtitles = (stream: Stream | undefined): Subtitle[] => {
  const anyStream = stream as any;
  if (Array.isArray(anyStream?.subtitles)) {
    return anyStream.subtitles as Subtitle[];
  }
  return [];
};

const PlayerScreen: React.FC = () => {
  const { screenParams, setScreen } = useAppContext() as any;
  const stream: Stream | undefined = screenParams?.stream;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>("");
  const [qualityList, setQualityList] = useState<QualityTrack[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>("Auto");

  const url = getStreamUrl(stream);
  const subtitles = getSubtitles(stream);

  useEffect(() => {
    const v = videoRef.current as any;
    setPipSupported(!!(document as any).pictureInPictureEnabled && !!v?.requestPictureInPicture);
  }, []);

  useEffect(() => {
    if (!videoRef.current || !containerRef.current || !url) {
      setError("Missing stream URL or video element.");
      return;
    }

    // ✅ قراءة الإعدادات المفضلة للمستخدم
    const settings = settingsService.get();
    const preferredQuality = settings.quality || "auto";
    const preferredSubtitle = settings.subtitleLang || "off";

    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      setError("This browser/TV does not support Shaka Player.");
      return;
    }

    const video = videoRef.current;
    const player = new shaka.Player(video);
    playerRef.current = player;

    player.configure({
      streaming: { rebufferingGoal: 2, bufferingGoal: 10, lowLatencyMode: true },
      manifest: { retryParameters: { maxAttempts: 3 } },
    });

    const onError = (e: any) => setError("Playback error: " + (e?.detail?.message || e?.detail?.code || ""));
    player.addEventListener("error", onError);
    player.addEventListener("buffering", (e: any) => setIsBuffering(e.buffering));

    player
      .load(url)
      .then(async () => {
        setIsReady(true);
        setIsBuffering(false);

        // جلب الجودات المتاحة
        const tracks = player.getVariantTracks();
        const formatted = tracks
          .filter((t: any) => t.height)
          .map((t: any) => ({
            label: `${t.height}p`,
            height: t.height,
            id: t.id,
          }))
          .sort((a: any, b: any) => b.height - a.height);

        setQualityList([{ label: "Auto", height: 0, id: -1 }, ...formatted]);

        // إضافة الترجمات
        for (const t of subtitles) {
          if (!t?.src) continue;
          await player.addTextTrack(
            t.src,
            t.lang || "en",
            "subtitle",
            "text/vtt",
            undefined,
            t.label || t.lang || "Subtitle"
          );
        }

        // ✅ تطبيق الترجمة من الإعدادات
        if (preferredSubtitle === "off") {
          player.setTextTrackVisibility(false);
        } else {
          player.setTextTrackVisibility(true);
          player.selectTextLanguage(preferredSubtitle);
          setCurrentLang(preferredSubtitle);
        }

        // ✅ تطبيق الجودة من الإعدادات
        if (preferredQuality !== "auto") {
          player.configure({ abr: { enabled: false } });
          const track = player
            .getVariantTracks()
            .find((t: any) => `${t.height}p` === preferredQuality);
          if (track) player.selectVariantTrack(track, true);
          setCurrentQuality(preferredQuality);
        } else {
          player.configure({ abr: { enabled: true } });
          setCurrentQuality("Auto");
        }
      })
      .catch((err: any) => {
        setError("Failed to load stream: " + (err?.message || ""));
        setIsBuffering(false);
      });

    return () => {
      player.destroy().catch(() => {});
      playerRef.current = null;
    };
  }, [url]);

  // باقي الكود بدون تغيير ...

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current as any;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const togglePiP = async () => {
    if (!pipSupported) return;
    const v = videoRef.current as any;
    if ((document as any).pictureInPictureElement) await (document as any).exitPictureInPicture();
    else await v.requestPictureInPicture();
  };

  const changeSubtitle = (lang: string) => {
    setCurrentLang(lang);
    const player = playerRef.current;
    if (!player) return;
    if (lang === "off") player.setTextTrackVisibility(false);
    else {
      player.setTextTrackVisibility(true);
      player.selectTextLanguage(lang);
    }
  };

  const changeQuality = (label: string) => {
    const player = playerRef.current;
    if (!player) return;
    setCurrentQuality(label);

    if (label === "Auto") {
      player.configure({ abr: { enabled: true } });
    } else {
      player.configure({ abr: { enabled: false } });
      const selected = qualityList.find((q) => q.label === label);
      if (selected) {
        player.selectVariantTrack(
          player.getVariantTracks().find((t: any) => t.height === selected.height),
          true
        );
      }
    }
  };

  const title = (stream as any)?.name || (stream as any)?.title || "Now Playing";

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black text-white">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        controls={false}
        muted={isMuted}
      />

      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="text-sm text-gray-300">
            {isBuffering ? "Buffering…" : isReady ? "Live" : "Loading…"}
          </span>
        </div>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="bg-red-600/30 border border-red-500 rounded-xl p-6 text-center max-w-md">
            <p className="font-semibold mb-2">Error</p>
            <p>{error}</p>
            <button
              onClick={() => setScreen("HOME")}
              className="mt-4 px-4 py-2 bg-red-600/40 hover:bg-red-600/60 rounded-md"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* الأدوات السفلية */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-wrap items-center gap-3">
        <button onClick={togglePlay} className="bg-white/10 px-3 py-2 rounded-md">
          ⏯ Play/Pause
        </button>
        <button onClick={toggleMute} className="bg-white/10 px-3 py-2 rounded-md">
          {isMuted ? "🔇 Unmute" : "🔊 Mute"}
        </button>
        <button onClick={toggleFullscreen} className="bg-white/10 px-3 py-2 rounded-md">
          ⛶ Fullscreen
        </button>
        <button
          onClick={togglePiP}
          disabled={!pipSupported}
          className={`px-3 py-2 rounded-md ${
            pipSupported ? "bg-white/10" : "bg-white/5 opacity-50"
          }`}
        >
          🗔 PiP
        </button>

        {/* الترجمة */}
        {subtitles.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">Subtitle:</span>
            <select
              value={currentLang}
              onChange={(e) => changeSubtitle(e.target.value)}
              className="bg-white/10 px-2 py-1 rounded-md"
            >
              <option value="off">Off</option>
              {subtitles.map((s, i) => (
                <option key={i} value={s.lang || `lang-${i}`}>
                  {s.label || s.lang}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* الجودات */}
        {qualityList.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Quality:</span>
            <select
              value={currentQuality}
              onChange={(e) => changeQuality(e.target.value)}
              className="bg-white/10 px-2 py-1 rounded-md"
            >
              {qualityList.map((q, i) => (
                <option key={i} value={q.label}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerScreen;
