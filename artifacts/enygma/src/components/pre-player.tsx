import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdBannerSlot } from "@/components/ad-banner";

interface PrePlayerProps {
  href: string;          // ruta destino (/watch/...)
  onCancel: () => void;
}

const DURATION = 5000; // ms — tiempo suficiente para que el ad cargue

export function PrePlayer({ href, onCancel }: PrePlayerProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase]       = useState<"in" | "hold" | "out">("in");
  const [, setLocation]         = useLocation();

  useEffect(() => {
    const t0 = setTimeout(() => setPhase("hold"), 80);

    const start = Date.now();
    const interval = setInterval(() => {
      const p = Math.min(((Date.now() - start) / DURATION) * 100, 100);
      setProgress(p);
      if (p >= 100) clearInterval(interval);
    }, 30);

    const t1 = setTimeout(() => setPhase("out"), DURATION - 400);
    const t2 = setTimeout(() => setLocation(href), DURATION + 100);

    return () => {
      clearTimeout(t0); clearTimeout(t1); clearTimeout(t2);
      clearInterval(interval);
    };
  }, [href, setLocation]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black gap-4 px-4"
      style={{
        opacity:    phase === "out" ? 0 : phase === "in" ? 0 : 1,
        transition: phase === "out" ? "opacity 0.4s ease" : phase === "hold" ? "opacity 0.3s ease" : "none",
      }}
      onClick={(e) => {
        // sólo cancelar si no se hizo click dentro del banner
        if ((e.target as HTMLElement).closest(".ad-pre-slot")) return;
        onCancel();
      }}
    >
      {/* ── Título ── */}
      <p className="text-white/60 text-sm font-medium tracking-wide">
        Preparando reproducción...
      </p>

      {/* ── Barra de progreso ── */}
      <div className="w-full max-w-sm h-1 bg-white/15 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full"
          style={{ width: `${progress}%`, transition: "width 0.03s linear" }}
        />
      </div>

      {/* ── Banner Adsterra 300×250 ── */}
      <div className="ad-pre-slot" onClick={(e) => e.stopPropagation()}>
        <AdBannerSlot variant="rect" />
      </div>

      {/* ── Saltar ── */}
      <button
        onClick={onCancel}
        className="text-white/35 text-xs underline underline-offset-2 hover:text-white/60 transition-colors mt-1"
      >
        Saltar
      </button>
    </div>
  );
}
