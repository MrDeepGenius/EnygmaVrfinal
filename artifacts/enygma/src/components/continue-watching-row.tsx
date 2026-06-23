import { Link } from "wouter";
import { Play, X } from "lucide-react";
import { useWatchProgress } from "@/lib/use-watch-progress";

export function ContinueWatchingRow() {
  const { progress, removeProgress } = useWatchProgress();

  if (progress.length === 0) return null;

  return (
    <div className="px-4 md:px-10 lg:px-16 xl:px-20 mb-8 sm:mb-12">
      {/* Premium title */}
      <div className="mb-4 sm:mb-6 relative flex items-center gap-3">
        <div className="w-1.5 h-7 sm:h-8 bg-gradient-to-b from-purple-500 to-red-600 rounded-full shadow-lg shadow-purple-500/50" />
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase font-display tracking-tighter text-white">
          Continuar Viendo
        </h2>
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
        {progress.slice(0, 15).map((item) => (
          <div
            key={item.id}
            className="relative group flex-shrink-0 w-[120px] sm:w-[160px] md:w-[200px]"
          >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border-2 border-white/10 group-hover:border-purple-500/60 shadow-lg group-hover:shadow-2xl group-hover:shadow-purple-500/30 transition-all duration-300 cursor-pointer">
              <Link href={`/watch/${item.tipo}/${item.id}`} className="absolute inset-0 z-20" />

              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.titulo}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center p-2">
                  <span className="text-white/30 text-xs text-center font-bold">{item.titulo}</span>
                </div>
              )}

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 border-t border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-red-600 rounded-r-full transition-all duration-300"
                  style={{ width: `${Math.max(5, Math.min(95, item.progress * 100))}%`, boxShadow: "0 0 8px rgba(239,68,68,0.6)" }}
                />
              </div>

              {/* Hover play button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-all duration-200 z-10 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-red-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                </div>
              </div>

              {/* Remove button */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeProgress(item.id); }}
                className="absolute top-2 right-2 z-30 w-6 h-6 rounded-full bg-black/80 backdrop-blur-md text-white/60 hover:text-white hover:bg-purple-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20 hover:border-purple-500/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2 px-0.5">
              <p className="text-white/90 text-xs font-black line-clamp-2 font-netflix leading-tight">{item.titulo}</p>
              {item.episodio && (
                <p className="text-white/50 text-[10px] mt-0.5 font-bold">Ep {item.episodio}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
