import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { X, Play, Heart, Shuffle, Dices, Star } from "lucide-react";
import { Link } from "wouter";
import type { Movie } from "@workspace/api-client-react";
import { useFavorites } from "@/lib/use-favorites";

const MOVIE_GENRES = ["Todos", "Acción", "Comedia", "Drama", "Terror", "Thriller", "Ciencia Ficción", "Aventura", "Romance", "Animación"];
const EXTRA_SPINS = 6;
const WHEEL_COUNT = 10;
const RADIUS = 155;

// ─── Web Audio sounds ────────────────────────────────────────────────────────
function createAudioCtx() {
  try { return new (window.AudioContext || (window as any).webkitAudioContext)(); }
  catch { return null; }
}

function playTick(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04);
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

function playWin(ctx: AudioContext) {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    const t = ctx.currentTime + i * 0.13;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.start(t);
    osc.stop(t + 0.5);
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
interface RuletaCineProps {
  items: Movie[];
  onClose: () => void;
}

export function RuletaCine({ items, onClose }: RuletaCineProps) {
  const [genre, setGenre] = useState("Todos");
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Movie | null>(null);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [spinKey, setSpinKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const controls = useAnimation();
  const rotationRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toggle, isFavorite } = useFavorites();

  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, []);

  const filtered = useMemo(() => {
    if (genre === "Todos") return items;
    return items.filter(m => m.genero?.toLowerCase().includes(genre.toLowerCase()));
  }, [items, genre]);

  const wheelItems = useMemo(() => {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(WHEEL_COUNT, shuffled.length));
  }, [filtered, spinKey]);

  const N = wheelItems.length || 1;
  const segmentAngle = 360 / N;

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx();
    if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const handleSpin = useCallback(async () => {
    if (spinning || N === 0) return;
    setSpinning(true);
    setWinner(null);
    setWinnerIndex(null);
    setShowConfetti(false);

    const ctx = getAudioCtx();
    let tickDelay = 80;
    if (ctx) {
      tickIntervalRef.current = setInterval(() => {
        playTick(ctx);
        tickDelay = Math.min(tickDelay * 1.045, 380);
        if (tickDelay >= 370) {
          if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        }
      }, tickDelay);
    }

    const targetIndex = Math.floor(Math.random() * N);
    const targetItemAngle = targetIndex * segmentAngle;
    const currentNorm = ((rotationRef.current % 360) + 360) % 360;
    const finalAngle = ((360 - targetItemAngle) % 360);
    let delta = finalAngle - currentNorm;
    if (delta <= 0) delta += 360;
    const newRotation = rotationRef.current + EXTRA_SPINS * 360 + delta;

    await controls.start({
      rotate: newRotation,
      transition: { duration: 5, ease: [0.08, 0.82, 0.17, 1.0] },
    });

    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    rotationRef.current = newRotation;
    setWinner(wheelItems[targetIndex]);
    setWinnerIndex(targetIndex);
    setShowConfetti(true);
    setSpinning(false);

    if (ctx) playWin(ctx);
  }, [spinning, N, segmentAngle, controls, wheelItems, getAudioCtx]);

  const handleRespin = () => {
    setWinner(null);
    setWinnerIndex(null);
    setShowConfetti(false);
    rotationRef.current = 0;
    controls.set({ rotate: 0 });
    setSpinKey(k => k + 1);
  };

  const confettiColors = ["#7B2FBE", "#ff4d4d", "#ff9900", "#ffffff", "#ffcc00", "#ff6b6b", "#6a28a6"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto py-6"
      style={{ background: "rgba(0,0,0,0.97)" }}
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 60% 50% at 30% 50%, rgba(123,47,190,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 70% 40%, rgba(197,8,18,0.04) 0%, transparent 70%)",
        }} />
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${5 + (i * 5.5) % 90}%`,
              top: `${10 + (i * 7.3) % 80}%`,
              background: i % 3 === 0 ? "#7B2FBE" : i % 3 === 1 ? "#6a28a6" : "#ff4d4d",
            }}
            animate={{ y: [-10, 10, -10], opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div className="relative w-full max-w-5xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-10">

        {/* LEFT: Wheel */}
        <div className="flex flex-col items-center gap-5 flex-shrink-0">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white tracking-wider uppercase">
              🎰 Ruleta <span style={{ color: "#7B2FBE", textShadow: "0 0 20px #7B2FBE" }}>Cine</span>
            </h2>
            <p className="text-white/30 text-xs mt-1">¿Qué película miro hoy?</p>
          </div>

          {/* Genre chips */}
          <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
            {MOVIE_GENRES.map(g => (
              <button
                key={g}
                onClick={() => { if (!spinning) { setGenre(g); setWinner(null); setWinnerIndex(null); setSpinKey(k => k + 1); } }}
                disabled={spinning}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all disabled:opacity-40 ${
                  genre === g ? "text-white" : "bg-white/8 text-white/50 hover:text-white border border-white/10"
                }`}
                style={genre === g ? {
                  background: "linear-gradient(135deg, #6a28a6, #7B2FBE)",
                  boxShadow: "0 0 12px rgba(123,47,190,0.4)",
                } : {}}
              >
                {g}
              </button>
            ))}
          </div>

          {/* THE WHEEL */}
          <div className="relative" style={{ width: 380, height: 380 }}>
            {/* Outer glow */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={spinning
                ? { boxShadow: ["0 0 30px #7B2FBE88", "0 0 60px #7B2FBEaa", "0 0 30px #7B2FBE88"] }
                : { boxShadow: "0 0 20px rgba(123,47,190,0.25)" }
              }
              transition={{ duration: 0.8, repeat: spinning ? Infinity : 0 }}
            />

            {/* Decorative rings */}
            <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: "rgba(123,47,190,0.25)" }} />
            <div className="absolute inset-3 rounded-full border" style={{ borderColor: "rgba(123,47,190,0.12)" }} />
            <div className="absolute inset-6 rounded-full border" style={{ borderColor: "rgba(197,8,18,0.08)" }} />

            {/* Tick marks */}
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  width: 2,
                  height: i % 6 === 0 ? 12 : 6,
                  background: i % 6 === 0 ? "rgba(123,47,190,0.5)" : "rgba(123,47,190,0.2)",
                  top: "50%",
                  left: "50%",
                  transformOrigin: "0 -183px",
                  transform: `rotate(${i * 15}deg) translateX(-1px) translateY(-183px)`,
                }}
              />
            ))}

            {/* Pointer (top) */}
            <div
              className="absolute z-20"
              style={{
                top: 6,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "20px solid #7B2FBE",
                filter: "drop-shadow(0 0 8px #7B2FBE)",
              }}
            />

            {/* Spinning container */}
            <motion.div
              animate={controls}
              className="absolute inset-0"
              style={{ originX: "50%", originY: "50%" }}
            >
              {wheelItems.map((movie, i) => {
                const angle = i * segmentAngle;
                const isWinner = winnerIndex === i;
                const rad = (angle - 90) * (Math.PI / 180);
                const cx = 190 + RADIUS * Math.cos(rad);
                const cy = 190 + RADIUS * Math.sin(rad);
                return (
                  <div
                    key={`${movie.id}-${spinKey}`}
                    className="absolute"
                    style={{ width: 56, height: 56, left: cx - 28, top: cy - 28 }}
                  >
                    <motion.div
                      animate={isWinner ? { scale: [1, 1.4, 1.2] } : { scale: 1 }}
                      transition={{ duration: 0.6, type: "spring" }}
                      className={`rounded-full overflow-hidden border-2 transition-colors ${
                        isWinner ? "border-yellow-400" : "border-red-700/50"
                      }`}
                      style={{
                        width: "100%",
                        height: "100%",
                        transform: `rotate(-${angle}deg)`,
                        boxShadow: isWinner
                          ? "0 0 16px #facc15, 0 0 32px rgba(250,204,21,0.4)"
                          : spinning ? "0 0 6px rgba(123,47,190,0.3)" : "none",
                      }}
                    >
                      {movie.posterUrl ? (
                        <img src={movie.posterUrl} alt={movie.titulo} className="w-full h-full object-cover" draggable={false} />
                      ) : (
                        <div className="w-full h-full bg-red-950/80 flex items-center justify-center p-1">
                          <span className="text-[7px] text-white text-center font-bold leading-tight line-clamp-3">{movie.titulo}</span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>

            {/* Center button */}
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <motion.button
                onClick={handleSpin}
                disabled={spinning || N === 0}
                whileHover={!spinning ? { scale: 1.08 } : {}}
                whileTap={!spinning ? { scale: 0.93 } : {}}
                className="w-[90px] h-[90px] rounded-full flex flex-col items-center justify-center gap-1 font-black text-xs tracking-widest uppercase text-white select-none disabled:cursor-not-allowed"
                style={{
                  background: spinning
                    ? "radial-gradient(circle, #7f0000, #450000)"
                    : "radial-gradient(circle, #7B2FBE, #6a28a6)",
                  boxShadow: spinning
                    ? "0 0 20px rgba(123,47,190,0.6), 0 0 40px rgba(123,47,190,0.3), inset 0 0 20px rgba(0,0,0,0.4)"
                    : "0 0 16px rgba(123,47,190,0.7), 0 0 32px rgba(197,8,18,0.4), inset 0 0 20px rgba(0,0,0,0.3)",
                  border: "3px solid rgba(123,47,190,0.6)",
                  transition: "background 0.3s, box-shadow 0.3s",
                }}
              >
                {spinning ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}>
                    <Dices className="w-7 h-7" />
                  </motion.div>
                ) : (
                  <>
                    <Dices className="w-5 h-5" />
                    <span>GIRAR</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          <p className="text-white/20 text-xs">{filtered.length} películas disponibles</p>

          <AnimatePresence>
            {winner && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                onClick={handleRespin}
                className="flex items-center gap-2 px-5 py-2 bg-white/8 hover:bg-white/15 rounded-full text-white/70 hover:text-white text-sm font-bold transition-all border border-white/10"
              >
                <Shuffle className="w-4 h-4" /> Volver a girar
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Result */}
        <div className="flex-1 min-w-0 w-full max-w-md">
          <AnimatePresence mode="wait">
            {!winner ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-72 gap-5 text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="text-7xl"
                >
                  🎬
                </motion.div>
                <div>
                  <p className="text-white/50 text-xl font-black">¡Gira y descubre!</p>
                  <p className="text-white/20 text-sm mt-1">Tu próxima película te espera</p>
                </div>
                <div className="w-24 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, transparent, rgba(123,47,190,0.5), transparent)" }} />
              </motion.div>
            ) : (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, x: 30, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 18 }}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(197,8,18,0.12) 0%, rgba(0,0,0,0.85) 100%)",
                  border: "1px solid rgba(123,47,190,0.2)",
                  boxShadow: "0 0 40px rgba(123,47,190,0.12), inset 0 0 40px rgba(0,0,0,0.3)",
                }}
              >
                {winner.backdropUrl && (
                  <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <img src={winner.backdropUrl} alt="" className="w-full h-full object-cover" draggable={false} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
                  </div>
                )}

                <div className="relative p-5 sm:p-6">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring" }}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4"
                    style={{ background: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.3)" }}
                  >
                    <span className="text-yellow-400 text-xs font-black tracking-wider">🏆 ¡PELÍCULA SELECCIONADA!</span>
                  </motion.div>

                  <div className="flex gap-4 mb-4">
                    <motion.div
                      initial={{ scale: 0.75, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="flex-shrink-0 w-24 rounded-xl overflow-hidden"
                      style={{ aspectRatio: "2/3", boxShadow: "0 0 24px rgba(123,47,190,0.45)" }}
                    >
                      {winner.posterUrl ? (
                        <img src={winner.posterUrl} alt={winner.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-red-950/60 flex items-center justify-center p-2">
                          <span className="text-white text-xs text-center font-bold">{winner.titulo}</span>
                        </div>
                      )}
                    </motion.div>

                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-white font-black text-lg sm:text-xl leading-tight mb-2 line-clamp-2">{winner.titulo}</h3>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-3 text-xs text-white/40">
                        {winner.año && <span>{winner.año}</span>}
                        {winner.duracion && <span className="text-red-400 font-semibold">{winner.duracion}</span>}
                      </div>
                      {winner.genero && (
                        <div className="flex flex-wrap gap-1">
                          {winner.genero.split(",").slice(0, 3).map((g, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ background: "rgba(197,8,18,0.3)", border: "1px solid rgba(123,47,190,0.25)", color: "#fca5a5" }}
                            >
                              {g.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {winner.sinopsis && (
                    <p className="text-white/50 text-xs leading-relaxed line-clamp-3 mb-5 border-l-2 pl-3" style={{ borderColor: "rgba(123,47,190,0.4)" }}>
                      {winner.sinopsis}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/watch/movie/${winner.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white"
                        style={{ background: "linear-gradient(135deg, #6a28a6, #7B2FBE)", boxShadow: "0 4px 16px rgba(123,47,190,0.5)" }}
                      >
                        <Play className="w-4 h-4 fill-white" /> Ver ahora
                      </motion.button>
                    </Link>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => toggle({
                        id: winner.id,
                        titulo: winner.titulo,
                        tipo: "movie",
                        posterUrl: winner.posterUrl ?? null,
                        backdropUrl: winner.backdropUrl ?? null,
                        año: winner.año ?? "",
                        categoria: "movie",
                      })}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white/80 hover:text-white transition-all"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(winner.id) ? "fill-[#7B2FBE] text-[#7B2FBE]" : ""}`} />
                      {isFavorite(winner.id) ? "En Mi Lista" : "Mi Lista"}
                    </motion.button>
                    <Link href={`/detail/movie/${winner.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white/80 hover:text-white transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}
                      >
                        <Star className="w-4 h-4" /> Ver info
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && Array.from({ length: 35 }).map((_, i) => (
          <motion.div
            key={`conf-${i}-${spinKey}`}
            className="absolute pointer-events-none rounded-sm"
            style={{
              width: 5 + (i % 5),
              height: 5 + (i % 5),
              left: "50%",
              top: "45%",
              background: confettiColors[i % confettiColors.length],
              borderRadius: i % 3 === 0 ? "50%" : "2px",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
            animate={{
              x: (Math.random() - 0.5) * 700,
              y: (Math.random() - 0.5) * 500,
              opacity: [1, 1, 0],
              scale: [0, 1.8, 0.6],
              rotate: Math.random() * 360,
            }}
            transition={{ duration: 1.2 + Math.random() * 0.8, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
