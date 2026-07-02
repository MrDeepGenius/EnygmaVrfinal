import { useState, useEffect } from "react";
import { useProfile } from "@/lib/profile-context";
import { X, Send, Clapperboard, Tv2, Sword, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

type ContentType = "pelicula" | "serie" | "anime";

interface RateInfo {
  blocked: boolean;
  nextAllowed: number | null;
}

function getRateLimit(profile: string | null): RateInfo {
  try {
    const key = `enygma:request:${profile || "guest"}`;
    const raw = localStorage.getItem(key);
    if (!raw) return { blocked: false, nextAllowed: null };
    const ts = Number(raw);
    if (isNaN(ts)) return { blocked: false, nextAllowed: null };
    const next = ts + ONE_WEEK;
    return { blocked: Date.now() < next, nextAllowed: next };
  } catch {
    return { blocked: false, nextAllowed: null };
  }
}

function setRateLimit(profile: string | null, ts: number) {
  try {
    const key = `enygma:request:${profile || "guest"}`;
    localStorage.setItem(key, String(ts));
  } catch { /* noop */ }
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "ahora";
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const TYPE_OPTIONS: { value: ContentType; label: string; icon: React.ElementType; color: string }[] = [
  { value: "pelicula", label: "Pelicula", icon: Clapperboard, color: "#E50914" },
  { value: "serie", label: "Serie", icon: Tv2, color: "#0ea5e9" },
  { value: "anime", label: "Anime", icon: Sword, color: "#a855f7" },
];

export function RequestBubble() {
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContentType>("pelicula");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [rateInfo, setRateInfo] = useState<RateInfo>({ blocked: false, nextAllowed: null });

  useEffect(() => {
    setRateInfo(getRateLimit(profile));
  }, [profile, open]);

  useEffect(() => {
    if (!rateInfo.blocked || !rateInfo.nextAllowed) { setCountdown(null); return; }
    const tick = () => {
      const ms = (rateInfo.nextAllowed ?? 0) - Date.now();
      if (ms <= 0) { setCountdown(null); setRateInfo({ blocked: false, nextAllowed: null }); return; }
      setCountdown(formatCountdown(ms));
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [rateInfo]);

  const handleOpen = () => {
    const current = getRateLimit(profile);
    setRateInfo(current);
    setOpen(true);
    setError(null);
    setSent(false);
    setTitle("");
    setComment("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Escribe el titulo del contenido"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profile || "Invitado", title: title.trim(), type, comment: comment.trim() }),
      });
      if (res.status === 429) {
        const data = await res.json();
        const nextTs = data.nextAllowed ?? Date.now() + ONE_WEEK;
        setRateLimit(profile, Date.now());
        setRateInfo({ blocked: true, nextAllowed: nextTs });
        const dateStr = new Date(nextTs).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
        setError(`Ya hiciste tu pedido esta semana. Vuelve el ${dateStr}`);
        return;
      }
      if (!res.ok) throw new Error("Error al enviar pedido");
      setRateLimit(profile, Date.now());
      setSent(true);
    } catch (e: unknown) {
      if ((e as Error)?.message !== "Error al enviar pedido") {
        setError("No se pudo enviar. Intenta de nuevo.");
      } else {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedType = TYPE_OPTIONS.find(t => t.value === type)!;

  return (
    <>
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white font-bold text-xl select-none"
        style={{ background: "linear-gradient(135deg,#E50914 0%,#7B2FBE 100%)", boxShadow: "0 4px 24px rgba(229,9,20,0.45)" }}
        title="Pedir contenido"
      >
        +
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="fixed z-50 inset-x-4 bottom-28 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[420px] rounded-2xl border border-white/10 overflow-hidden"
              style={{ background: "#0f0f0f" }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.08]">
                <div>
                  <p className="text-white font-bold text-base tracking-wide">Pedir contenido</p>
                  <p className="text-white/40 text-xs mt-0.5">1 pedido por semana por perfil</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 py-4 flex flex-col gap-4">
                {sent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-6 text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                      <Send className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-white font-semibold text-base">Pedido enviado</p>
                    <p className="text-white/40 text-sm">Lo tendremos en cuenta para la proxima actualizacion.</p>
                    <button onClick={() => setOpen(false)} className="mt-2 px-6 py-2 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">Cerrar</button>
                  </motion.div>
                ) : rateInfo.blocked ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-[#E50914]/15 flex items-center justify-center">
                      <ChevronDown className="w-6 h-6 text-[#E50914]" />
                    </div>
                    <p className="text-white font-semibold text-base">Ya hiciste tu pedido</p>
                    {countdown && (
                      <p className="text-white/40 text-sm">Proximo pedido en <span className="text-white/70 font-mono">{countdown}</span></p>
                    )}
                    <button onClick={() => setOpen(false)} className="mt-2 px-6 py-2 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">Cerrar</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">Tipo</label>
                      <div className="flex gap-2">
                        {TYPE_OPTIONS.map(opt => {
                          const Icon = opt.icon;
                          const active = type === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setType(opt.value)}
                              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all text-xs font-semibold"
                              style={{
                                borderColor: active ? opt.color : "rgba(255,255,255,0.08)",
                                background: active ? `${opt.color}1a` : "transparent",
                                color: active ? opt.color : "rgba(255,255,255,0.4)",
                              }}
                            >
                              <Icon className="w-4 h-4" />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">Titulo</label>
                      <input
                        autoFocus
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        placeholder={`Nombre de la ${selectedType.label.toLowerCase()}...`}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">
                        Comentario <span className="normal-case tracking-normal text-white/30">(opcional)</span>
                      </label>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Temporada, ano, detalles..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none"
                      />
                    </div>

                    {error && <p className="text-[#E50914] text-xs">{error}</p>}

                    <button
                      onClick={handleSubmit}
                      disabled={loading || !title.trim()}
                      className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                      style={{ background: `linear-gradient(90deg,${selectedType.color} 0%,#7B2FBE 100%)` }}
                    >
                      {loading
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Send className="w-4 h-4" />Enviar pedido</>
                      }
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
