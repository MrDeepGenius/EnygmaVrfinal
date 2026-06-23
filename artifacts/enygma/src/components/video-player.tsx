import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Cast, RotateCcw, RotateCw, Gauge, Mic2, Captions,
  X, ExternalLink, Lock, Unlock, FileText,
} from "lucide-react";
import { useMediaOverlay } from "@/hooks/use-media-overlay";
import { MediaOverlay } from "@/components/media-overlay";

interface Track {
  file: string;
  label: string;
  kind: string;
  default?: boolean;
}

interface VideoPlayerProps {
  hlsUrl: string;
  castUrl?: string;
  tracks?: Track[];
  title: string;
  logoUrl?: string;
  onBack: () => void;
  episodes?: { label: string; onSelect: () => void; active: boolean }[];
  backdropUrl?: string;
  adEnabled?: boolean;
}

interface SubtitleOption {
  file_id: number;
  file_name: string;
  language: string;
}

const WVC_WEB_APP = "https://www.webvideocaster.com";
const WVC_PKG = "com.instantbits.cast.webvideo";
const WVC_LOGO = "https://play-lh.googleusercontent.com/4xUYWX2Z6LhCeyxjxfPl4d9v8DNGXiXJvR4gHcgTR3YCVoarhhGdfroTp1QvYI8pIQ";
const BASE = (import.meta.env.BASE_URL as string ?? "").replace(/\/$/, "");

function openWVC(url: string) {
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    try {
      const u = new URL(url);
      // Abre la URL original directamente en la app WVC
      // intent://HOST/PATH#Intent;scheme=https;package=WVC_PKG;end
      const pathAndQuery = u.pathname + u.search + u.hash;
      window.location.href = `intent://${u.hostname}${pathAndQuery}#Intent;scheme=${u.protocol.replace(":", "")};package=${WVC_PKG};end`;
    } catch {
      const encoded = encodeURIComponent(url);
      window.location.href = `intent://www.webvideocaster.com/?url=${encoded}#Intent;scheme=https;package=${WVC_PKG};end`;
    }
  } else {
    const encoded = encodeURIComponent(url);
    window.open(`${WVC_WEB_APP}/?url=${encoded}`, "_blank", "noopener,noreferrer");
  }
}

type BottomTab = "none" | "speed" | "quality" | "audio" | "subs";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function srtToVtt(srt: string): string {
  return (
    "WEBVTT\n\n" +
    srt
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
  );
}

export function VideoPlayer({ hlsUrl, castUrl, tracks, title, logoUrl, onBack, episodes, backdropUrl, adEnabled = true }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceConnectedRef = useRef(false);
  const subtitleBlobRef = useRef<string | null>(null);

  // Media Overlay
  const overlay = useMediaOverlay({
    videoElement: videoRef.current,
    backdropUrl,
    adEnabled,
  });

  const [controlsVisible, setControlsVisible] = useState(true);
  const [logoVisible, setLogoVisible] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLogoVisible(false), 4000); return () => clearTimeout(t); }, [logoUrl]);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [boostVolume, setBoostVolume] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [levels, setLevels] = useState<{ height: number; index: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [userLevel, setUserLevel] = useState(-1); // -1 = Auto (chosen by user)
  const [audioTracks, setAudioTracks] = useState<{ name: string; index: number }[]>([]);
  const [currentAudio, setCurrentAudio] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("none");
  const [speed, setSpeed] = useState(1);
  const [showCastModal, setShowCastModal] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const [subtitleOptions, setSubtitleOptions] = useState<SubtitleOption[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [subtitleLoading, setSubtitleLoading] = useState(false);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 5000);
  }, []);

  const revealControls = useCallback(() => {
    if (screenLocked) return;
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide, screenLocked]);

  useEffect(() => {
    revealControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [revealControls]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Auto-fullscreen on desktop, auto-rotate + fullscreen on mobile
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isMobile =
      /Mobi|Android/i.test(navigator.userAgent) ||
      ("ontouchstart" in window && window.innerWidth < 900);

    const t = setTimeout(() => {
      if (isMobile) {
        el.requestFullscreen()
          .then(() => {
            (screen.orientation as any)?.lock?.("landscape").catch?.(() => {});
          })
          .catch(() => {
            (screen.orientation as any)?.lock?.("landscape").catch?.(() => {});
          });
      } else {
        if (!document.fullscreenElement) {
          el.requestFullscreen().catch(() => {});
        }
      }
    }, 400);

    return () => {
      clearTimeout(t);
      (screen.orientation as any)?.unlock?.();
    };
  }, []);

  // Fetch subtitles from OpenSubtitles when title is known
  useEffect(() => {
    if (!title) return;
    const controller = new AbortController();
    fetch(
      `${BASE}/api/subtitles/search?query=${encodeURIComponent(title)}&languages=es,en`,
      { signal: controller.signal },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const files: SubtitleOption[] = [];
        for (const item of data.results ?? []) {
          for (const f of item.files ?? []) {
            files.push({
              file_id: f.file_id,
              file_name: f.file_name || item.release || title,
              language: item.language || "?",
            });
          }
        }
        setSubtitleOptions(files.slice(0, 40));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [title]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subtitleBlobRef.current) URL.revokeObjectURL(subtitleBlobRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  // Show pre-roll on mount (solo una vez)
  useEffect(() => {
    overlay.showPreroll();
  }, []);


  // HLS setup — tuned for faster startup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;
    setLoading(true);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1,
        autoStartLoad: true,
        enableWorker: true,
        startFragPrefetch: true,
        maxBufferLength: 20,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        backBufferLength: 30,
        maxBufferHole: 1,
        highBufferWatchdogPeriod: 2,
        fragLoadingMaxRetry: 8,
        fragLoadingRetryDelay: 500,
        fragLoadingMaxRetryTimeout: 8000,
        manifestLoadingMaxRetry: 5,
        manifestLoadingRetryDelay: 500,
        levelLoadingMaxRetry: 6,
        levelLoadingRetryDelay: 500,
        abrEwmaFastLive: 3,
        abrEwmaSlowLive: 9,
        abrBandWidthFactor: 0.8,
        abrBandWidthUpFactor: 0.7,
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels.map((l, i) => ({ height: l.height, index: i })));
        const aTracks = hls.audioTracks;
        setAudioTracks(aTracks.map((t, i) => ({ name: t.name || `Audio ${i + 1}`, index: i })));
        const spIdx = aTracks.findIndex(
          (t) =>
            t.lang?.startsWith("es") ||
            ["español", "spanish", "latino", "spa"].some((k) =>
              t.name?.toLowerCase().includes(k),
            ),
        );
        if (spIdx >= 0) { hls.audioTrack = spIdx; setCurrentAudio(spIdx); }
        setLoading(false);
        video.play().catch((err) => {
          if (err?.name !== "AbortError") setControlsVisible(true);
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, d) => setCurrentLevel(d.level));
      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, d) => setCurrentAudio(d.id));

      hls.on(Hls.Events.ERROR, (_, d) => {
        if (!d.fatal) return;
        if (d.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setTimeout(() => { try { hls.startLoad(); } catch {} }, 1500);
        } else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try { hls.recoverMediaError(); } catch {}
        } else {
          setLoading(true);
          setTimeout(() => {
            try { hls.destroy(); hlsRef.current = null; } catch {}
          }, 2000);
        }
      });

      const stallTimer = setInterval(() => {
        const v = videoRef.current;
        const h = hlsRef.current;
        if (!v || !h) return;
        if (!v.paused && v.readyState < 3 && !v.ended) {
          try { h.startLoad(); } catch {}
        }
      }, 8000);

      return () => {
        clearInterval(stallTimer);
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      const onMeta = () => {
        setLoading(false);
        setControlsVisible(true);
        video.play().catch(() => {});
      };
      video.addEventListener("loadedmetadata", onMeta, { once: true });
      return () => video.removeEventListener("loadedmetadata", onMeta);
    }
    return undefined;
  }, [hlsUrl]);

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) setBuffered(video.buffered.end(video.buffered.length - 1));
    };
    const onDurationChange = () => setDuration(video.duration);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); togglePlay(); revealControls(); }
      if (e.key === "ArrowRight") { skip(15); revealControls(); }
      if (e.key === "ArrowLeft") { skip(-15); revealControls(); }
      if (e.key === "f") toggleFullscreen();
      if (e.key === "l") setScreenLocked((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = next ? 0 : Math.max(1, boostVolume);
    }
  };

  const skip = (s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + s));
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
  };

  // ── Volume Booster (0 – 200%) via Web Audio GainNode ─────────────────────

  const initAudioCtx = useCallback(() => {
    const video = videoRef.current;
    if (!video || sourceConnectedRef.current) return;
    try {
      const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx() as AudioContext;
      const source = ctx.createMediaElementSource(video);
      const gain = ctx.createGain();
      gain.gain.value = 1;
      source.connect(gain);
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
      sourceConnectedRef.current = true;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    } catch {}
  }, []);

  const applyBoostVolume = useCallback(
    (val: number) => {
      const video = videoRef.current;
      if (!video) return;
      initAudioCtx();
      const clamped = Math.max(0, Math.min(2, val));
      setBoostVolume(clamped);
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = clamped <= 0 ? 0 : Math.max(1, clamped);
      }
      const nativeVol = Math.min(1, clamped);
      video.volume = nativeVol;
      video.muted = clamped === 0;
      setVolume(nativeVol);
      setMuted(clamped === 0);
    },
    [initAudioCtx],
  );

  // ── Subtitles ─────────────────────────────────────────────────────────────

  const loadSubtitle = useCallback(async (fileId: number) => {
    const video = videoRef.current;
    if (!video) return;
    setSubtitleLoading(true);
    try {
      const dlRes = await fetch(`${BASE}/api/subtitles/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId }),
      });
      if (!dlRes.ok) throw new Error("Download failed");
      const { link } = await dlRes.json();

      const srtRes = await fetch(link);
      const srtText = await srtRes.text();
      const vttText = srtToVtt(srtText);

      const blob = new Blob([vttText], { type: "text/vtt" });
      const blobUrl = URL.createObjectURL(blob);

      if (subtitleBlobRef.current) URL.revokeObjectURL(subtitleBlobRef.current);
      subtitleBlobRef.current = blobUrl;

      // Remove previous custom tracks
      Array.from(video.querySelectorAll("track[data-custom]")).forEach((t) => t.remove());

      // Inject new track
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.src = blobUrl;
      track.label = "Subtítulos";
      track.default = true;
      track.setAttribute("data-custom", "1");
      video.appendChild(track);

      setTimeout(() => {
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode =
            i === video.textTracks.length - 1 ? "showing" : "hidden";
        }
      }, 100);

      setSelectedSubId(fileId);
      setBottomTab("none");
    } catch {
      /* silent */
    } finally {
      setSubtitleLoading(false);
    }
  }, []);

  const removeSubtitle = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      Array.from(video.querySelectorAll("track[data-custom]")).forEach((t) => t.remove());
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = "hidden";
      }
    }
    if (subtitleBlobRef.current) {
      URL.revokeObjectURL(subtitleBlobRef.current);
      subtitleBlobRef.current = null;
    }
    setSelectedSubId(null);
  }, []);

  // ── Misc ─────────────────────────────────────────────────────────────────

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = Math.max(
      0,
      Math.min(duration, ((e.clientX - rect.left) / rect.width) * duration),
    );
  };

  const seekToTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.changedTouches[0];
    v.currentTime = Math.max(
      0,
      Math.min(duration, ((touch.clientX - rect.left) / rect.width) * duration),
    );
  };

  const openCast = () => {
    if (!castUrl) return;
    openWVC(castUrl);
  };

  const setQuality = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      // When setting to auto (-1), also reset ABR so it adapts freely
      if (level === -1) hlsRef.current.nextLevel = -1;
    }
    setUserLevel(level);
    setBottomTab("none");
  };
  const setAudio = (idx: number) => {
    if (hlsRef.current) hlsRef.current.audioTrack = idx;
    setCurrentAudio(idx);
    setBottomTab("none");
  };
  const setPlaybackSpeed = (s: number) => {
    const v = videoRef.current;
    if (v) v.playbackRate = s;
    setSpeed(s);
    setBottomTab("none");
  };

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60),
      sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${m}:${String(sec).padStart(2, "0")}`;
  };

  const pct = duration ? (currentTime / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;
  // userLevel: what the user picked (-1 = Auto). currentLevel: what HLS is actually playing.
  const currentQuality =
    userLevel === -1
      ? levels[currentLevel]
        ? `Auto · ${levels[currentLevel].height}p`
        : "Auto"
      : levels[userLevel]
        ? `${levels[userLevel].height}p`
        : "Auto";

  const brightnessFilter = brightness !== 1 ? `brightness(${brightness})` : undefined;
  const boostPct = Math.round(boostVolume * 100);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      data-tv-ignore-nav="true"
      className="fixed inset-0 z-[200] bg-black select-none overflow-hidden"
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      style={{ cursor: controlsVisible ? "default" : "none" }}
    >
      {/* Video */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        {...({ "x-webkit-airplay": "allow" } as Record<string, string>)}
        style={{ filter: brightnessFilter }}
        onClick={(e) => { e.stopPropagation(); togglePlay(); revealControls(); }}
      >
        {tracks?.map((t, i) => (
          <track key={i} src={t.file} kind={t.kind as "subtitles" | "captions"} label={t.label} default={t.default} />
        ))}
      </video>

      {/* Logo overlay — fades after 4s */}
      {logoUrl && (
        <div
          className="absolute bottom-16 left-5 z-40 pointer-events-none transition-opacity duration-[1500ms]"
          style={{ opacity: logoVisible ? 1 : 0 }}
        >
          <img
            src={logoUrl}
            alt={title}
            className="max-h-12 max-w-[180px] object-contain drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]"
          />
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
            <div className="absolute inset-0 rounded-full border-4 border-[#7B2FBE] border-t-transparent animate-spin" />
          </div>
          <p className="text-white/40 text-xs tracking-[0.2em] uppercase">Cargando</p>
        </div>
      )}

      {/* Big play when paused and controls hidden */}
      {!loading && !playing && !controlsVisible && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/50 border-2 border-white/20 flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Screen-locked badge — always visible when locked */}
      {screenLocked && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 border border-[#7B2FBE]/40 pointer-events-none"
        >
          <Lock className="w-3.5 h-3.5 text-[#7B2FBE]" />
          <span className="text-xs font-bold text-white/80">Pantalla bloqueada — mantené presionado para desbloquear</span>
        </div>
      )}

      {/* Long-press to unlock when locked */}
      {screenLocked && (
        <div
          className="absolute inset-0 z-[240]"
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            const t = setTimeout(() => setScreenLocked(false), 1500);
            const cancel = () => clearTimeout(t);
            e.currentTarget.addEventListener("touchend", cancel, { once: true });
            e.currentTarget.addEventListener("touchmove", cancel, { once: true });
          }}
        />
      )}

      {/* Bottom tab panel */}
      {bottomTab !== "none" && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Speed */}
          {bottomTab === "speed" && (
            <div className="flex items-center justify-center gap-2 py-4 px-4">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${speed === s ? "bg-[#7B2FBE] text-white" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"}`}
                >
                  {s === 1 ? "Normal" : `${s}x`}
                </button>
              ))}
            </div>
          )}

          {/* Quality */}
          {bottomTab === "quality" && (
            <div className="flex items-center justify-center gap-2 py-4 px-4 flex-wrap">
              <button
                onClick={() => setQuality(-1)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${userLevel === -1 ? "bg-[#7B2FBE] text-white" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"}`}
              >
                Auto
              </button>
              {[...levels].reverse().map((l) => (
                <button
                  key={l.index}
                  onClick={() => setQuality(l.index)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${userLevel === l.index ? "bg-[#7B2FBE] text-white" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"}`}
                >
                  {l.height}p
                </button>
              ))}
            </div>
          )}

          {/* Audio */}
          {bottomTab === "audio" && (
            <div className="flex items-center justify-center gap-2 py-4 px-4 flex-wrap">
              {audioTracks.map((t) => (
                <button
                  key={t.index}
                  onClick={() => setAudio(t.index)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${currentAudio === t.index ? "bg-[#7B2FBE] text-white" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"}`}
                >
                  {t.name}
                </button>
              ))}
              {audioTracks.length === 0 && (
                <span className="text-white/30 text-sm">Solo una pista de audio disponible</span>
              )}
            </div>
          )}

          {/* Subtitles */}
          {bottomTab === "subs" && (
            <div className="flex flex-col max-h-52 overflow-y-auto py-3 px-4">
              {subtitleLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-[#7B2FBE] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={removeSubtitle}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedSubId === null ? "bg-[#7B2FBE] text-white" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"}`}
                  >
                    Sin subtítulos
                  </button>
                  {subtitleOptions.length === 0 && (
                    <span className="text-white/30 text-sm flex items-center">No se encontraron subtítulos</span>
                  )}
                  {subtitleOptions.map((opt) => (
                    <button
                      key={opt.file_id}
                      onClick={() => loadSubtitle(opt.file_id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${selectedSubId === opt.file_id ? "bg-[#7B2FBE] text-white" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"}`}
                    >
                      <span className="uppercase opacity-80 font-black">{opt.language}</span>
                      <span className="truncate max-w-[160px]">{opt.file_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${controlsVisible && !screenLocked ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={(e) => { e.stopPropagation(); setBottomTab("none"); }}
      >
        {/* TOP BAR */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-8 bg-gradient-to-b from-black/80 via-black/20 to-transparent">
          <button onClick={onBack} className="text-white p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[#7B2FBE] text-[10px] font-bold uppercase tracking-[0.25em]">Estás mirando</p>
            <p className="text-white font-semibold text-sm truncate">{title}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Screen lock */}
            <button
              onClick={(e) => { e.stopPropagation(); setScreenLocked((v) => !v); }}
              className={`transition-colors ${screenLocked ? "text-[#7B2FBE]" : "text-white/70 hover:text-white"}`}
              title={screenLocked ? "Desbloquear" : "Bloquear pantalla"}
            >
              {screenLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </button>
            {castUrl && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowCastModal(true); }}
                className="text-white/70 hover:text-white transition-colors"
                title="Enviar a TV"
              >
                <Cast className="w-5 h-5" />
              </button>
            )}
            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MIDDLE AREA: sliders + center controls */}
        <div className="flex-1 flex items-center justify-between px-3">
          {/* LEFT: brightness slider */}
          <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="h-28 w-10 bg-white/10 rounded-full flex items-end overflow-hidden border border-white/10">
              <div
                className="w-full bg-[#7B2FBE] rounded-full transition-all"
                style={{ height: `${brightness * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0.3}
              max={1.5}
              step={0.05}
              value={brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
              className="absolute opacity-0 w-10 h-28 cursor-pointer"
              style={{ writingMode: "vertical-lr", direction: "rtl" }}
            />
            <Settings className="w-5 h-5 text-white/50" />
          </div>

          {/* CENTER: skip + play */}
          <div className="flex items-center gap-8 md:gap-14" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => skip(-15)}
              className="flex flex-col items-center gap-1 text-white active:scale-90 transition-transform"
            >
              <div className="relative">
                <RotateCcw className="w-10 h-10" strokeWidth={1.5} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold mt-0.5">15</span>
              </div>
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center active:scale-90 transition-transform"
            >
              {playing
                ? <Pause className="w-7 h-7 text-white fill-white" />
                : <Play className="w-7 h-7 text-white fill-white ml-1" />}
            </button>

            <button
              onClick={() => skip(15)}
              className="flex flex-col items-center gap-1 text-white active:scale-90 transition-transform"
            >
              <div className="relative">
                <RotateCw className="w-10 h-10" strokeWidth={1.5} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold mt-0.5">15</span>
              </div>
            </button>
          </div>

          {/* RIGHT: volume booster slider (0-200%) */}
          <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-28 w-10 bg-white/10 rounded-full flex items-end overflow-hidden border border-white/10">
              <div
                className="w-full rounded-full transition-all"
                style={{
                  height: `${muted ? 0 : (boostVolume / 2) * 100}%`,
                  background: boostVolume > 1 ? "linear-gradient(to top, #ff6b00, #7B2FBE)" : "#7B2FBE",
                }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={muted ? 0 : boostVolume}
              onChange={(e) => applyBoostVolume(parseFloat(e.target.value))}
              className="absolute opacity-0 w-10 h-28 cursor-pointer"
              style={{ writingMode: "vertical-lr", direction: "rtl" }}
            />
            <span className={`text-[9px] font-black tabular-nums ${boostVolume > 1 ? "text-orange-400" : "text-white/50"}`}>
              {boostPct}%
            </span>
            <button onClick={toggleMute} className="text-white/50">
              {muted || boostVolume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Episode row */}
        {episodes && episodes.length > 1 && (
          <div className="px-4 pb-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {episodes.map((ep, i) => (
                <button
                  key={i}
                  onClick={ep.onSelect}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${ep.active ? "bg-[#7B2FBE] text-white" : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white"}`}
                >
                  {ep.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM: progress + time + tabs */}
        <div
          className="bg-gradient-to-t from-black/95 via-black/50 to-transparent pt-8 pb-3 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-white text-sm font-mono tabular-nums w-12 text-right">{fmt(currentTime)}</span>
            <div
              className="flex-1 relative h-2 bg-white/20 rounded-full cursor-pointer"
              onClick={seekTo}
              onTouchEnd={seekToTouch}
            >
              <div className="absolute left-0 top-0 h-full bg-white/20 rounded-full" style={{ width: `${bufPct}%` }} />
              <div className="absolute left-0 top-0 h-full bg-[#7B2FBE] rounded-full" style={{ width: `${pct}%` }} />
              <div
                className="absolute top-1/2 w-3 h-3 rounded-full bg-white -translate-y-1/2 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${pct}% - 6px)` }}
              />
            </div>
            <span className="text-white/50 text-sm font-mono tabular-nums w-12">{fmt(duration)}</span>
          </div>

          {/* Bottom tabs */}
          <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
            <button
              onClick={() => setBottomTab(bottomTab === "speed" ? "none" : "speed")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${bottomTab === "speed" ? "text-[#7B2FBE]" : "text-white/50 hover:text-white"}`}
            >
              <Gauge className="w-4 h-4" />
              Velocidad
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => setBottomTab(bottomTab === "quality" ? "none" : "quality")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${bottomTab === "quality" ? "text-[#7B2FBE]" : "text-white/50 hover:text-white"}`}
            >
              <Captions className="w-4 h-4" />
              {currentQuality}
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => setBottomTab(bottomTab === "audio" ? "none" : "audio")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${bottomTab === "audio" ? "text-[#7B2FBE]" : "text-white/50 hover:text-white"}`}
            >
              <Mic2 className="w-4 h-4" />
              Idioma
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => setBottomTab(bottomTab === "subs" ? "none" : "subs")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${bottomTab === "subs" ? "text-[#7B2FBE]" : selectedSubId !== null ? "text-green-400 hover:text-green-300" : "text-white/50 hover:text-white"}`}
            >
              <FileText className="w-4 h-4" />
              Subtítulos
            </button>
          </div>
        </div>
      </div>

      {/* ── WEB VIDEO CASTER MODAL ─────────────────────────────── */}
      {showCastModal && (
        <div
          className="absolute inset-0 z-[300] flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowCastModal(false)}
        >
          <div
            className="w-full sm:max-w-sm mx-4 mb-0 sm:mb-auto rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(160deg, #1a1a2e 0%, #0f0f1a 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 border border-white/10">
                  <img src={WVC_LOGO} alt="Web Video Caster" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-tight">Web Video Caster</p>
                  <p className="text-white/40 text-xs">Enviar a tu TV</p>
                </div>
              </div>
              <button onClick={() => setShowCastModal(false)} className="text-white/40 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mx-5 h-px bg-white/8 my-2" />
            <div className="px-5 py-3">
              <p className="text-white/70 text-sm leading-relaxed">
                Enviá <span className="text-white font-semibold">{title}</span> a tu TV con{" "}
                <span className="text-[#7B2FBE] font-bold">Web Video Caster</span>. Conectá el celular y la TV a la misma red Wi-Fi y presioná el botón.
              </p>
            </div>
            <div className="mx-5 mb-4 rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)" }}>
              {[
                "Conectá el celular y la TV a la misma red Wi-Fi",
                'Presioná "Abrir Web Video Caster" — abre la app o la versión web',
                "Seleccioná tu TV y disfrutá el contenido",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white mt-0.5"
                    style={{ background: "linear-gradient(135deg,#6a28a6,#7B2FBE)" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-white/60 text-xs leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
            <div className="px-5 pb-6 space-y-2.5">
              <button
                onClick={openCast}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #6a28a6, #7B2FBE)", boxShadow: "0 4px 20px rgba(123,47,190,0.4)" }}
              >
                <Cast className="w-4 h-4" />
                Abrir Web Video Caster
              </button>
              {castUrl && (
                <button
                  onClick={() => window.open(`${WVC_WEB_APP}/?url=${encodeURIComponent(castUrl)}`, "_blank", "noopener,noreferrer")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-colors border border-white/10 hover:border-white/25"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir versión web
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Overlay - Pre-roll, Pause, Buffering */}
      <MediaOverlay
        visible={overlay.visible}
        mode={overlay.mode}
        backdropUrl={overlay.backdropUrl}
        duration={3000}
      />
    </div>
  );
}
