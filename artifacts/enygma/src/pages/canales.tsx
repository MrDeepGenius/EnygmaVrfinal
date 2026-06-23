import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Tv, Star, Search, X, ArrowLeft, Play, Pause, SkipForward, WifiOff, RefreshCw, AlertCircle, Maximize, Minimize } from "lucide-react";
import Hls from "hls.js";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Ch {
  id: string;
  name: string;
  logo: string;
  category: string;
  streamUrl: string;
  playlist: "general" | "deportes";
}

// ─── Logo ────────────────────────────────────────────────────────────────────
function Logo({ src, name, size = "md" }: { src: string; name: string; size?: "sm" | "md" | "lg" }) {
  const [err, setErr] = useState(false);
  const cls = size === "lg" ? "w-10 h-10" : size === "sm" ? "w-4 h-4" : "w-7 h-7";
  if (!src || err) return <Tv className={`${cls} text-white/20`} />;
  return (
    <img src={src} alt={name} loading="lazy"
      className="w-full h-full object-contain p-1.5"
      onError={() => setErr(true)} />
  );
}

// ─── Player ──────────────────────────────────────────────────────────────────
function Player({
  channels, startIndex, onClose,
}: {
  channels: Ch[];
  startIndex: number;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [idx, setIdx] = useState(startIndex);
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");
  const [buffering, setBuffering] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ch = channels[idx] ?? channels[0];

  const bumpUI = useCallback(() => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), 3500);
  }, []);

  useEffect(() => {
    if (status === "playing") bumpUI();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [status, bumpUI]);

  // Track fullscreen changes
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Reset attempt when channel changes
  useEffect(() => { setAttempt(0); }, [idx]);

  // Load stream — auto quality, show loader until first frame
  useEffect(() => {
    const video = vidRef.current;
    if (!video) return;
    const raw = ch?.streamUrl?.trim();
    if (!raw) { setStatus("error"); return; }
    setStatus("loading");
    setBuffering(false);
    setPaused(false);

    const onPlaying = () => { setStatus("playing"); setBuffering(false); };
    const onWaiting = () => { if (status === "playing") setBuffering(true); };
    const onCanPlay = () => setBuffering(false);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);

    hlsRef.current?.destroy();
    hlsRef.current = null;
    const src = `${BASE}/api/hls-proxy?url=${encodeURIComponent(raw)}`;
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1,
        abrEwmaDefaultEstimate: 500000,
        capLevelToPlayerSize: true,
        maxBufferLength: 20,
        maxMaxBufferLength: 40,
        xhrSetup: (xhr) => { xhr.withCredentials = false; },
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) setStatus("error"); });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.onerror = () => setStatus("error");
      video.play().catch(() => {});
    } else {
      setStatus("error");
    }
    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      hlsRef.current?.destroy();
    };
  }, [ch, attempt]);

  // Spacebar = play/pause, Escape = close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); togglePause(); }
      if (e.code === "Escape" && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const togglePause = useCallback(() => {
    const video = vidRef.current;
    if (!video || status !== "playing") return;
    if (video.paused) { video.play().catch(() => {}); setPaused(false); }
    else { video.pause(); setPaused(true); }
    bumpUI();
  }, [status, bumpUI]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        // Lock to landscape on mobile
        if (screen.orientation && (screen.orientation as any).lock) {
          (screen.orientation as any).lock("landscape").catch(() => {});
        }
      } else {
        await document.exitFullscreen();
        if (screen.orientation && (screen.orientation as any).unlock) {
          (screen.orientation as any).unlock();
        }
      }
    } catch {}
    bumpUI();
  }, [bumpUI]);

  const goNext = useCallback(() => {
    setIdx(i => (i + 1) % channels.length);
    bumpUI();
  }, [channels.length, bumpUI]);

  const goPrev = useCallback(() => {
    setIdx(i => (i - 1 + channels.length) % channels.length);
    bumpUI();
  }, [channels.length, bumpUI]);

  if (!ch) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[300] bg-black select-none"
      onMouseMove={bumpUI}
      onTouchStart={bumpUI}
    >
      {/* ── Video ── */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={vidRef}
        className="absolute inset-0 w-full h-full object-contain cursor-pointer"
        playsInline autoPlay
        onClick={togglePause}
        style={{ display: status === "playing" ? "block" : "none" }}
      />

      {/* ── Buffering spinner (mid-playback stall) ── */}
      {status === "playing" && buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
            <div className="w-9 h-9 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-7"
          style={{ background: "radial-gradient(ellipse at 50% 40%, #111 0%, #000 70%)" }}>
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
              <Logo src={ch.logo} name={ch.name} />
            </div>
            <div className="absolute -inset-3 rounded-[2rem] border-[3px] border-transparent border-t-[#7B2FBE] animate-spin pointer-events-none" />
            <div className="absolute -inset-5 rounded-[2.5rem] border-[2px] border-transparent border-t-white/10 animate-spin pointer-events-none"
              style={{ animationDuration: "2.5s", animationDirection: "reverse" }} />
          </div>
          <div className="text-center">
            <p className="text-white font-black text-lg tracking-tight">{ch.name}</p>
            <p className="text-white/35 text-sm mt-1.5">Conectando señal en vivo…</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center"
          style={{ background: "radial-gradient(ellipse at 50% 40%, #180000 0%, #000 70%)" }}>
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-white/4 border border-white/8 flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-white/20" />
            </div>
            <div className="absolute -inset-2 rounded-[2rem] border-2 border-[#7B2FBE]/20 pointer-events-none" />
          </div>
          <div className="space-y-2">
            <p className="text-white font-black text-xl">Señal no disponible</p>
            <p className="text-white/40 text-sm max-w-[260px] mx-auto leading-relaxed">
              No se pudo cargar <span className="text-white/70 font-semibold">{ch.name}</span>.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-white/15 text-white/60 text-sm font-semibold hover:bg-white/8 hover:text-white transition-all">
              Volver
            </button>
            <button onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 text-white text-sm font-bold hover:bg-white/18 transition-all border border-white/15">
              <SkipForward className="w-4 h-4" /> Siguiente
            </button>
            <button onClick={() => setAttempt(a => a + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#7B2FBE] text-white text-sm font-bold hover:bg-[#6a28a6] active:scale-95 transition-all shadow-lg shadow-purple-900/40">
              <RefreshCw className="w-4 h-4" /> Reintentar
            </button>
          </div>
        </div>
      )}

      {/* ── UI Overlay (auto-hide) ── */}
      <div className={`absolute inset-0 pointer-events-none flex flex-col justify-between transition-opacity duration-300 ${showUI ? "opacity-100" : "opacity-0"}`}>

        {/* TOP BAR */}
        <div className="pointer-events-auto"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)", paddingBottom: "2.5rem" }}>
          <div className="flex items-center gap-3 px-4 pt-4 pb-1 md:px-6 md:pt-5">
            <button onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all border border-white/10 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/12 flex items-center justify-center overflow-hidden flex-shrink-0">
              <Logo src={ch.logo} name={ch.name} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm md:text-base truncate leading-tight">{ch.name}</p>
              <p className="text-white/40 text-xs uppercase tracking-widest mt-0.5">{ch.category}</p>
            </div>
            {status === "playing" && (
              <div className="flex items-center gap-2 bg-[#7B2FBE] px-3 py-1.5 rounded-full shadow-lg shadow-purple-900/50 flex-shrink-0">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-white text-[11px] font-black tracking-widest">EN VIVO</span>
              </div>
            )}
            {/* Fullscreen button */}
            <button onClick={toggleFullscreen}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all border border-white/10 flex-shrink-0"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
              {isFullscreen
                ? <Minimize className="w-5 h-5" />
                : <Maximize className="w-5 h-5" />
              }
            </button>
          </div>
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="pointer-events-auto"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)", paddingTop: "3rem" }}>
          <div className="flex items-center justify-center gap-6 px-6 pb-6 md:pb-8">

            {/* Prev channel */}
            <button onClick={goPrev}
              className="flex flex-col items-center gap-1 group"
              title="Canal anterior">
              <div className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center group-hover:bg-white/20 group-active:scale-90 transition-all">
                <SkipForward className="w-5 h-5 text-white rotate-180" />
              </div>
              <span className="text-white/40 text-[10px] font-semibold tracking-wide group-hover:text-white/70 transition-colors">ANTERIOR</span>
            </button>

            {/* Play / Pause */}
            <button onClick={togglePause}
              className="group"
              style={{ filter: status !== "playing" ? "opacity(0.4)" : undefined }}
              disabled={status !== "playing"}
              title={paused ? "Reproducir" : "Pausa"}>
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-active:scale-95 transition-all">
                {paused
                  ? <Play className="w-7 h-7 text-black fill-black ml-1" />
                  : <Pause className="w-7 h-7 text-black fill-black" />
                }
              </div>
            </button>

            {/* Next channel */}
            <button onClick={goNext}
              className="flex flex-col items-center gap-1 group"
              title="Canal siguiente">
              <div className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center group-hover:bg-white/20 group-active:scale-90 transition-all">
                <SkipForward className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/40 text-[10px] font-semibold tracking-wide group-hover:text-white/70 transition-colors">SIGUIENTE</span>
            </button>

          </div>

          {/* Channel position hint */}
          <p className="text-center text-white/20 text-[11px] pb-3">
            {idx + 1} / {channels.length}
          </p>
        </div>
      </div>

      {/* Tap-to-toggle on center area (when UI is hidden) */}
      {!showUI && status === "playing" && (
        <div className="absolute inset-0" onClick={bumpUI} />
      )}

      {/* Big pause indicator flash */}
      {paused && status === "playing" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center">
            <Pause className="w-9 h-9 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ ch, isFav, onPlay, onFav }: {
  ch: Ch; isFav: boolean; onPlay: () => void; onFav: () => void;
}) {
  return (
    <div onClick={onPlay}
      className="group cursor-pointer rounded-xl border border-white/8 bg-white/4 hover:border-[#7B2FBE]/50 hover:bg-white/8 transition-all duration-200 active:scale-95 overflow-hidden relative">
      <div className="aspect-video bg-black/60 flex items-center justify-center relative">
        <div className="w-14 h-14"><Logo src={ch.logo} name={ch.name} /></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-[#7B2FBE]/90 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      <div className="px-2 pb-2 pt-1.5">
        <p className="text-white text-xs font-semibold truncate leading-tight">{ch.name}</p>
        <p className="text-white/30 text-[10px] truncate mt-0.5">{ch.category}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onFav(); }}
        className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isFav ? "bg-[#7B2FBE] opacity-100" : "bg-black/60 opacity-0 group-hover:opacity-100"}`}>
        <Star className={`w-3 h-3 ${isFav ? "fill-white text-white" : "text-white"}`} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Canales() {
  const [channels, setChannels] = useState<Ch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"todos" | "deportes" | "general">("deportes");
  const [cat, setCat] = useState("Todos");
  const [playerIdx, setPlayerIdx] = useState<number | null>(null);
  const [favs, setFavs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("canales_favs") || "[]"); } catch { return []; }
  });

  const toggleFav = useCallback((id: string) => {
    setFavs(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev];
      try { localStorage.setItem("canales_favs", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const fetchChannels = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const r = await fetch(`${BASE}/api/tv/channels`);
      if (!r.ok) throw new Error();
      setChannels(await r.json());
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);

  const categories = useMemo(() => {
    const src = tab === "todos" ? channels : channels.filter(c => c.playlist === tab);
    return ["Todos", ...Array.from(new Set(src.map(c => c.category))).sort()];
  }, [channels, tab]);

  useEffect(() => { setCat("Todos"); }, [tab]);

  const filtered = useMemo(() => {
    let list = tab === "todos" ? channels : channels.filter(c => c.playlist === tab);
    if (cat !== "Todos") list = list.filter(c => c.category === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [channels, tab, cat, query]);

  const tabs = [
    { key: "deportes" as const, label: "⚽ Deportes" },
    { key: "general" as const, label: "📺 General" },
    { key: "todos" as const, label: "Todo" },
  ];

  return (
    <>
      <div className="min-h-screen bg-black text-white pb-24 md:pb-12">
        {/* Header */}
        <div className="relative px-4 pt-6 pb-4 md:px-12 md:pt-8">
          <div className="absolute inset-x-0 top-0 h-48 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.18) 0%, transparent 70%)" }} />

          <div className="relative flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#7B2FBE] flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Tv className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Canales</h1>
            {channels.length > 0 && (
              <span className="text-white/30 text-xs ml-auto">{channels.length} canales</span>
            )}
            <button onClick={fetchChannels} disabled={loading}
              className="p-2 rounded-full hover:bg-white/8 text-white/40 hover:text-white disabled:opacity-30 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-3 w-fit">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? "bg-[#7B2FBE] text-white shadow" : "text-white/50 hover:text-white"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar canal…"
              className="w-full bg-white/6 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#7B2FBE]/50 focus:bg-white/8 transition-all" />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${cat === c ? "bg-[#7B2FBE] text-white shadow" : "bg-white/6 text-white/50 border border-white/8 hover:bg-white/10 hover:text-white"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="px-4 md:px-12">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-white/10 border-t-[#7B2FBE] rounded-full animate-spin" />
              <p className="text-white/40 text-sm">Cargando canales…</p>
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-white/20" />
              <p className="text-white/50">No se pudieron cargar los canales</p>
              <button onClick={fetchChannels}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7B2FBE] text-white text-sm font-bold">
                <RefreshCw className="w-4 h-4" /> Reintentar
              </button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <Tv className="w-10 h-10 text-white/15" />
              <p className="text-white/35 text-sm">No se encontraron canales</p>
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 md:gap-3">
              {filtered.map((ch, i) => (
                <Card
                  key={ch.id} ch={ch}
                  isFav={favs.includes(ch.id)}
                  onPlay={() => setPlayerIdx(i)}
                  onFav={() => toggleFav(ch.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {playerIdx !== null && (
        <Player
          channels={filtered}
          startIndex={playerIdx}
          onClose={() => setPlayerIdx(null)}
        />
      )}
    </>
  );
}
