import { useEffect, useState } from "react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 800);
    const t2 = setTimeout(() => setPhase("out"), 2000);
    const t3 = setTimeout(() => onDone(), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black select-none"
      style={{
        opacity: phase === "out" ? 0 : 1,
        transform: phase === "out" ? "scale(1.04)" : "scale(1)",
        transition: phase === "out"
          ? "opacity 0.5s ease-in, transform 0.5s ease-in"
          : "none",
        pointerEvents: "all",
      }}
    >
      {/* Radial glow behind logo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 55% 40% at 50% 48%, rgba(123,47,190,0.18) 0%, transparent 70%)",
          opacity: phase === "in" ? 0 : 1,
          transition: "opacity 0.9s ease",
        }}
      />

      {/* Logo + text */}
      <div
        className="flex flex-col items-center gap-5"
        style={{
          opacity: phase === "in" ? 0 : 1,
          transform: phase === "in" ? "scale(0.82) translateY(12px)" : "scale(1) translateY(0)",
          transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            filter: "drop-shadow(0 0 28px rgba(123,47,190,0.7)) drop-shadow(0 0 8px rgba(123,47,190,0.4))",
          }}
        >
          <img
            src="/enygma-logo.png"
            alt="ENYGMA"
            className="w-24 h-24 rounded-2xl object-cover shadow-2xl"
          />
        </div>

        {/* Name */}
        <div className="text-center">
          <p
            className="text-white font-black text-4xl tracking-[0.22em] uppercase"
            style={{ fontFamily: "system-ui, sans-serif", letterSpacing: "0.22em" }}
          >
            ENYGMA
          </p>
          <p
            className="text-[#7B2FBE] text-xs font-bold tracking-[0.45em] uppercase mt-1.5"
            style={{
              opacity: phase === "in" ? 0 : 1,
              transition: "opacity 0.6s ease 0.3s",
            }}
          >
            CINE
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-[2px] rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#7B2FBE]"
          style={{
            width: phase === "in" ? "0%" : phase === "hold" ? "75%" : "100%",
            transition:
              phase === "hold"
                ? "width 1.0s ease"
                : phase === "out"
                  ? "width 0.4s ease"
                  : "none",
            boxShadow: "0 0 8px rgba(123,47,190,0.8)",
          }}
        />
      </div>
    </div>
  );
}
