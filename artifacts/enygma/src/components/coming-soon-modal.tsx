import { X, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonModalProps {
  titulo: string;
  sinopsis?: string;
  posterUrl?: string | null;
  onClose: () => void;
}

export function ComingSoonModal({ titulo, sinopsis, posterUrl, onClose }: ComingSoonModalProps) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="relative bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border-2 border-purple-500/30 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl shadow-purple-500/20">
        {/* Decorative red glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/70 hover:bg-purple-500/20 border border-white/20 hover:border-purple-500/60 text-white/70 hover:text-white flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">
          {/* Poster side */}
          {posterUrl && (
            <div className="relative h-64 md:h-96 rounded-xl overflow-hidden shadow-lg">
              <img
                src={posterUrl}
                alt={titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                <Loader className="w-5 h-5 text-purple-500 animate-spin" />
                <span className="text-white font-bold text-sm">Muy pronto</span>
              </div>
            </div>
          )}

          {/* Content side */}
          <div className={`flex flex-col justify-center ${!posterUrl ? "md:col-span-2" : ""}`}>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-red-900/30 to-red-800/20 border border-purple-500/40 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
                🎬 Próximamente
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
              {titulo}
            </h2>

            <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-red-600 rounded-full mb-6" />

            <p className="text-sm md:text-base text-white/80 mb-6 leading-relaxed">
              Estamos trabajando para traerte este contenido exclusivo.
              {sinopsis && ` ${sinopsis.substring(0, 120)}...`}
            </p>

            <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-6 backdrop-blur-sm">
              <p className="text-xs text-white/60 flex items-center gap-2">
                <span className="text-lg">✨</span>
                Mantente atento para recibir notificaciones cuando esté disponible
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black py-3 md:py-4 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all uppercase tracking-wide"
            >
              Volver
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
