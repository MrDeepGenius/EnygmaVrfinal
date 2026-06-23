import { useRoute } from "wouter";
import { AlertCircle, Cast, X, ExternalLink } from "lucide-react";
import {
  useGetMovie,
  useGetSeriesDetail,
  useGetAnimeDetail,
  useResolveVideo,
  useGetTmdbDetails,
  getGetMovieQueryKey,
  getGetSeriesDetailQueryKey,
  getGetAnimeDetailQueryKey,
  getResolveVideoQueryKey,
  getGetTmdbDetailsQueryKey,
} from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { VideoPlayer } from "@/components/video-player";
import { PremiumPlaybackScreen } from "@/components/premium-playback-screen";
import { useWatchProgress } from "@/lib/use-watch-progress";

const WVC_WEB_APP = "https://www.webvideocaster.com";
const WVC_PKG = "com.instantbits.cast.webvideo";
const WVC_LOGO = "https://play-lh.googleusercontent.com/4xUYWX2Z6LhCeyxjxfPl4d9v8DNGXiXJvR4gHcgTR3YCVoarhhGdfroTp1QvYI8pIQ";

function openWebVideoCaster(url: string) {
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    try {
      const u = new URL(url);
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

function CastModal({ castUrl, title, onClose }: { castUrl: string; title: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
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
              <img src={WVC_LOGO} alt="Web Video Caster" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Web Video Caster</p>
              <p className="text-white/40 text-xs">Enviar a tu TV</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
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
              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white mt-0.5" style={{ background: "linear-gradient(135deg,#6a28a6,#7B2FBE)" }}>
                {i + 1}
              </span>
              <p className="text-white/60 text-xs leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-6 space-y-2.5">
          <button
            onClick={() => openWebVideoCaster(castUrl)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #6a28a6, #7B2FBE)", boxShadow: "0 4px 20px rgba(123,47,190,0.4)" }}
          >
            <Cast className="w-4 h-4" />
            Abrir Web Video Caster
          </button>
          <a
            href={`${WVC_WEB_APP}/?url=${encodeURIComponent(castUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-colors border border-white/10 hover:border-white/25"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir versión web directamente
          </a>
        </div>
      </div>
    </div>
  );
}

function toEmbedUrl(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v"))
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}?autoplay=1`;
    if (u.hostname === "youtu.be")
      return `https://www.youtube.com/embed${u.pathname}?autoplay=1`;
    if (u.hostname === "ok.ru" && u.pathname.startsWith("/video/"))
      return `https://ok.ru/videoembed/${u.pathname.replace("/video/", "")}`;
  } catch { /* invalid URL */ }
  return url;
}

// Sites we can extract HLS from
function canExtract(url: string): boolean {
  if (!url) return false;
  try {
    const h = new URL(url).hostname;
    return h.includes("vimeos.net") || h.includes("streamwish") || h.includes("goodstream") || h.includes("waaw");
  } catch { return false; }
}

function IframePlayer({
  embedUrl, rawUrl, title, logoUrl, showCastModal, setShowCastModal, goBack,
}: {
  embedUrl: string; rawUrl: string; title: string; logoUrl: string;
  showCastModal: boolean; setShowCastModal: (v: boolean) => void; goBack: () => void;
}) {
  const [logoVisible, setLogoVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLogoVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black">
      <button
        onClick={goBack}
        className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/60 text-white hover:bg-[#7B2FBE] transition-colors"
      >
        ←
      </button>

      <button
        onClick={() => setShowCastModal(true)}
        className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-black/70 text-white hover:bg-[#7B2FBE] transition-colors border border-white/20 backdrop-blur-sm"
      >
        <Cast className="w-4 h-4" />
        <span className="text-xs font-bold hidden sm:inline">Enviar a TV</span>
      </button>

      <iframe
        key={embedUrl}
        src={embedUrl}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-fullscreen"
      />

      {/* Logo overlay — fades out after 4s */}
      {logoUrl && (
        <div
          className="absolute bottom-12 left-6 z-40 pointer-events-none transition-opacity duration-[1500ms]"
          style={{ opacity: logoVisible ? 1 : 0 }}
        >
          <img
            src={logoUrl}
            alt={title}
            className="max-h-12 max-w-[180px] object-contain drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]"
          />
        </div>
      )}

      {showCastModal && (
        <CastModal castUrl={rawUrl} title={title} onClose={() => setShowCastModal(false)} />
      )}
    </div>
  );
}

export default function Watch() {
  const [, params] = useRoute("/watch/:category/:id");
  const category = params?.category;
  const id = params?.id;
  const [selectedEpisode, setSelectedEpisode] = useState(0);
  const [showCastModal, setShowCastModal] = useState(false);
  const [showPremiumScreen, setShowPremiumScreen] = useState(false);
  const { addProgress, getProgress } = useWatchProgress();

  const { data: movie } = useGetMovie(id || "", {
    query: { enabled: category === "movie" && !!id, queryKey: getGetMovieQueryKey(id || ""), staleTime: Infinity, refetchInterval: false },
  });
  const { data: series } = useGetSeriesDetail(id || "", {
    query: { enabled: category === "serie" && !!id, queryKey: getGetSeriesDetailQueryKey(id || ""), staleTime: Infinity, refetchInterval: false },
  });
  const { data: anime } = useGetAnimeDetail(id || "", {
    query: { enabled: category === "anime" && !!id, queryKey: getGetAnimeDetailQueryKey(id || ""), staleTime: Infinity, refetchInterval: false },
  });

  let rawUrl = "";
  let title = "";
  let posterUrl = "";
  let backdropUrl = "";
  let logoUrl = "";
  let año = "";

  if (category === "movie" && movie) {
    rawUrl = movie.urlReproduccion || "";
    title = movie.titulo;
    posterUrl = movie.posterUrl || "";
    backdropUrl = movie.backdropUrl || "";
    logoUrl = movie.logoUrl || "";
    año = movie.año || "";
  } else if ((category === "serie" || category === "anime") && (series || anime)) {
    const d = category === "serie" ? series : anime;
    const ep = d?.episodes?.[selectedEpisode];
    rawUrl = ep?.urlReproduccion || d?.episodes?.[0]?.urlReproduccion || "";
    title = d?.series?.titulo || "";
    posterUrl = d?.series?.posterUrl || "";
    backdropUrl = d?.series?.backdropUrl || "";
    logoUrl = d?.series?.logoUrl || "";
    año = d?.series?.año || "";
  }

  const tmdbType = category === "movie" ? "movie" : "tv";
  const tmdbParams = { tmdbId: id || "", type: tmdbType as "movie" | "tv" };
  const { data: tmdb } = useGetTmdbDetails(tmdbParams, {
    query: { enabled: !!id, queryKey: getGetTmdbDetailsQueryKey(tmdbParams), staleTime: Infinity },
  });

  const effectiveLogoUrl = logoUrl || tmdb?.logoPath || "";

  // Save watch progress when content title is known
  useEffect(() => {
    if (!id || !title || !category) return;
    const existing = getProgress(id);
    addProgress({
      id: id,
      titulo: title,
      tipo: category as "movie" | "serie" | "anime",
      posterUrl: posterUrl || null,
      backdropUrl: backdropUrl || null,
      año: año,
      progress: existing?.progress ?? 0.05,
      episodio: selectedEpisode > 0 ? selectedEpisode + 1 : undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, title]);

  const shouldResolve = canExtract(rawUrl);

  const { data: resolved, isLoading: resolving, isError: resolveFailed } = useResolveVideo(
    { url: rawUrl },
    { query: { enabled: shouldResolve && !!rawUrl, queryKey: getResolveVideoQueryKey({ url: rawUrl }), staleTime: Infinity, refetchInterval: false } }
  );

  const episodes = category === "serie" ? series?.episodes : category === "anime" ? anime?.episodes : null;
  const episodeButtons = episodes?.map((ep, idx) => ({
    label: ep.episodio ? `E${ep.episodio}` : `Ep ${idx + 1}`,
    active: selectedEpisode === idx,
    onSelect: () => setSelectedEpisode(idx),
  }));

  const goBack = () => history.back();

  // Still loading data
  if (!rawUrl && (category === "movie" ? !movie : !(series || anime))) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[200]">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          <div className="absolute inset-0 rounded-full border-4 border-[#7B2FBE] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  // No URL at all
  if (!rawUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 z-[200] text-center px-8">
        <AlertCircle className="w-16 h-16 text-[#7B2FBE]" />
        <h2 className="text-white text-2xl font-bold">Sin URL de reproducción</h2>
        <button onClick={goBack} className="mt-2 px-6 py-2 bg-[#7B2FBE] text-white rounded font-bold">
          Volver
        </button>
      </div>
    );
  }

  // Native HLS player for vimeos.net and similar
  if (shouldResolve) {
    if (resolving) {
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-5 z-[200]">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
            <div className="absolute inset-0 rounded-full border-4 border-[#7B2FBE] border-t-transparent animate-spin" />
          </div>
          <p className="text-white/50 text-sm uppercase tracking-widest">Cargando reproductor</p>
        </div>
      );
    }

    if (resolveFailed || !resolved?.hlsUrl) {
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 z-[200] text-center px-8">
          <AlertCircle className="w-16 h-16 text-[#7B2FBE]" />
          <h2 className="text-white text-2xl font-bold">Contenido no disponible</h2>
          <p className="text-white/50">No se pudo cargar este video. Intenta más tarde.</p>
          <button onClick={goBack} className="mt-2 px-6 py-2 bg-[#7B2FBE] text-white rounded font-bold">
            Volver
          </button>
        </div>
      );
    }

    const proxiedHlsUrl = `/api/hls-proxy?url=${encodeURIComponent(resolved.hlsUrl)}`;

    // Show premium screen first, then video player
    if (showPremiumScreen) {
      return (
        <PremiumPlaybackScreen
          item={{
            id: id || "",
            titulo: title,
            posterUrl: posterUrl || null,
            backdropUrl: backdropUrl || null,
            categoria: category as "movie" | "serie" | "anime",
          }}
          onComplete={() => setShowPremiumScreen(false)}
        />
      );
    }

    return (
      <VideoPlayer
        hlsUrl={proxiedHlsUrl}
        castUrl={rawUrl}
        title={title}
        logoUrl={effectiveLogoUrl}
        onBack={goBack}
        episodes={episodeButtons}
      />
    );
  }

  // Fallback iframe for YouTube, ok.ru, etc.
  const embedUrl = toEmbedUrl(rawUrl);

  // Show premium screen for iframe videos too
  if (showPremiumScreen) {
    return (
      <PremiumPlaybackScreen
        item={{
          id: id || "",
          titulo: title,
          posterUrl: posterUrl || null,
          backdropUrl: backdropUrl || null,
          categoria: category as "movie" | "serie" | "anime",
        }}
        onComplete={() => setShowPremiumScreen(false)}
      />
    );
  }

  return (
    <IframePlayer
      embedUrl={embedUrl}
      rawUrl={rawUrl}
      title={title}
      logoUrl={effectiveLogoUrl}
      showCastModal={showCastModal}
      setShowCastModal={setShowCastModal}
      goBack={goBack}
    />
  );
}
