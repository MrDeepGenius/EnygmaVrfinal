import { useRoute, Link, useLocation } from "wouter";
import {
  Play, Plus, Check, Film, ChevronLeft,
} from "lucide-react";
import { RatingButton } from "@/components/rating-button";
import { useGetMovie, getGetMovieQueryKey, useGetTmdbDetails, getGetTmdbDetailsQueryKey, useListMovies } from "@workspace/api-client-react";
import { ActorModal } from "@/components/actor-modal";
import { TrailerModal } from "@/components/trailer-modal";
import { StreamingPlatforms } from "@/components/streaming-platforms";
import { ReportButton } from "@/components/report-button";
import { useState, useMemo, useEffect } from "react";
import { useFavorites } from "@/lib/use-favorites";

const LANG_NAMES: Record<string, string> = {
  en: "Inglés", es: "Español", fr: "Francés", de: "Alemán",
  it: "Italiano", pt: "Portugués", ja: "Japonés", ko: "Coreano",
  zh: "Chino", ru: "Ruso", ar: "Árabe", hi: "Hindi",
};

function formatRuntime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export default function MovieDetail() {
  const [, params] = useRoute("/detail/movie/:id");
  const id = params?.id;
  const isTmdbId = id?.startsWith("tmdb_movie_");
  const [fallbackSearched, setFallbackSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"similar" | "info">("similar");

  const { data: movie, isLoading } = useGetMovie(id || "", {
    query: { enabled: !!id && !isTmdbId, queryKey: getGetMovieQueryKey(id || "") },
  });

  const shouldSearchByTitle = !isTmdbId && !movie && id && !fallbackSearched && !isLoading;

  const { data: tmdb } = useGetTmdbDetails(
    { tmdbId: isTmdbId ? id?.replace("tmdb_movie_", "") || "" : id || "", type: "movie" },
    { query: { enabled: !!id, queryKey: getGetTmdbDetailsQueryKey({ tmdbId: isTmdbId ? id?.replace("tmdb_movie_", "") || "" : id || "", type: "movie" }) } }
  );

  const [, setLocation] = useLocation();

  // Auto-redirect when found by title search (no user action needed)
  useEffect(() => {
    if (searchResults.length > 0 && !movie && !isLoading) {
      const timer = setTimeout(() => {
        setLocation(`/detail/movie/${searchResults[0].id}`);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [searchResults, movie, isLoading]);

  const { toggle, isFavorite } = useFavorites();
  const [selectedActorId, setSelectedActorId] = useState<number | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const trailerVideo = tmdb?.videos?.[0] ?? null;

  useEffect(() => {
    if (shouldSearchByTitle && tmdb?.title && !fallbackSearched) {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      fetch(`${BASE}/api/content/search?q=${encodeURIComponent(tmdb.title)}&limit=5`)
        .then(r => r.json())
        .then(data => {
          const movies = data.movies || [];
          if (movies.length > 0) setSearchResults(movies);
          setFallbackSearched(true);
        })
        .catch(() => setFallbackSearched(true));
    }
  }, [shouldSearchByTitle, tmdb?.title, fallbackSearched]);

  const firstGenre = movie?.genero?.split(",")[0]?.trim() || undefined;
  const { data: similarData } = useListMovies(
    { genre: firstGenre, limit: 20 },
    { query: { enabled: !!firstGenre, queryKey: ["listMovies", firstGenre] } }
  );
  const similarMovies = useMemo(
    () => (similarData?.items || []).filter((m) => m.id !== id).slice(0, 12),
    [similarData, id]
  );

  // ── Loading ──
  if (isLoading && !isTmdbId) {
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

  // ── Coming Soon (TMDB ID not in catalog, and finished loading) ──
  if (!isLoading && (isTmdbId || (!movie && searchResults.length === 0 && fallbackSearched))) {
    return (
      <div className="bg-black min-h-screen flex flex-col">
        <div className="relative">
          {tmdb?.backdropPath && (
            <img src={tmdb.backdropPath} alt={tmdb?.title || ""} className="w-full h-[45vh] object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <Link href="/movies" className="absolute top-4 left-4 text-white bg-black/40 p-2 rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-8 text-center">
          <h1 className="text-3xl font-bold text-white">{tmdb?.title || "Película"}</h1>
          <div className="flex items-center gap-2 text-[#7B2FBE]">
            <div className="w-5 h-5 border-2 border-[#7B2FBE] border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold text-sm">Próximamente en ENYGMA</span>
          </div>
          {tmdb?.overview && <p className="text-white/50 text-sm line-clamp-3">{tmdb.overview}</p>}
          <Link href="/">
            <button className="mt-2 px-6 py-3 bg-white text-black font-bold rounded-lg text-sm">
              Volver al Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Redirect if found by title search ──
  if (searchResults.length > 0 && !movie) {
    const firstMatch = searchResults[0];
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-bold text-white">Redireccionando...</h1>
        <p className="text-white/60 text-sm">Encontramos "{firstMatch.titulo}"</p>
        <Link href={`/detail/movie/${firstMatch.id}`}>
          <button className="px-6 py-3 bg-white text-black font-bold rounded-lg text-sm">Abrir Película</button>
        </Link>
      </div>
    );
  }

  if (!movie) return null;

  const favorited = isFavorite(movie.id);
  const cast = tmdb?.cast || [];
  const genres = tmdb?.genres?.length
    ? tmdb.genres.map((g) => (typeof g === "string" ? g : String(g)))
    : (movie.genero?.split(",").map((g) => g.trim()) || []);
  const score = movie.valoracion ? parseFloat(movie.valoracion) : tmdb?.voteAverage ?? null;
  const year = movie.año || (tmdb?.releaseDate ? tmdb.releaseDate.split("-")[0] : null);
  const watchProviders = (tmdb?.watchProviders as any[]) || [];

  const spokenLangs = tmdb?.spokenLanguages ?? [];
  const originalLang = tmdb?.originalLanguage
    ? (LANG_NAMES[tmdb.originalLanguage] || tmdb.originalLanguage.toUpperCase())
    : null;

  const cast_names = cast.slice(0, 8).map(c => c.name).join(", ");
  const producers = tmdb ? [] : []; // Not available from current API

  return (
    <div className="bg-black min-h-screen text-white">

      {/* ── HERO ── */}
      <div className="relative w-full">
        {/* Backdrop */}
        <div className="relative w-full" style={{ height: "56vw", maxHeight: "420px", minHeight: "260px" }}>
          {movie.backdropUrl ? (
            <img
              src={movie.backdropUrl}
              alt={movie.titulo}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />

          {/* Top navigation */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-3 z-10">
            <Link href="/movies">
              <button className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              {movie && <ReportButton item={movie} type="movie" />}
            </div>
          </div>
        </div>

        {/* Title + meta — below the image, overlapping via negative margin */}
        <div className="px-4 pt-3 pb-1">
          {/* Logo or Title */}
          {movie.logoUrl ? (
            <img
              src={movie.logoUrl}
              alt={movie.titulo}
              className="max-h-14 max-w-[200px] object-contain object-left mb-2 drop-shadow-lg"
            />
          ) : (
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight leading-tight mb-2 drop-shadow-lg">
              {movie.titulo}
            </h1>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 text-[13px] text-white/65 font-medium mb-1">
            {tmdb?.contentRating && (
              <span className="border border-white/40 text-white/70 px-1.5 py-0.5 rounded text-[11px] font-bold">{tmdb.contentRating}</span>
            )}
            {tmdb?.runtime && (
              <span>{formatRuntime(tmdb.runtime)}</span>
            )}
            {year && <span>{year}</span>}
            {score !== null && (
              <span className="text-yellow-400 font-bold">★ {typeof score === "number" ? score.toFixed(1) : score}</span>
            )}
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <p className="text-[12px] text-white/45 mb-3">{genres.slice(0, 3).join(" · ")}</p>
          )}
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <div className="px-4 pb-4 space-y-2">
        {/* Ver ahora */}
        <Link href={`/watch/movie/${movie.id}`} className="block">
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-white/90 text-black font-bold rounded-md text-[15px] transition-colors">
            <Play className="w-5 h-5 fill-black" />
            Ver ahora
          </button>
        </Link>

        {/* Icon actions row */}
        <div className="flex items-start justify-around pt-2">
          <button
            onClick={() => toggle({
              id: movie.id, titulo: movie.titulo, tipo: "movie",
              posterUrl: movie.posterUrl ?? null, backdropUrl: movie.backdropUrl ?? null,
              año: movie.año ?? "", categoria: "movie",
            })}
            className="flex flex-col items-center gap-1.5"
          >
            {favorited
              ? <Check className="w-6 h-6 text-white" />
              : <Plus className="w-6 h-6 text-white" />
            }
            <span className="text-[11px] text-white/55">{favorited ? "En mi lista" : "Mi lista"}</span>
          </button>

          <RatingButton id={movie.id} />

          {trailerVideo ? (
            <button
              onClick={() => setTrailerKey(trailerVideo.key)}
              className="flex flex-col items-center gap-1.5"
            >
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
      {movie.sinopsis && (
        <div className="px-4 pb-3">
          <p className="text-[13px] text-white/80 leading-relaxed">{movie.sinopsis}</p>
        </div>
      )}

      {/* ── DISPONIBLE EN ── */}
      {watchProviders.length > 0 && (
        <div className="px-4 pb-4">
          <StreamingPlatforms providers={watchProviders} />
        </div>
      )}

      {/* ── CAST strip ── */}
      {cast.length > 0 && (
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

      {/* ── TABS ── */}
      <div className="border-b border-white/10">
        <div className="flex">
          <button
            onClick={() => setActiveTab("similar")}
            className={`flex-1 py-3 text-[13px] font-semibold transition-colors border-b-2 ${activeTab === "similar" ? "border-white text-white" : "border-transparent text-white/45"}`}
          >
            Quizá también te guste
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 text-[13px] font-semibold transition-colors border-b-2 ${activeTab === "info" ? "border-white text-white" : "border-transparent text-white/45"}`}
          >
            Información
          </button>
        </div>
      </div>

      {/* ── TAB: SIMILAR ── */}
      {activeTab === "similar" && (
        <div className="p-4">
          {similarMovies.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {similarMovies.map((m) => (
                <Link key={m.id} href={`/detail/movie/${m.id}`} className="group">
                  <div className="relative aspect-[16/9] rounded-md overflow-hidden bg-zinc-900">
                    {m.posterUrl ? (
                      <img src={m.posterUrl} alt={m.titulo} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 text-center">
                        <span className="text-xs text-white/30">{m.titulo}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] text-white/70 mt-1.5 font-medium line-clamp-2 leading-tight">{m.titulo}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-8">Sin recomendaciones disponibles</p>
          )}
        </div>
      )}

      {/* ── TAB: INFORMACIÓN ── */}
      {activeTab === "info" && (
        <div className="p-4 space-y-6">

          {/* Clasificación */}
          {tmdb?.contentRating && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Información de la clasificación</h3>
              <p className="text-[14px] text-white/65">{tmdb.contentRating}</p>
            </div>
          )}

          {/* Idioma subtítulos */}
          {spokenLangs.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Idioma de los subtítulos</h3>
              <p className="text-[14px] text-white/65">Español (América latina), Inglés, Portugués (Brasil)</p>
            </div>
          )}

          {/* Idioma audio */}
          {spokenLangs.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Idioma del audio</h3>
              <p className="text-[14px] text-white/65">
                {spokenLangs.slice(0, 4).join(", ")}
                {originalLang && ` · ${originalLang} - Original`}
              </p>
            </div>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Protagonizado por</h3>
              <p className="text-[14px] text-white/65">{cast_names}</p>
            </div>
          )}
          {movie?.actores && cast.length === 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Protagonizado por</h3>
              <p className="text-[14px] text-white/65">{movie.actores}</p>
            </div>
          )}

          {/* Director */}
          {tmdb?.director && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Director</h3>
              <p className="text-[14px] text-white/65">{tmdb.director}</p>
            </div>
          )}

          {/* Guionistas */}
          {tmdb?.writers && tmdb.writers.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Guionistas</h3>
              <p className="text-[14px] text-white/65">{tmdb.writers.join(", ")}</p>
            </div>
          )}

          {/* Géneros */}
          {genres.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Géneros</h3>
              <p className="text-[14px] text-white/65">{genres.join(", ")}</p>
            </div>
          )}

          {/* Países */}
          {tmdb?.productionCountries && tmdb.productionCountries.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">País de producción</h3>
              <p className="text-[14px] text-white/65">{tmdb.productionCountries.join(", ")}</p>
            </div>
          )}

          {/* Estado / tagline */}
          {tmdb?.tagline && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">Tagline</h3>
              <p className="text-[14px] text-white/65 italic">"{tmdb.tagline}"</p>
            </div>
          )}

          {/* IMDb */}
          {tmdb?.imdbId && (
            <div>
              <h3 className="text-[15px] font-bold text-white mb-1">IMDb</h3>
              <a
                href={`https://www.imdb.com/title/${tmdb.imdbId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 text-[14px] underline"
              >
                {tmdb.imdbId}
              </a>
            </div>
          )}
        </div>
      )}

      <div className="h-8" />

      <ActorModal personId={selectedActorId} onClose={() => setSelectedActorId(null)} />
      <TrailerModal videoKey={trailerKey} onClose={() => setTrailerKey(null)} />
    </div>
  );
}
