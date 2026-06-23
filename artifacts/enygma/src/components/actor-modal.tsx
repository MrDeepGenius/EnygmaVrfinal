import { useEffect } from "react";
import { X, MapPin, Calendar, Film, Tv } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetTmdbPerson, getGetTmdbPersonQueryKey } from "@workspace/api-client-react";

interface ActorModalProps {
  personId: number | null;
  onClose: () => void;
}

export function ActorModal({ personId, onClose }: ActorModalProps) {
  const params = { personId: String(personId ?? 0) };
  const { data: person, isLoading } = useGetTmdbPerson(params, {
    query: {
      enabled: personId !== null,
      queryKey: getGetTmdbPersonQueryKey(params),
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {personId !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#141414] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8 flex-shrink-0">
              <h2 className="text-base font-bold font-display uppercase tracking-wider">
                {person?.name || "Cargando..."}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              {isLoading ? (
                <div className="p-5 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-32 rounded-lg bg-white/8 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-3 pt-1">
                      <div className="h-4 bg-white/8 animate-pulse rounded w-1/2" />
                      <div className="h-3 bg-white/8 animate-pulse rounded w-1/3" />
                      <div className="h-3 bg-white/8 animate-pulse rounded w-full" />
                      <div className="h-3 bg-white/8 animate-pulse rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ) : person ? (
                <div className="p-5 space-y-6">
                  {/* Profile */}
                  <div className="flex gap-4">
                    {person.profilePath ? (
                      <img
                        src={person.profilePath}
                        alt={person.name}
                        className="w-24 h-32 rounded-lg object-cover flex-shrink-0 ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="w-24 h-32 rounded-lg bg-white/8 flex-shrink-0 flex items-center justify-center text-white/20 text-3xl font-bold">
                        {person.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pt-1">
                      {person.knownFor && (
                        <p className="text-[#7B2FBE] text-xs font-bold uppercase tracking-widest mb-2">
                          {person.knownFor}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40 mb-3">
                        {person.birthday && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {person.birthday}
                          </span>
                        )}
                        {person.placeOfBirth && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {person.placeOfBirth}
                          </span>
                        )}
                      </div>
                      {person.biography && (
                        <p className="text-white/60 text-xs leading-relaxed line-clamp-5">
                          {person.biography}
                        </p>
                      )}
                      {!person.biography && (
                        <p className="text-white/25 text-xs italic">Sin biografía disponible.</p>
                      )}
                    </div>
                  </div>

                  {/* Filmografía */}
                  {person.credits && person.credits.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold font-display uppercase tracking-wider mb-3 text-white/70">
                        Conocido por
                      </h3>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {person.credits.slice(0, 20).map((credit) => (
                          <div key={`${credit.id}-${credit.mediaType}`} className="group">
                            <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-white/5 mb-1.5">
                              {credit.posterPath ? (
                                <img
                                  src={credit.posterPath}
                                  alt={credit.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {credit.mediaType === "tv" ? (
                                    <Tv className="w-5 h-5 text-white/20" />
                                  ) : (
                                    <Film className="w-5 h-5 text-white/20" />
                                  )}
                                </div>
                              )}
                              {credit.year && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3">
                                  <span className="text-[9px] text-white/50">{credit.year}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-white/60 text-[10px] leading-tight line-clamp-2">{credit.title}</p>
                            {credit.character && (
                              <p className="text-white/30 text-[9px] leading-tight line-clamp-1 mt-0.5">{credit.character}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 text-center text-white/30 text-sm py-12">
                  No se encontraron datos para este actor.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
