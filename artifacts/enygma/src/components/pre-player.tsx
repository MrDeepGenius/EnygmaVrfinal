import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface PrePlayerProps {
  href: string;          // ruta destino (/watch/...)
  onCancel: () => void;
}

const PROMO_IMAGE = "https://image.tmdb.org/t/p/w1280/bq28ajZaoMyzEIm6REelqyqtEDZ.jpg"; // fallback genérico

export function PrePlayer({ href, onCancel }: PrePlayerProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase]       = useState<"in" | "hold" | "out">("in");
  const [, setLocation]         = useLocation();

  useEffect(() => {
    // Fade in
    const t0 = setTimeout(() => setPhase("hold"), 80);

    // Progress bar: 0→100 en 3 s
    const start = Date.now();
    const interval = setInterval(() => {
      const p = Math.min(((Date.now() - start) / 3000) * 100, 100);
      setProgress(p);
      if (p >= 100) clearInterval(interval);
    }, 30);

    // Fade out + navigate
    const t1 = setTimeout(() => setPhase("out"), 2700);
    const t2 = setTimeout(() => setLocation(href), 3200);

    return () => {
      clearTimeout(t0); clearTimeout(t1); clearTimeout(t2);
      clearInterval(interval);
    };
  }, [href, setLocation]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      style={{
        opacity:    phase === "out" ? 0 : phase === "in" ? 0 : 1,
        transition: phase === "out" ? "opacity 0.5s ease" : phase === "hold" ? "opacity 0.3s ease" : "none",
      }}
      onClick={onCancel}
    >
      {/* Promo image */}
      <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-2xl">
        <img
          src={PROMO_IMAGE}
          alt="Preparando..."
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Logo */}
        <div className="absolute top-4 left-4">
          <img src="/enygma-logo.png" alt="ENYGMA" className="h-10 w-10 rounded-xl shadow-lg" />
        </div>

        {/* Texto + barra */}
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-white text-base font-semibold mb-3 tracking-wide">
            Preparando reproducción...
          </p>
          <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progress}%`, transition: "width 0.03s linear" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
