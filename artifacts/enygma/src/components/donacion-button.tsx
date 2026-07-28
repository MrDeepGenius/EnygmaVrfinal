import { useState, useCallback } from "react";
import { X, Copy, Check, Send } from "lucide-react";
import { usePremium } from "@/lib/premium-context";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Tab = "ar" | "crypto";

const PAYMENT_DATA = {
  ar: {
    label: "🇦🇷 Argentina (ARS)",
    min: "$4.000 ARS = 1 mes sin anuncios",
    field: "Alias CBU/CVU",
    value: "Bmontero26",
    titular: "MONTERO BRIAN",
    copyLabel: "Copiar Alias",
    metodo: "transferencia" as const,
    extra: "Cada $4.000 ARS = 1 mes sin publicidad (ej: $8.000 = 2 meses)",
  },
  crypto: {
    label: "⛓️ Cripto (USDT BEP-20)",
    min: "3 USDT = 1 mes sin anuncios",
    field: "Wallet BEP-20 / BNB Chain",
    value: "0x5c77b34c16bae2ccb21695564c2fe68ec99f771f",
    titular: "BEP-20 / BNB Chain",
    copyLabel: "Copiar Wallet",
    metodo: "crypto" as const,
    extra: "Cada 3 USDT = 1 mes sin publicidad (ej: 6 USDT = 2 meses)",
  },
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border transition-all duration-200"
      style={{
        borderColor: copied ? "#a78bfa" : "#38bdf8",
        color: copied ? "#a78bfa" : "#38bdf8",
        background: copied ? "rgba(167,139,250,0.1)" : "rgba(56,189,248,0.1)",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "¡Copiado!" : label}
    </button>
  );
}

export function DonacionButton() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("ar");
  const [nombre, setNombre] = useState("");
  const [gmail, setGmailLocal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const { setGmail } = usePremium();

  const handleSubmit = useCallback(async () => {
    if (!nombre.trim() || !gmail.trim()) {
      setError("Completá tu nombre y Gmail para continuar.");
      return;
    }
    if (!gmail.includes("@")) {
      setError("Ingresá un Gmail válido.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/premium/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: gmail.trim(),
          nombre: nombre.trim(),
          email: gmail.trim(),
          metodo_pago: PAYMENT_DATA[tab].metodo,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Error al registrar el pedido.");
      }
      setGmail(gmail.trim());
      setSubmitted(true);
      // WhatsApp redirect
      const msg = encodeURIComponent(
        `Hola Enigma Cine! Acabo de enviar mis datos para el pase Premium de mi cuenta: ${gmail.trim()}. Adjunto el comprobante de pago.`
      );
      setTimeout(() => {
        window.open(`https://wa.me/5493417195165?text=${msg}`, "_blank");
      }, 600);
    } catch {
      setError("Error al enviar. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }, [nombre, gmail, tab, setGmail]);

  if (hidden) return null;

  const pd = PAYMENT_DATA[tab];

  return (
    <>
      {/* Floating button */}
      {!open && (
        <div className="fixed bottom-44 right-4 md:bottom-28 md:right-8 z-50 flex items-end gap-1">
          <button
            onClick={() => setHidden(true)}
            className="mb-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
            style={{ background: "rgba(11,8,19,0.8)", color: "#a78bfa", border: "1px solid #a78bfa" }}
            title="Ocultar"
          >
            ×
          </button>
          <button
            onClick={() => setOpen(true)}
            className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #4c1d95, #1e1b4b)",
              border: "2px solid #a78bfa",
              boxShadow: "0 0 16px rgba(167,139,250,0.5), 0 0 32px rgba(167,139,250,0.2)",
            }}
            title="Apoyar Enigma Cine"
          >
            <img src={`${BASE}/gift-icon.png`} alt="Donar" className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "#0b0813",
              border: "1px solid #a78bfa",
              boxShadow: "0 0 40px rgba(167,139,250,0.3), 0 0 80px rgba(167,139,250,0.1)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div className="relative px-5 pt-5 pb-3">
              <div className="flex items-center gap-3 mb-3">
                <img src={`${BASE}/gift-icon.png`} alt="" className="w-10 h-10" />
                <div>
                  <h2 className="text-base font-black tracking-widest uppercase" style={{ color: "#a78bfa" }}>
                    Apoyar Enigma Cine
                  </h2>
                  <p className="text-xs" style={{ color: "#38bdf8" }}>Acceso Premium · Sin Publicidad</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full transition-colors hover:bg-white/10"
                style={{ color: "#a78bfa" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-5 space-y-4">
              {/* Texto explicativo */}
              <p className="text-xs leading-relaxed rounded-xl p-3" style={{ color: "#c4b5fd", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
                <span className="block font-bold mb-1" style={{ color: "#a78bfa" }}>¡Mantengamos Enigma Cine Vivo y Libre de Anuncios! 🚀</span>
                Mantener los servidores activos, la aplicación online y todo el contenido actualizado a la máxima velocidad de streaming cuesta dinero todos los meses. Queremos que la plataforma siga siendo accesible para todos, pero la publicidad a veces interrumpe la experiencia.{" "}
                <span className="font-semibold" style={{ color: "#f97316" }}>¿Nos ayudás con una donación?</span> Con tu aporte pagamos la infraestructura y los servidores de streaming directamente. A cambio, removemos el 100% de la publicidad de tu cuenta y te damos acceso prioritario por un mes.
              </p>

              {/* Tabs de países */}
              <div className="flex gap-1 rounded-lg p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
                {(Object.keys(PAYMENT_DATA) as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-1 text-xs py-1.5 rounded-md font-bold transition-all duration-200"
                    style={
                      tab === t
                        ? { background: "rgba(167,139,250,0.2)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.4)" }
                        : { color: "#6b7280", border: "1px solid transparent" }
                    }
                  >
                    {t === "ar" ? "🇦🇷 ARS" : "⛓️ Cripto"}
                  </button>
                ))}
              </div>

              {/* Datos de pago */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.2)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: "#38bdf8" }}>{pd.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}>
                    {pd.min}
                  </span>
                </div>
                <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(0,0,0,0.4)" }}>
                  <p className="text-xs" style={{ color: "#6b7280" }}>{pd.field}</p>
                  <p className="text-sm font-mono font-bold break-all" style={{ color: "#e2e8f0" }}>{pd.value}</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>Titular: {pd.titular}</p>
                </div>
                <CopyButton text={pd.value} label={pd.copyLabel} />
                <p className="text-xs italic" style={{ color: "#a78bfa" }}>{pd.extra}</p>
              </div>

              {/* Divisor */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: "rgba(167,139,250,0.2)" }} />
                <span className="text-xs" style={{ color: "#6b7280" }}>Registrá tu pago</span>
                <div className="flex-1 h-px" style={{ background: "rgba(167,139,250,0.2)" }} />
              </div>

              {/* Formulario */}
              {!submitted ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      color: "#e2e8f0",
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Tu Gmail (ej: nombre@gmail.com)"
                    value={gmail}
                    onChange={(e) => setGmailLocal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      color: "#e2e8f0",
                    }}
                  />
                  {error && <p className="text-xs" style={{ color: "#f97316" }}>{error}</p>}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-2.5 rounded-lg text-sm font-black tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
                      color: "#fff",
                      border: "1px solid rgba(167,139,250,0.5)",
                      boxShadow: "0 0 12px rgba(124,58,237,0.4)",
                    }}
                  >
                    <Send size={14} />
                    {submitting ? "Enviando…" : "Enviar y Notificar por WhatsApp"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <Check size={32} className="mx-auto" style={{ color: "#a78bfa" }} />
                  <p className="text-sm font-bold" style={{ color: "#a78bfa" }}>¡Datos enviados!</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>Te redirigimos a WhatsApp para enviar el comprobante. En cuanto lo confirmemos, tu cuenta queda Premium. 🎉</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
