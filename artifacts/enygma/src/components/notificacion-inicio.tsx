import { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";

const SESSION_KEY = "enygma_notif_leer_v1";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all"
      style={{
        borderColor: copied ? "#a78bfa" : "#38bdf8",
        color: copied ? "#a78bfa" : "#38bdf8",
        background: copied ? "rgba(167,139,250,0.1)" : "rgba(56,189,248,0.1)",
        border: "1px solid",
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

export function NotificacionInicio() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        // pequeño delay para que aparezca después del splash
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  const cerrar = () => {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        style={{
          background: "#0b0813",
          border: "1px solid #a78bfa",
          boxShadow: "0 0 40px rgba(167,139,250,0.35), 0 0 80px rgba(167,139,250,0.12)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <img src={`${BASE}/gift-icon.png`} alt="" className="w-9 h-9" />
            <div>
              <h2 className="text-base font-black tracking-widest uppercase" style={{ color: "#a78bfa" }}>
                ¡Leer Porfa!
              </h2>
              <p className="text-xs" style={{ color: "#38bdf8" }}>Apoyá Enigma Cine 🚀</p>
            </div>
          </div>
          <button
            onClick={cerrar}
            className="p-1 rounded-full transition-colors hover:bg-white/10"
            style={{ color: "#a78bfa" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-3">
          <p className="text-xs leading-relaxed rounded-xl p-3" style={{ color: "#c4b5fd", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <span className="block font-bold mb-1" style={{ color: "#a78bfa" }}>¡Mantengamos Enigma Cine vivo y libre de anuncios!</span>
            Con tu donación cubrimos los servidores y el streaming. A cambio, <span className="font-semibold" style={{ color: "#f97316" }}>removemos el 100% de la publicidad</span> de tu cuenta. Cada $4.000 ARS o 3 USDT = 1 mes sin anuncios.
          </p>

          {/* ARS */}
          <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.2)" }}>
            <p className="text-xs font-bold" style={{ color: "#38bdf8" }}>🇦🇷 Argentina — Transferencia ARS</p>
            <div className="rounded-lg p-2.5 space-y-0.5" style={{ background: "rgba(0,0,0,0.4)" }}>
              <p className="text-xs" style={{ color: "#6b7280" }}>Alias CBU/CVU</p>
              <p className="text-sm font-mono font-bold" style={{ color: "#e2e8f0" }}>Bmontero26</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>Titular: MONTERO BRIAN</p>
            </div>
            <CopyBtn text="Bmontero26" />
            <p className="text-xs italic" style={{ color: "#a78bfa" }}>$4.000 = 1 mes · $8.000 = 2 meses · y así…</p>
          </div>

          {/* Crypto */}
          <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.2)" }}>
            <p className="text-xs font-bold" style={{ color: "#38bdf8" }}>⛓️ Cripto — USDT BEP-20 / BNB Chain</p>
            <div className="rounded-lg p-2.5 space-y-0.5" style={{ background: "rgba(0,0,0,0.4)" }}>
              <p className="text-xs" style={{ color: "#6b7280" }}>Wallet Address</p>
              <p className="text-xs font-mono font-bold break-all" style={{ color: "#e2e8f0" }}>0x5c77b34c16bae2ccb21695564c2fe68ec99f771f</p>
            </div>
            <CopyBtn text="0x5c77b34c16bae2ccb21695564c2fe68ec99f771f" />
            <p className="text-xs italic" style={{ color: "#a78bfa" }}>3 USDT = 1 mes · 6 USDT = 2 meses · y así…</p>
          </div>

          <button
            onClick={cerrar}
            className="w-full py-2 rounded-lg text-sm font-black tracking-wider uppercase transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
              color: "#fff",
              border: "1px solid rgba(167,139,250,0.5)",
              boxShadow: "0 0 12px rgba(124,58,237,0.4)",
            }}
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
}
