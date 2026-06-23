import { useState, useEffect, useMemo } from "react";
import { useSearchContent, getSearchContentQueryKey, useListMovies } from "@workspace/api-client-react";
import { useProfile } from "@/lib/profile-context";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, X, ArrowLeft, Flame, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { PosterCard } from "@/components/poster-card";
import { Layout } from "@/components/layout";

const RECENT_SEARCHES_KEY = "enygma_recent_searches";

interface SearchResult {
  id: string;
  titulo: string;
  año?: string;
  posterUrl?: string;
  tipo: "movie" | "serie" | "anime";
}

export default function Search() {
  const { profile } = useProfile();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  // Fetch current results
  const { data: searchResults, isLoading } = useSearchContent(
    { q: debouncedQuery, profile: profile || undefined, limit: 50 },
    { query: { enabled: debouncedQuery.length > 1, queryKey: getSearchContentQueryKey({ q: debouncedQuery, profile: profile || undefined, limit: 50 }) } }
  );

  // Fetch trending (popular movies)
  const { data: moviesData } = useListMovies({ limit: 20, profile: profile || undefined });

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 10));
      }
    } catch (e) {
      console.error("Error loading recent searches:", e);
    }
  }, []);

  // Save search to recent
  const saveSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    try {
      let updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving search:", e);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error("Error clearing searches:", e);
    }
  };

  const removeRecentSearch = (searchTerm: string) => {
    const updated = recentSearches.filter(s => s !== searchTerm);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Error removing search:", e);
    }
  };

  // Get trending items (popular movies)
  const trendingItems = useMemo(() => {
    return (moviesData?.items || []).slice(0, 10).map(m => ({
      id: m.id,
      titulo: m.titulo,
      año: m.año,
      posterUrl: m.posterUrl,
      tipo: "movie" as const
    }));
  }, [moviesData]);

  // Combine all results
  const allResults = useMemo(() => {
    if (!searchResults) return [];
    const combined: SearchResult[] = [
      ...(searchResults.movies || []).map(m => ({ ...m, tipo: "movie" as const })),
      ...(searchResults.series || []).map(s => ({ ...s, tipo: "serie" as const })),
      ...(searchResults.anime || []).map(a => ({ ...a, tipo: "anime" as const }))
    ];
    return combined;
  }, [searchResults]);

  const handleSearchItemClick = (item: SearchResult) => {
    saveSearch(query);
    const type = item.tipo === "movie" ? "movie" : item.tipo;
    if (item.tipo === "movie") {
      setLocation(`/detail/movie/${item.id}`);
    } else {
      setLocation(`/detail/${item.tipo}/${item.id}`);
    }
  };

  const handleRecentClick = (searchTerm: string) => {
    setQuery(searchTerm);
  };

  const handleTrendingClick = (item: SearchResult) => {
    if (item.tipo === "movie") {
      setLocation(`/detail/movie/${item.id}`);
    } else {
      setLocation(`/detail/${item.tipo}/${item.id}`);
    }
  };

  const showResults = debouncedQuery.length > 1;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black">
        {/* Sticky Search Bar */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 py-4">
          <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <button
                onClick={() => setLocation("/home")}
                className="flex-shrink-0 p-2.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Search Input */}
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Películas, series, anime..."
                  className="w-full pl-11 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#7B2FBE] focus:ring-1 focus:ring-[#7B2FBE]/50 transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          {/* Show Results */}
          {showResults ? (
            <>
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-3 border-[#7B2FBE] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : allResults.length > 0 ? (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-white/60 text-sm font-semibold mb-4 uppercase tracking-wider">
                      {allResults.length} Resultados para "{query}"
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                      {allResults.map((item) => (
                        <button
                          key={`${item.tipo}-${item.id}`}
                          onClick={() => handleSearchItemClick(item)}
                          className="group cursor-pointer transform transition-all duration-200 hover:scale-105 focus:outline-none"
                        >
                          <div className="relative overflow-hidden rounded-lg mb-2">
                            {item.posterUrl ? (
                              <img
                                src={item.posterUrl}
                                alt={item.titulo}
                                className="w-full aspect-[2/3] object-cover group-hover:brightness-110 transition-all duration-200"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full aspect-[2/3] bg-white/10 rounded-lg flex items-center justify-center text-white/30">
                                No image
                              </div>
                            )}
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end p-2">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-full">
                                <p className="text-xs text-white font-semibold truncate">{item.titulo}</p>
                                <p className="text-xs text-white/60">{item.año || "—"}</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-white/80 truncate group-hover:text-white transition-colors">{item.titulo}</p>
                          <p className="text-xs text-white/40 capitalize">{item.tipo === "serie" ? "Serie" : item.tipo === "movie" ? "Película" : "Anime"}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <SearchIcon className="w-16 h-16 mx-auto mb-4 text-white/10" />
                  <h2 className="text-2xl font-black text-white mb-2">No encontramos resultados</h2>
                  <p className="text-white/40 max-w-sm mx-auto">Intenta buscar otra película o serie. Los resultados aparecerán al escribir.</p>
                </div>
              )}
            </>
          ) : (
            /* Show Initial State */
            <div className="space-y-10">
              {/* 🔥 Tendencias Ahora */}
              {trendingItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-5 h-5 text-[#7B2FBE]" />
                    <h2 className="text-lg font-black text-white">🔥 Tendencias Ahora</h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {trendingItems.map((item) => (
                      <button
                        key={`trending-${item.id}`}
                        onClick={() => handleTrendingClick(item)}
                        className="flex-shrink-0 group cursor-pointer"
                      >
                        <div className="relative overflow-hidden rounded-lg w-32 h-48 md:w-40 md:h-56">
                          {item.posterUrl ? (
                            <img
                              src={item.posterUrl}
                              alt={item.titulo}
                              className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-200"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/30">No img</div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />
                        </div>
                        <p className="text-xs text-white/80 mt-2 truncate group-hover:text-white transition-colors max-w-[140px]">{item.titulo}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 🆕 Recién Agregadas */}
              {trendingItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[#7B2FBE]" />
                    <h2 className="text-lg font-black text-white">🆕 Recién Agregadas</h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {trendingItems.slice(0, 10).map((item) => (
                      <button
                        key={`new-${item.id}`}
                        onClick={() => handleTrendingClick(item)}
                        className="flex-shrink-0 group cursor-pointer"
                      >
                        <div className="relative overflow-hidden rounded-lg w-32 h-48 md:w-40 md:h-56">
                          {item.posterUrl ? (
                            <img
                              src={item.posterUrl}
                              alt={item.titulo}
                              className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-200"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/30">No img</div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />
                        </div>
                        <p className="text-xs text-white/80 mt-2 truncate group-hover:text-white transition-colors max-w-[140px]">{item.titulo}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Búsquedas Recientes */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-white">Búsquedas Recientes</h2>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-white/40 hover:text-white/60 transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <div
                        key={search}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-full px-4 py-2 transition-colors group cursor-pointer"
                        onClick={() => handleRecentClick(search)}
                      >
                        <SearchIcon className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white/80">{search}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(search);
                          }}
                          className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3 text-white/60" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State Message */}
              {recentSearches.length === 0 && (
                <div className="text-center py-20">
                  <SearchIcon className="w-16 h-16 mx-auto mb-4 text-white/10" />
                  <h2 className="text-2xl font-black text-white mb-2">Empieza a buscar</h2>
                  <p className="text-white/40 max-w-sm mx-auto">Busca películas, series y animes. Tus búsquedas recientes aparecerán aquí.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
