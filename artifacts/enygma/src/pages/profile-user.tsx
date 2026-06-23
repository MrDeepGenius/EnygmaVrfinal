import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { LogOut, Play, Trash2, Star, Clock, Heart, Sparkles, ChevronRight } from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { useFavorites } from "@/lib/use-favorites";
import { useWatchProgress } from "@/lib/use-watch-progress";
import { Layout } from "@/components/layout";
import { useListMovies, useListSeries } from "@workspace/api-client-react";
import { useMemo } from "react";

const PROFILE_DATA = {
  senor: { name: "Sr. Enigma", avatar: "/avatar-senor.png", color: "#7B2FBE", glow: "#7B2FBE" },
  senora: { name: "Sra. Enigma", avatar: "/avatar-senora.png", color: "#e91e9e", glow: "#e91e9e" },
  kids: { name: "Kids", avatar: "/avatar-kids.png", color: "#facc15", glow: "#facc15" },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `hace ${m || 1} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export default function ProfileUser() {
  const [, setLocation] = useLocation();
  const { profile, setProfile } = useProfile();
  const { favorites } = useFavorites();
  const { progress, removeProgress } = useWatchProgress();

  const pd = profile ? PROFILE_DATA[profile] : null;

  // Fetch movies + series to generate AI recommendations based on favorites genres
  const { data: moviesData } = useListMovies({ limit: 200 });
  const { data: seriesData } = useListSeries({ limit: 100 });

  const aiRecommendations = useMemo(() => {
    if (!moviesData && !seriesData) return [];
    const favIds = new Set(favorites.map((f) => f.id));
    // Pick some items not in favorites as "recommendations"
    const pool = [
      ...(moviesData?.items || []).map((m) => ({ ...m, tipo: "movie" as const })),
      ...(seriesData?.items || []).map((s) => ({ ...s, tipo: "serie" as const })),
    ].filter((item) => !favIds.has(item.id) && item.posterUrl);
    // Shuffle deterministically and take 10
    return pool
      .sort((a, b) => (a.id > b.id ? 1 : -1))
      .slice(0, 10);
  }, [moviesData, seriesData, favorites]);

  if (!profile || !pd) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <button onClick={() => setLocation("/profiles")} className="text-white/60 hover:text-white text-sm">
          Seleccionar perfil
        </button>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-screen-lg mx-auto px-4 md:px-8 py-6 pb-10">

        {/* ── Profile Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2"
            style={{ borderColor: pd.color, boxShadow: `0 0 30px ${pd.glow}50` }}
          >
            <img src={pd.avatar} alt={pd.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black font-netflix text-white tracking-tight">{pd.name}</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {favorites.length} favoritos · {progress.length} vistos
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setLocation("/profiles")}
                className="flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white border border-white/15 hover:border-white/40 px-3 py-1.5 rounded-lg transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cambiar perfil
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Continuar Viendo ── */}
        {progress.length > 0 && (
          <Section
            icon={<Play className="w-4 h-4 text-[#7B2FBE]" />}
            title="Continuar Viendo"
            color="#7B2FBE"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {progress.slice(0, 8).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group cursor-pointer rounded-xl overflow-hidden bg-zinc-900 aspect-[2/3] border border-white/5"
                >
                  <Link href={`/watch/${item.tipo}/${item.id}`} className="absolute inset-0 z-20" />
                  {item.posterUrl ? (
                    <img src={item.posterUrl} alt={item.titulo} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center p-2">
                      <span className="text-white/30 text-xs text-center">{item.titulo}</span>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                  {/* Progress bar — red Netflix style */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                      className="h-full bg-[#7B2FBE] rounded-full"
                      style={{ width: `${Math.max(5, Math.min(95, item.progress * 100))}%` }}
                    />
                  </div>

                  {/* Info overlay */}
                  <div className="absolute bottom-1.5 left-0 right-0 px-2">
                    <p className="text-white text-[10px] font-bold line-clamp-1 font-netflix drop-shadow">{item.titulo}</p>
                    <p className="text-white/40 text-[9px]">{timeAgo(item.lastWatched)}</p>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeProgress(item.id); }}
                    className="absolute top-1.5 right-1.5 z-30 w-6 h-6 rounded-full bg-black/70 text-white/50 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Play icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Favoritos ── */}
        <Section
          icon={<Heart className="w-4 h-4 text-[#7B2FBE] fill-[#7B2FBE]" />}
          title="Mis Favoritos"
          color="#7B2FBE"
          linkHref="/mylist"
          linkLabel={`Ver todos (${favorites.length})`}
        >
          {favorites.length === 0 ? (
            <p className="text-white/30 text-sm py-6 text-center">
              Aun no tienes favoritos. Presiona el corazon en cualquier titulo.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {favorites.slice(0, 12).map((fav) => (
                <Link key={fav.id} href={`/detail/${fav.tipo}/${fav.id}`}>
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 cursor-pointer hover:scale-105 transition-transform border border-white/5 hover:border-[#7B2FBE]/40">
                    {fav.posterUrl ? (
                      <img src={fav.posterUrl} alt={fav.titulo} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center p-1">
                        <span className="text-white/30 text-[10px] text-center">{fav.titulo}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        {/* ── Historial ── */}
        <Section
          icon={<Clock className="w-4 h-4 text-white/50" />}
          title="Historial"
          color="#ffffff"
        >
          {progress.length === 0 ? (
            <p className="text-white/30 text-sm py-6 text-center">
              Tu historial aparecerá aqui cuando empieces a ver contenido.
            </p>
          ) : (
            <div className="space-y-2">
              {progress.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/5 hover:bg-white/7 hover:border-white/10 transition-all cursor-pointer group"
                >
                  <Link href={`/detail/${item.tipo}/${item.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {item.posterUrl && (
                      <img
                        src={item.posterUrl}
                        alt={item.titulo}
                        className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm font-netflix line-clamp-1">{item.titulo}</p>
                      <p className="text-white/40 text-xs mt-0.5 capitalize">{item.tipo} · {item.año}</p>
                      {/* Progress bar */}
                      <div className="mt-2 h-0.5 w-24 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7B2FBE] rounded-full"
                          style={{ width: `${Math.max(5, Math.min(95, item.progress * 100))}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-white/30 text-[10px]">{timeAgo(item.lastWatched)}</span>
                    <Link href={`/watch/${item.tipo}/${item.id}`}>
                      <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-[#7B2FBE] flex items-center justify-center transition-colors">
                        <Play className="w-3 h-3 fill-white ml-0.5" />
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Recomendaciones IA ── */}
        <Section
          icon={<Sparkles className="w-4 h-4 text-purple-400" />}
          title="Recomendado para ti"
          color="#a855f7"
          badge="IA"
        >
          {aiRecommendations.length === 0 ? (
            <p className="text-white/30 text-sm py-6 text-center">Cargando recomendaciones...</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {aiRecommendations.slice(0, 10).map((item) => (
                <Link key={item.id} href={`/detail/${item.tipo}/${item.id}`}>
                  <div className="flex flex-col cursor-pointer group">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-purple-500/40 transition-all group-hover:scale-[1.03]">
                      {item.posterUrl ? (
                        <img src={item.posterUrl} alt={item.titulo} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center p-1">
                          <span className="text-white/30 text-[10px] text-center">{item.titulo}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-white/60 text-[10px] mt-1 line-clamp-2 font-netflix leading-tight">{item.titulo}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

      </div>
    </Layout>
  );
}

function Section({
  icon,
  title,
  color,
  children,
  linkHref,
  linkLabel,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
  linkHref?: string;
  linkLabel?: string;
  badge?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-5 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
          {icon}
          <h2 className="text-base sm:text-lg font-black font-netflix text-white tracking-tight">{title}</h2>
          {badge && (
            <span className="text-[10px] font-black text-purple-300 bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        {linkHref && linkLabel && (
          <Link href={linkHref} className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors">
            {linkLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      {children}
    </motion.div>
  );
}
