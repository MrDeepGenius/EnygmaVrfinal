import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Search, Copy, Check, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Movie {
  id: string;
  titulo: string;
  tipo: "movie" | "serie" | "anime";
  año?: string | null;
  genero?: string | null;
  posterUrl?: string | null;
  sinopsis?: string | null;
}

export default function AdminSearch() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "movie" | "serie" | "anime">("all");
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  // Cargar todas las películas
  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE}/api/content/search?q=&limit=50000`);
        const data = await res.json();

        const allMovies: Movie[] = [
          ...(data.movies || []).map((m: any) => ({ ...m, tipo: "movie" as const })),
          ...(data.series || []).map((s: any) => ({ ...s, tipo: "serie" as const })),
          ...(data.anime || []).map((a: any) => ({ ...a, tipo: "anime" as const })),
        ];

        setMovies(allMovies);
      } catch (error) {
        console.error("Error loading movies:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  // Filtrar películas por búsqueda y tipo (excluyendo eliminadas)
  const filteredMovies = useMemo(() => {
    let filtered = movies.filter(m => !deletedIds.has(m.id));

    if (filterType !== "all") {
      filtered = filtered.filter(m => m.tipo === filterType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.titulo.toLowerCase().includes(query) ||
        (m.id && m.id.toLowerCase().includes(query))
      );
    }

    return filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
  }, [movies, searchQuery, filterType, deletedIds]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteMovie = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}" de la vista?`)) return;

    setDeleting(id);
    try {
      const res = await fetch(`${BASE}/api/content/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setDeletedIds(prev => new Set([...prev, id]));
      } else {
        alert("Error al eliminar la película");
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
      alert("Error al eliminar la película");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 border-b border-white/10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/admin")}
              className="text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-[#7B2FBE] font-bold tracking-widest uppercase text-sm">ENYGMA</span>
            <span className="text-white/30 text-sm">/ Admin Search</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Busca por título o ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#7B2FBE] focus:ring-1 focus:ring-[#7B2FBE]/50 transition-all text-lg"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "movie", "serie", "anime"] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filterType === type
                    ? "bg-[#7B2FBE] text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                }`}
              >
                {type === "all" && "Todas"}
                {type === "movie" && "🎬 Películas"}
                {type === "serie" && "📺 Series"}
                {type === "anime" && "🎨 Anime"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results Info */}
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">
                📊 Total en base: <span className="font-bold text-white">{movies.length}</span>
              </p>
              <p className="text-white/70 text-sm mt-1">
                🔍 Resultados: <span className="font-bold text-[#7B2FBE]">{filteredMovies.length}</span>
              </p>
              {deletedIds.size > 0 && (
                <p className="text-white/70 text-sm mt-1">
                  🗑️ Eliminadas: <span className="font-bold text-red-400">{deletedIds.size}</span>
                </p>
              )}
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-4 h-4 border-2 border-[#7B2FBE] border-t-transparent rounded-full animate-spin" />
                Cargando...
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {!loading && filteredMovies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMovies.map((movie, idx) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-all group"
              >
                {/* Poster */}
                {movie.posterUrl ? (
                  <div className="relative w-full h-48 overflow-hidden bg-white/10">
                    <img
                      src={movie.posterUrl}
                      alt={movie.titulo}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-white/10 flex items-center justify-center text-white/30">
                    No imagen
                  </div>
                )}

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">
                    {movie.titulo}
                  </h3>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/70">
                      {movie.tipo === "movie" ? "🎬 Película" : movie.tipo === "serie" ? "📺 Serie" : "🎨 Anime"}
                    </span>
                    {movie.año && (
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/70">
                        {movie.año}
                      </span>
                    )}
                  </div>

                  {/* Géneros */}
                  {movie.genero && (
                    <p className="text-xs text-white/50 line-clamp-1 mb-2">
                      {movie.genero}
                    </p>
                  )}

                  {/* ID Copy Button */}
                  <button
                    onClick={() => handleCopyId(movie.id)}
                    className="w-full flex items-center justify-center gap-2 bg-[#7B2FBE] hover:bg-[#6a28a6] text-white font-bold px-3 py-2 rounded text-xs transition-all mb-2"
                  >
                    {copiedId === movie.id ? (
                      <>
                        <Check className="w-3 h-3" />
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        {movie.id.substring(0, 8)}...
                      </>
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteMovie(movie.id, movie.titulo)}
                    disabled={deleting === movie.id}
                    className="w-full flex items-center justify-center gap-2 bg-red-900/50 hover:bg-red-900/70 disabled:opacity-50 text-white font-bold px-3 py-2 rounded text-xs transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                    {deleting === movie.id ? "Eliminando..." : "Eliminar"}
                  </button>

                  {/* Full ID (small) */}
                  <p className="text-xs text-white/40 mt-2 break-all font-mono text-center">
                    {movie.id}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            {loading ? (
              <>
                <div className="w-12 h-12 border-2 border-[#7B2FBE] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/60">Cargando películas...</p>
              </>
            ) : filteredMovies.length === 0 ? (
              <>
                <p className="text-white/60 text-lg mb-2">No se encontraron películas</p>
                <p className="text-white/40 text-sm">
                  Intenta con otro término de búsqueda
                </p>
              </>
            ) : null}
          </motion.div>
        )}
      </div>
    </div>
  );
}
