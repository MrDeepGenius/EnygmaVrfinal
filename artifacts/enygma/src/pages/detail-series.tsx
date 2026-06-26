import { useRoute, Link, useLocation } from "wouter";
import { Play, Plus, Check, Film, ChevronLeft, MoreVertical, ChevronDown } from "lucide-react";
import { RatingButton } from "@/components/rating-button";
import { useState, useMemo, useEffect } from "react";
import {
  useGetSeriesDetail, getGetSeriesDetailQueryKey,
  useGetAnimeDetail, getGetAnimeDetailQueryKey,
  useGetTmdbDetails, getGetTmdbDetailsQueryKey,
  useListSeries, useListAnime,
} from "@workspace/api-client-react";
import { ActorModal } from "@/components/actor-modal";
import { TrailerModal } from "@/components/trailer-modal";
import { StreamingPlatforms } from "@/components/streaming-platforms";
import { ReportButton } from "@/components/report-button";
import { useFavorites } from "@/lib/use-favorites";
import { AdBannerSlot } from "@/components/ad-banner";
import { PrePlayer } from "@/components/pre-player";

const LANG_NAMES: Record<string, string> = {
  en: "Inglés", es: "Español", fr: "Francés", de: "Alemán",
  it: "Italiano", pt: "Portugués", ja: "Japonés", ko: "Coreano",
  zh: "Chino", ru: "Ruso", ar: "Árabe", hi: "Hindi",
};

type Tab = "episodes" | "similar" | "extras" | "info";

export default function SeriesDetail() {
  const [, params] = useRoute("/detail/:type/:id");
  const type = params?.type;
  const id = params?.id;

  const [activeSeason, setActiveSeason] = useState<string>("1");
  const [activeTab, setActiveTab] = useState<Tab>("episodes");
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [fallbackSearched, setFallbackSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [prePlayerHref, setPrePlayerHref] = useState<string | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  const { data: seriesData, isLoading: seriesLoading } = useGetSeriesDetail(id || "", {
    query: { enabled: !!id && type === "serie", queryKey: getGetSeriesDetailQueryKey(id || "") },
  });
  const { data: animeData, isLoading: animeLoading } = useGetAnimeDetail(id || "", {
    query: { enabled: !!id && type === "anime", queryKey: getGetAnimeDetailQueryKey(id || "") },
  });

  const data = type === "serie" ? seriesData : animeData;
  const isLoading = type === "serie" ? seriesLoading : animeLoading;
  const shouldSearchByTitle = !data && id && !fallbackSearched && !isLoading;

  const { data: tmdb } = useGetTmdbDetails(
    { tmdbId: id || "", type: "tv" },
    { query: { enabled: !!id, queryKey: getGetTmdbDetailsQueryKey({ tmdbId: id || "", type: "tv" }) } }
  );

  useEffect(() => {
    if (shouldSearchByTitle && tmdb?.title && !fallbackSearched) {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      fetch(`${BASE}/api/content/search?q=${encodeURIComponent(tmdb.title)}&limit=5`)
        .then(r => r.json())
        .then(d => {
          const results = type === "serie" ? d.series || [] : d.anime || [];
          if (results.length > 0) setSearchResults(results);
          setFallbackSearched(true);
        })
        .catch(() => setFallbackSearched(true));
    }
  }, [shouldSearchByTitle, tmdb?.title, fallbackSearched, type]);

  const [, setLocation] = useLocation();

  // Auto-redirect when found by title search
  useEffect(() => {
    if (searchResults.length > 0 && !data && !isLoading) {
      const timer = setTimeout(() => {
        setLocation(`/detail/${type}/${searchResults[0].id}`);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [searchResults, data, isLoading, type]);

  const { toggle, isFavorite } = useFavorites();
  const [selectedActorId, setSelectedActorId] = useState<number | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  const { data: similarSeriesData } = useListSeries(
    { limit: 20 },
    { query: { enabled: type === "serie", queryKey: ["listSeries", "similar"] } }
  );
  const { data: similarAnimeData } = useListAnime(
    { limit: 20 },
    { query: { enabled: type === "anime", queryKey: ["listAnime", "similar"] } }
  );

  const similarItems = useMemo(() => {
    const raw = type === "anime"
      ? (similarAnimeData?.items || [])
      : (similarSeriesData?.items || []);
    return raw.filter((s) => s.id !== id).slice(0, 12);
  }, [similarSeriesData, similarAnimeData, type, id]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="bg-black min-h-screen">
        <div className="w-full h-[55vh] bg-zinc-900 animate-pulse" />
        <div className="px-4 py-6 space-y-4">
          <div className="h-8 w-2/3 bg-zinc-800 animate-pulse rounded" />
          <div className="h-24 bg-zinc-800 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // ── Coming Soon ──
  if (!data && !isLoading && fallbackSearched) {
    if (searchResults.length === 0) {
      return (
        <div className="bg-black min-h-screen flex flex-col">
          <div className="relative">
            {tmdb?.backdropPath && (
              <img src={tmdb.backdropPath} alt={tmdb?.title || ""} className="w-full h-[45vh] object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <Link href={type === "anime" ? "/anime" : "/series"} className="absolute top-4 left-4 text-white bg-black/40 p-2 rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-8 text-center">
            <h1 className="text-3xl font-bold text-white">{tmdb?.title || "Serie"}</h1>
            <div className="flex items-center gap-2 text-[#7B2FBE]">
              <div className="w-5 h-5 border-2 border-[#7B2FBE] border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold text-sm">Próximamente en ENYGMA</span>
            </div>
            {tmdb?.overview && <p className="text-white/50 text-sm line-clamp-3">{tmdb.overview}</p>}
            <Link href="/"><button className="mt-2 px-6 py-3 bg-white text-black font-bold rounded-lg text-sm">Volver al Home</button></Link>
          </div>
        </div>
      );
    }
    const firstMatch = searchResults[0];
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-bold text-white">Redireccionando...</h1>
        <p className="text-white/60 text-sm">Encontramos "{firstMatch.titulo}"</p>
        <Link href={`/detail/${type}/${firstMatch.id}`}>
          <button className="px-6 py-3 bg-white text-black font-bold rounded-lg text-sm">Abrir {type === "serie" ? "Serie" : "Anime"}</button>
        </Link>
      </div>
    );
  }

  const { series, episodes } = data;
  const favorited = isFavorite(series.id);
  const cast = tmdb?.cast || [];
  const trailerVideo = tmdb?.videos?.[0] ?? null;
  const allVideos = tmdb?.videos || [];
  const watchProviders = (tmdb?.watchProviders as any[]) || [];

  const seasons = Array.from(new Set(episodes.map((e) => e.temporada || "1"))).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );
  if (seasons.length > 0 && !seasons.includes(activeSeason)) {
    setActiveSeason(seasons[0]);
  }

  const seasonEpisodes = episodes
    .filter((e) => (e.temporada || "1") === activeSeason)
    .sort((a, b) => parseInt(a.episodio || "0") - parseInt(b.episodio || "0"));

  const genres = tmdb?.genres?.length
    ? tmdb.genres.map((g) => (typeof g === "string" ? g : String(g)))
    : (series.genero?.split(",").map((g) => g.trim()).filter(Boolean) || []);

  const totalSeasons = tmdb?.numberOfSeasons || series.totalSeasons || seasons.length;
  const year = series.año || (tmdb?.releaseDate ? tmdb.releaseDate.split("-")[0] : null);
  const spokenLangs = tmdb?.spokenLanguages ?? [];
  const originalLang = tmdb?.originalLanguage
    ? (LANG_NAMES[tmdb.originalLanguage] || tmdb.originalLanguage.toUpperCase())
    : null;
  const backHref = type === "anime" ? "/anime" : "/series";

  const firstEp = seasonEpisodes[0];

  return (
    <div className="bg-black min-h-screen text-white">

      {/* Pre-player overlay */}
      {prePlayerHref && (
        <PrePlayer href={prePlayerHref} onCancel={() => setPrePlayerHref(null)} />
      )}

      {/* ── HERO ── */}
      <div className="relative w-full">
        <div className="relative w-full" style={{ height: "56vw", maxHeight: "420px", minHeight: "260px" }}>
          {series.backdropUrl ? (
            <img src={series.backdropUrl} alt={series.titulo} className="absolute inset-0 w-full h-full object-cover object-top" />
          ) : (
            <div className="absolute inset-0 bg-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />

          {/* Top nav */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-3 z-10">
            <Link href={backHref}>
              <button className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              {(seriesData || animeData) && (
                <ReportButton item={(seriesData || animeData) as any} type={type as "serie" | "anime"} />
              )}
            </div>
          </div>
        </div>

        {/* Title + meta */}
        <div className="px-4 pt-3 pb-1">
          {series.logoUrl ? (
            <img src={series.logoUrl} alt={series.titulo} className="max-h-14 max-w-[200px] object-contain object-left mb-2 drop-shadow-lg" />
          ) : (
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight leading-tight mb-2">
              {series.titulo}
            </h1>
          )}

          {/* Tagline */}
          {tmdb?.tagline && (
            <p className="text-[12px] text-white/50 mb-1 italic">{tmdb.tagline}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 text-[13px] text-white/65 font-medium mb-1 flex-wrap">
            {tmdb?.contentRating && (
              <span className="border border-white/40 text-white/70 px-1.5 py-0.5 rounded text-[11px] font-bold">{tmdb.contentRating}</span>
            )}
            {totalSeasons > 0 && (
              <span>{totalSeasons} {totalSeasons === 1 ? "temporada" : "temporadas"}</span>
            )}
            {year && <span>{year}</span>}
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <p className="text-[12px] text-white/45 mb-3">{genres.slice(0, 3).join(" · ")}</p>
          )}
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <div className="px-4 pb-4 space-y-2">
        {/* Ver T1 E1 */}
        <button
          onClick={() => setPrePlayerHref(`/watch/${type}/${series.id}`)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-white/90 text-black font-bold rounded-md text-[15px] transition-colors"
        >
          <Play className="w-5 h-5 fill-black" />
          {firstEp ? `Ver T${activeSeason} E${firstEp.episodio || "1"}` : "Ver ahora"}
        </button>

        {/* Icon actions */}
        <div className="flex items-start justify-around pt-2">
          <button
            onClick={() => toggle({
              id: series.id, titulo: series.titulo, tipo: type as "serie" | "anime",
              posterUrl: series.posterUrl ?? null, backdropUrl: series.backdropUrl ?? null,
              año: series.año ?? "", categoria: type as "serie" | "anime",
            })}
            className="flex flex-col items-center gap-1.5"
          >
            {favorited ? <Check className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
            <span className="text-[11px] text-white/55">{favorited ? "En mi lista" : "Mi lista"}</span>
          </button>

          <RatingButton id={series.id} />

          {trailerVideo ? (
            <button onClick={() => setTrailerKey(trailerVideo.key)} className="flex flex-col items-center gap-1.5">
              <Film className="w-6 h-6 text-white" />
              <span className="text-[11px] text-white/55">Tráiler</span>
            </button>
          ) : (
            <button className="flex flex-col items-center gap-1.5 opacity-40" disabled>
              <Film className="w-6 h-6 text-white" />
              <span className="text-[11px] text-white/55">Tráiler</span>
            </button>
          )}
        </div>
      </div>

      {/* ── SYNOPSIS ── */}
      {series.sinopsis && (
        <div className="px-4 pb-3">
          <p className="text-[13px] text-white/80 leading-relaxed">{series.sinopsis}</p>
        </div>
      )}

      {/* ── BANNER ── */}
      <AdBannerSlot variant="rect" className="px-4 pb-2" />

      {/* ── DISPONIBLE EN ── */}
      {watchProviders.length > 0 && (
        <div className="px-4 pb-4">
          <StreamingPlatforms providers={watchProviders} />
        </div>
      )}

      {/* ── TABS ── */}
      <div className="border-b border-white/10 overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max">
          {[
            { key: "episodes" as Tab, label: "Episodios" },
            { key: "similar" as Tab, label: "Quizá también te guste" },
            { key: "extras" as Tab, label: "Extras" },
            { key: "info" as Tab, label: "Información" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.key ? "border-white text-white" : "border-transparent text-white/45"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: EPISODIOS ── */}
      {activeTab === "episodes" && (
        <div className="p-4">
          {/* Season selector */}
          {seasons.length > 1 && (
            <div className="relative mb-4">
              <button
                onClick={() => setSeasonOpen(!seasonOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg text-[14px] font-semibold text-white"
              >
                <span>Temporada {activeSeason}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${seasonOpen ? "rotate-180" : ""}`} />
              </button>
              {seasonOpen && (
                <div className="absolute top-full left-0 right-0 z-20 bg-zinc-800 rounded-lg overflow-hidden shadow-2xl mt-1">
                  {seasons.map(s => (
                    <button
                      key={s}
                      onClick={() => { setActiveSeason(s); setSeasonOpen(false); }}
                      className={`w-full px-4 py-3 text-left text-[14px] font-medium transition-colors ${
                        activeSeason === s ? "text-white bg-zinc-700" : "text-white/60 hover:bg-zinc-700/50"
                      }`}
                    >
                      Temporada {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Episode list */}
          <div className="space-y-4">
            {seasonEpisodes.map((ep, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex gap-3 items-start">
                  {/* Thumbnail */}
                  <Link href={`/watch/${type}/${series.id}`} className="flex-shrink-0 relative">
                    <div className="w-[120px] aspect-video rounded-md overflow-hidden bg-zinc-900 flex items-center justify-center">
                      {series.backdropUrl ? (
                        <img src={series.backdropUrl} alt={ep.tituloEpisodio || `E${ep.episodio}`} className="w-full h-full object-cover" loading="lazy" />
                      ) : series.posterUrl ? (
                        <img src={series.posterUrl} alt={ep.tituloEpisodio || `E${ep.episodio}`} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white leading-tight">
                          {ep.episodio}. {ep.tituloEpisodio || `Episodio ${ep.episodio}`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {tmdb?.contentRating && (
                            <span className="text-[10px] border border-white/30 text-white/50 px-1 rounded">{tmdb.contentRating}</span>
                          )}
                          {tmdb?.runtime && (
                            <span className="text-[11px] text-white/45">{tmdb.runtime}min</span>
                          )}
                          {ep.temporada && year && (
                            <span className="text-[11px] text-white/45">{year}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button className="text-white/40 hover:text-white transition-colors p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {series.sinopsis && (
                  <p className="text-[12px] text-white/50 mt-2 line-clamp-2 leading-relaxed">
                    {series.sinopsis}
                  </p>
                )}
              </div>
            ))}

            {seasonEpisodes.length === 0 && (
              <p className="text-white/30 text-sm text-center py-8">No hay episodios para esta temporada.</p>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: SIMILAR ── */}
      {activeTab === "similar" && (
        <div className="p-4">
          {similarItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {similarItems.map((s) => (
                <Link key={s.id} href={`/detail/${type}/${s.id}`} className="group">
                  <div className="relative aspect-[16/9] rounded-md overflow-hidden bg-zinc-900">
                    {s.posterUrl ? (
                      <img src={s.posterUrl} alt={s.titulo} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 text-center">
                        <span className="text-xs text-white/30">{s.titulo}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] text-white/70 mt-1.5 font-medium line-clamp-2 leading-tight">{s.titulo}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-8">Sin recomendaciones disponibles</p>
          )}
        </div>
      )}

      {/* ── TAB: EXTRAS (trailers) ── */}
      {activeTab === "extras" && (
        <div className="p-4">
          {allVideos.length > 0 ? (
            <div className="space-y-4">
              {allVideos.map((v: any, i: number) => (
                <div key={i} className="flex gap-3 items-center">
                  <button
                    onClick={() => setTrailerKey(v.key)}
                    className="relative flex-shrink-0 w-[120px] aspect-video rounded-md overflow-hidden bg-zinc-900"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`}
                      alt={v.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="w-6 h-6 fill-white text-white" />
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white leading-tight line-clamp-2">{v.name}</p>
                    {tmdb?.contentRating && (
                      <span className="text-[10px] border border-white/30 text-white/40 px-1 rounded mt-1 inline-block">{tmdb.contentRating}</span>
                    )}
                    <p className="text-[11px] text-white/40 mt-0.5">{series.titulo}</p>
                  </div>
                  <button className="text-white/40 hover:text-white p-1 flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-8">No hay extras disponibles</p>
          )}
        </div>
      )}

      {/* ── TAB: INFORMACIÓN ── */}
      {activeTab === "info" && (
        <div className="p-4 space-y-6">
          {tmdb?.contentRating && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Información de la clasificación</h3>
              <p className="text-[14px] text-white/65">{tmdb.contentRating}</p>
            </div>
          )}

          {spokenLangs.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Idioma de los subtítulos</h3>
              <p className="text-[14px] text-white/65">Español (América latina), Inglés, Portugués (Brasil)</p>
            </div>
          )}

          {spokenLangs.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Idioma del audio</h3>
              <p className="text-[14px] text-white/65">
                {spokenLangs.slice(0, 4).join(", ")}
                {originalLang && ` · ${originalLang} - Original`}
              </p>
            </div>
          )}

          {cast.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Protagonizado por</h3>
              <p className="text-[14px] text-white/65">{cast.slice(0, 8).map(c => c.name).join(", ")}</p>
            </div>
          )}

          {tmdb?.createdBy && tmdb.createdBy.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Creado por</h3>
              <p className="text-[14px] text-white/65">{tmdb.createdBy.join(", ")}</p>
            </div>
          )}

          {tmdb?.director && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Director</h3>
              <p className="text-[14px] text-white/65">{tmdb.director}</p>
            </div>
          )}

          {tmdb?.writers && tmdb.writers.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Guionistas</h3>
              <p className="text-[14px] text-white/65">{tmdb.writers.join(", ")}</p>
            </div>
          )}

          {tmdb?.networks && tmdb.networks.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Cadena</h3>
              <div className="flex items-center gap-3 flex-wrap mt-1">
                {tmdb.networks.map((n, i) =>
                  n.logoPath ? (
                    <img key={i} src={n.logoPath} alt={n.name} className="h-6 object-contain opacity-70" />
                  ) : (
                    <span key={i} className="text-[14px] text-white/65">{n.name}</span>
                  )
                )}
              </div>
            </div>
          )}

          {tmdb?.numberOfSeasons && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Temporadas</h3>
              <p className="text-[14px] text-white/65">
                {tmdb.numberOfSeasons} temporadas{tmdb.numberOfEpisodes ? ` · ${tmdb.numberOfEpisodes} episodios` : ""}
              </p>
            </div>
          )}

          {genres.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Géneros</h3>
              <p className="text-[14px] text-white/65">{genres.join(", ")}</p>
            </div>
          )}

          {tmdb?.productionCountries && tmdb.productionCountries.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">País de producción</h3>
              <p className="text-[14px] text-white/65">{tmdb.productionCountries.join(", ")}</p>
            </div>
          )}

          {tmdb?.status && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Estado</h3>
              <p className={`text-[14px] font-semibold ${
                tmdb.status === "Ended" || tmdb.status === "Canceled" ? "text-red-400" : "text-green-400"
              }`}>
                {tmdb.status === "Returning Series" ? "En emisión"
                  : tmdb.status === "Ended" ? "Finalizada"
                  : tmdb.status === "Canceled" ? "Cancelada"
                  : tmdb.status}
              </p>
            </div>
          )}

          {tmdb?.imdbId && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">IMDb</h3>
              <a href={`https://www.imdb.com/title/${tmdb.imdbId}`} target="_blank" rel="noopener noreferrer" className="text-yellow-400 text-[14px] underline">
                {tmdb.imdbId}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Cast strip — shown in episodes tab */}
      {activeTab === "episodes" && cast.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {cast.slice(0, 10).map((actor, i) => (
              <button
                key={i}
                onClick={() => actor.personId ? setSelectedActorId(actor.personId) : undefined}
                className="flex-shrink-0 flex flex-col items-center gap-1 w-16"
              >
                {actor.profilePath ? (
                  <img src={actor.profilePath} alt={actor.name} className="w-14 h-14 rounded-full object-cover ring-1 ring-white/15" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-white/40 text-lg font-bold">
                    {actor.name.charAt(0)}
                  </div>
                )}
                <p className="text-[10px] text-white/60 text-center line-clamp-2 leading-tight">{actor.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-8" />

      <ActorModal personId={selectedActorId} onClose={() => setSelectedActorId(null)} />
      <TrailerModal videoKey={trailerKey} onClose={() => setTrailerKey(null)} />
    </div>
  );
}
