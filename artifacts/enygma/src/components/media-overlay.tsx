import { useEffect, useState, useRef } from "react";

export type OverlayMode = "preroll" | "pause" | "buffering";

interface MediaOverlayProps {
  visible: boolean;
  mode: OverlayMode;
  backdropUrl?: string;
  onComplete?: () => void;
  duration?: number;
}

const LOADING_MESSAGES = [
  "Conectando servidor...",
  "Optimizando streaming...",
  "Preparando reproductor...",
  "Verificando calidad HD...",
  "Iniciando reproducción...",
];

export function MediaOverlay({
  visible,
  mode,
  backdropUrl,
  onComplete,
  duration = 4000,
}: MediaOverlayProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [progress, setProgress] = useState(0);
  const messageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rotar mensajes cada segundo - solo durante preroll
  useEffect(() => {
    if (visible && mode === "preroll") {
      messageIntervalRef.current = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1000);
    }
    return () => {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    };
  }, [visible, mode]);

  // Barra de progreso y auto-completion para preroll
  useEffect(() => {
    if (visible && mode === "preroll") {
      setProgress(0);
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (100 / (duration / 50));
          return next > 100 ? 100 : next;
        });
      }, 50);

      // Auto-complete after duration
      timeoutRef.current = setTimeout(() => {
        setProgress(100);
        if (onComplete) onComplete();
      }, duration);
    }
    
    // Cleanup
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible, mode, duration, onComplete]);


  // Solo mostrar overlay en preroll - NO mostrar en pause/buffering
  if (mode !== "preroll" || !visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-8 pointer-events-auto">
      {/* Fondo cinematográfico */}
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt="background"
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
          style={{
            animation: "kenBurns 3s ease forwards",
          }}
        />
      )}

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center pointer-events-none">
        {/* Logo */}
        <img
          src="/enygma-logo.png"
          alt="ENYGMA"
          className="w-40 h-40 md:w-56 md:h-56 rounded-xl shadow-2xl animate-in fade-in duration-500"
          style={{
            filter: "drop-shadow(0 0 20px rgba(123, 47, 190, 0.4))",
          }}
        />

        {/* Spinner */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white/20 border-t-white animate-spin" />

        {/* Título */}
        <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-wider animate-in fade-in duration-700">
          Preparando reproducción...
        </h2>

        {/* Mensaje dinámico */}
        <p className="text-sm md:text-base text-white/80 font-medium min-h-6">
          {LOADING_MESSAGES[currentMessage]}
        </p>

        {/* Barra de progreso */}
        <div className="w-64 md:w-80 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-600 via-red-600 to-yellow-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Banner de publicidad fijo abajo */}
      <div className="absolute bottom-6 z-20 flex justify-center pointer-events-none">
        <div
          id="preroll-ad-banner"
          style={{ minHeight: "250px", minWidth: "300px", maxWidth: "90vw" }}
        />
      </div>

      {/* Animación ken burns */}
      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
