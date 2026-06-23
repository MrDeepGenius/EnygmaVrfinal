import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, X, Search } from "lucide-react";

interface SpecialSession {
  id: string;
  name: string;
  description: string;
  movies: Array<{
    id: string;
    titulo: string;
    tipo: "movie" | "serie" | "anime";
    posterUrl: string | null;
    year?: string;
  }>;
  position: number;
}

interface AdminSpecialSessionsTabProps {
  onSessionsChange: (sessions: SpecialSession[]) => void;
  initialSessions: SpecialSession[];
  allItems: any[];
  isLoading: boolean;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AdminSpecialSessionsTab({
  onSessionsChange,
  initialSessions,
  allItems,
  isLoading,
}: AdminSpecialSessionsTabProps) {
  const [sessions, setSessions] = useState<SpecialSession[]>(initialSessions);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionDescription, setNewSessionDescription] = useState("");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [showMovieSelector, setShowMovieSelector] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);

  useEffect(() => {
    onSessionsChange(sessions);
  }, [sessions]);

  const handleCreateSession = () => {
    if (!newSessionName.trim()) return;
    
    const newSession: SpecialSession = {
      id: `session_${Date.now()}`,
      name: newSessionName.trim(),
      description: newSessionDescription.trim(),
      movies: [],
      position: sessions.length,
    };

    setSessions([...sessions, newSession]);
    setNewSessionName("");
    setNewSessionDescription("");
  };

  const handleDeleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const handleAddMoviesToSession = (sessionId: string) => {
    setSessions(
      sessions.map(s =>
        s.id === sessionId
          ? {
              ...s,
              movies: [
                ...s.movies,
                ...selectedMovies
                  .map(movieId => allItems.find(item => item.id === movieId))
                  .filter(Boolean),
              ],
            }
          : s
      )
    );
    setSelectedMovies([]);
    setShowMovieSelector(null);
    setSearchQuery("");
  };

  const handleRemoveMovieFromSession = (sessionId: string, movieId: string) => {
    setSessions(
      sessions.map(s =>
        s.id === sessionId
          ? { ...s, movies: s.movies.filter(m => m.id !== movieId) }
          : s
      )
    );
  };

  const handleMoveSession = (id: string, direction: -1 | 1) => {
    const idx = sessions.findIndex(s => s.id === id);
    if ((direction === -1 && idx === 0) || (direction === 1 && idx === sessions.length - 1)) return;

    const newSessions = [...sessions];
    [newSessions[idx], newSessions[idx + direction]] = [newSessions[idx + direction], newSessions[idx]];
    newSessions.forEach((s, i) => (s.position = i));
    setSessions(newSessions);
  };

  const filteredItems = searchQuery.trim()
    ? allItems.filter(item =>
        item.titulo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allItems;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white mb-1">🎬 Sesiones Especiales</h2>
        <p className="text-white/40 text-sm mb-4">
          Crea sesiones temáticas con múltiples películas. Los usuarios verán estas sesiones en la app.
        </p>
      </div>

      {/* Create New Session */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-bold mb-3 text-sm">Crear Nueva Sesión</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nombre de la sesión (ej: Películas de Acción)"
            value={newSessionName}
            onChange={e => setNewSessionName(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={newSessionDescription}
            onChange={e => setNewSessionDescription(e.target.value)}
            rows={2}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE] resize-none"
          />
          <button
            onClick={handleCreateSession}
            disabled={!newSessionName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#7B2FBE] hover:bg-[#6a28a6] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear Sesión
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-10 text-white/20 text-sm border border-dashed border-white/10 rounded-lg">
            No hay sesiones especiales. Crea una arriba.
          </div>
        ) : (
          sessions.map((session, idx) => (
            <div key={session.id} className="bg-white/5 rounded-xl border border-white/10">
              {/* Session Header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveSession(session.id, -1)}
                    disabled={idx === 0}
                    className="text-white/30 hover:text-white disabled:opacity-10 transition-colors p-0.5"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveSession(session.id, 1)}
                    disabled={idx === sessions.length - 1}
                    className="text-white/30 hover:text-white disabled:opacity-10 transition-colors p-0.5"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{session.name}</p>
                  {session.description && (
                    <p className="text-white/40 text-xs truncate">{session.description}</p>
                  )}
                  <p className="text-white/30 text-xs">
                    {session.movies.length} película{session.movies.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                    className="text-white/50 hover:text-white transition-colors p-1.5"
                  >
                    {expandedSession === session.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="text-white/30 hover:text-[#7B2FBE] transition-colors p-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Session Content */}
              {expandedSession === session.id && (
                <div className="border-t border-white/8 px-4 py-4 space-y-4">
                  {/* Add Movies Button */}
                  <button
                    onClick={() => setShowMovieSelector(showMovieSelector === session.id ? null : session.id)}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Películas (múltiples)
                  </button>

                  {/* Movie Selector */}
                  {showMovieSelector === session.id && (
                    <div className="border border-white/10 rounded-lg p-3 space-y-3 bg-white/5">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          placeholder="Buscar películas..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full bg-white/10 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
                        />
                      </div>

                      {/* Movies Grid */}
                      <div className="max-h-72 overflow-y-auto space-y-2">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 text-[#7B2FBE] animate-spin" />
                          </div>
                        ) : filteredItems.length > 0 ? (
                          filteredItems.map(item => (
                            <label
                              key={item.id}
                              className="flex items-center gap-2 p-2 bg-white/8 hover:bg-white/12 rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedMovies.includes(item.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedMovies([...selectedMovies, item.id]);
                                  } else {
                                    setSelectedMovies(selectedMovies.filter(id => id !== item.id));
                                  }
                                }}
                                className="rounded w-4 h-4"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white truncate">{item.titulo}</p>
                                <p className="text-xs text-white/40">
                                  {item.year && `${item.year} • `}
                                  {item.tipo}
                                </p>
                              </div>
                            </label>
                          ))
                        ) : (
                          <p className="text-center py-8 text-white/30 text-xs">
                            No se encontraron películas
                          </p>
                        )}
                      </div>

                      {/* Selected Count */}
                      {selectedMovies.length > 0 && (
                        <div className="text-xs text-[#7B2FBE] font-semibold">
                          {selectedMovies.length} película{selectedMovies.length !== 1 ? "s" : ""} seleccionada{selectedMovies.length !== 1 ? "s" : ""}
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddMoviesToSession(session.id)}
                          disabled={selectedMovies.length === 0}
                          className="flex-1 bg-[#7B2FBE] hover:bg-[#6a28a6] disabled:opacity-40 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                        >
                          Agregar {selectedMovies.length > 0 ? `(${selectedMovies.length})` : ""}
                        </button>
                        <button
                          onClick={() => {
                            setShowMovieSelector(null);
                            setSelectedMovies([]);
                            setSearchQuery("");
                          }}
                          className="flex-1 bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Movies in Session */}
                  <div className="space-y-2">
                    <p className="text-xs text-white/60 font-semibold">Películas en esta sesión:</p>
                    {session.movies.length === 0 ? (
                      <p className="text-xs text-white/30 italic">Sin películas aún</p>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {session.movies.map(movie => (
                          <div
                            key={movie.id}
                            className="flex-shrink-0 w-16 relative group"
                          >
                            {movie.posterUrl ? (
                              <img
                                src={movie.posterUrl}
                                alt={movie.titulo}
                                className="w-16 h-24 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-24 bg-white/10 rounded-lg flex items-center justify-center text-xs text-white/30 text-center px-1">
                                {movie.titulo}
                              </div>
                            )}
                            <button
                              onClick={() => handleRemoveMovieFromSession(session.id, movie.id)}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#7B2FBE]"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <p className="text-xs text-white/60 mt-1 truncate text-center">
                              {movie.titulo.substring(0, 10)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
