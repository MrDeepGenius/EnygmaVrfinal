import { useGetHomeContent, useListMovies, useListSeries, useListAnime } from "@workspace/api-client-react";
import { useProfile } from "@/lib/profile-context";
import { useFavorites } from "@/lib/use-favorites";
import { Layout } from "@/components/layout";
import { Banner } from "@/components/banner";
import { HorizontalRow } from "@/components/horizontal-row";
import { ContinueWatchingRow } from "@/components/continue-watching-row";
import { TopTenRanking } from "@/components/top-ten-ranking";
import { AnimatePresence } from "framer-motion";
import { Dices } from "lucide-react";
import { RuletaCine } from "@/components/ruleta-cine";
import { useState, useMemo } from "react";

const ROTATION_DAYS = 4;
const epoch = Math.floor(Date.now() / (ROTATION_DAYS * 24 * 60 * 60 * 1000));

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function Home() {
  const { profile } = useProfile();
  const { favorites } = useFavorites();
  const [showRuleta, setShowRuleta] = useState(false);

  const { data: content, isLoading, isError, refetch } = useGetHomeContent(
    { profile: profile || undefined },
    {
      query: {
        staleTime: 0,
        refetchOnMount: true,
      },
    },
  );

  const { data: moviesData } = useListMovies(
    { limit: 50, profile: profile || undefined },
    { query: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 } },
  );
  const { data: seriesData } = useListSeries(
    { limit: 40, profile: profile || undefined },
    { query: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 } },
  );
  const { data: animeData } = useListAnime(
    { limit: 40, profile: profile || undefined },
    { query: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 } },
  );

  const allMovies = moviesData?.items || [];
  const allSeries = seriesData?.items || [];
  const allAnime  = animeData?.items  || [];

  const top10Movies2026 = useMemo(() =>
    allMovies.filter(m => m.año?.trim() === "2026").slice(0, 10),
    [allMovies]
  );

  const top10Series = useMemo(() => allSeries.slice(0, 10), [allSeries]);

  const byGenre = useMemo(() => (keywords: string[]) =>
    allMovies.filter((m) => {
      if (!m.genero) return false;
      const g = m.genero.toLowerCase();
      return keywords.some((k) => g.includes(k));
    }), [allMovies]);

  const actionMovies  = useMemo(() => seededShuffle(byGenre(["acción","action","aventura","adventure","thriller"]), epoch ^ 1), [byGenre]);
  const horrorMovies  = useMemo(() => seededShuffle(byGenre(["terror","horror","suspenso","suspense","miedo"]), epoch ^ 2), [byGenre]);
  const comedyMovies  = useMemo(() => seededShuffle(byGenre(["comedia","comedy","humor"]), epoch ^ 3), [byGenre]);
  const fantasyMovies = useMemo(() => seededShuffle(byGenre(["fantasía","fantasy","magia","animación","animation","infantil","familia","family"]), epoch ^ 4), [byGenre]);
  const crimeMovies   = useMemo(() => seededShuffle(byGenre(["crimen","crime","misterio","mystery","policial"]), epoch ^ 5), [byGenre]);
  const romanceMovies = useMemo(() => seededShuffle(byGenre(["romance","romántico","romantic","amor"]), epoch ^ 6), [byGenre]);
  const scifiMovies   = useMemo(() => seededShuffle(byGenre(["ciencia ficción","sci-fi","scifi","science fiction","ciencia"]), epoch ^ 7), [byGenre]);
  const dramaMovies   = useMemo(() => seededShuffle(byGenre(["drama"]), epoch ^ 8), [byGenre]);

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full h-[55vh] bg-zinc-900 animate-pulse" />
        <div className="px-4 pt-6 space-y-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-6 w-48 bg-zinc-800 animate-pulse rounded mb-4" />
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex-shrink-0 w-[130px] aspect-[2/3] bg-zinc-800 animate-pulse rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  if (isError || !content) {
    return (
      <Layout>
        <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-6">
          <p className="text-white/70 text-lg font-medium">No se pudo cargar el contenido</p>
          <button
            onClick={() => refetch()}
            className="px-8 py-3 bg-[#E50914] text-white rounded-xl font-bold"
          >
            Reintentar
          </button>
        </div>
      </Layout>
    );
  }

  const bannerItems  = content.banner       || [];
  const top10Items   = content.top10        || [];
  const latestMovies = content.latestMovies || [];

  return (
    <Layout>
      {/* ── HERO ── */}
      <div className="-mt-14 md:-mt-20">
        <Banner items={bannerItems} />
      </div>

      <div className="space-y-2 pb-10">

        {/* Continuar viendo */}
        <ContinueWatchingRow />

        {/* Mi Lista */}
        {favorites.length > 0 && (
          <HorizontalRow
            title="Mi Lista"
            items={favorites.map((f) => ({
              id: f.id,
              titulo: f.titulo,
              posterUrl: f.posterUrl,
              backdropUrl: f.backdropUrl,
              año: f.año,
              categoria: f.categoria,
              genero: "",
              sinopsis: "",
              esVip: false,
              videoUrl: "",
            })) as any}
            type="movie"
            variant="landscape"
          />
        )}

        {/* Ruleta Cine */}
        <div className="px-4 md:px-10 pt-2 pb-1">
          <button
            onClick={() => setShowRuleta(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg,#7B2FBE,#9B59E8)", boxShadow: "0 6px 20px rgba(123,47,190,.4)" }}
          >
            <Dices className="w-4 h-4" />
            Ruleta Cine
          </button>
        </div>

        <AnimatePresence>
          {showRuleta && <RuletaCine items={allMovies} onClose={() => setShowRuleta(false)} />}
        </AnimatePresence>

        {/* ── Estrenos Recientes ── */}
        {latestMovies.length > 0 && (
          <HorizontalRow
            title="Estrenos Recientes"
            items={latestMovies}
            type="movie"
            variant="portrait"
          />
        )}

        {/* ── Top 10 Películas 2026 ── */}
        {top10Movies2026.length > 0 && (
          <TopTenRanking
            items={top10Movies2026}
            title="Top 10 Películas 2026"
            type="movie"
            accentColor="#E50914"
            shadowColor="rgba(229,9,20,0.45)"
          />
        )}

        {/* ── Top 10 Series ── */}
        {top10Series.length > 0 && (
          <TopTenRanking
            items={top10Series}
            title="Top 10 Series"
            type="serie"
            accentColor="#0ea5e9"
            shadowColor="rgba(14,165,233,0.45)"
          />
        )}

        {/* ── Top 10 (home API) ── */}
        {top10Items.length > 0 && (
          <TopTenRanking
            items={top10Items}
            title="Top 10 en ENYGMA"
            type="movie"
            accentColor="#E50914"
            shadowColor="rgba(229,9,20,0.45)"
          />
        )}

        {/* ── Adrenalina Pura (Acción) ── */}
        {actionMovies.length > 0 && (
          <HorizontalRow
            title="Adrenalina Pura"
            items={actionMovies}
            type="movie"
            variant="portrait"
          />
        )}

        {/* ── Series: Atrapados en la Pantalla ── */}
        {allSeries.length > 0 && (
          <HorizontalRow
            title="Atrapados en la Pantalla"
            items={allSeries}
            type="serie"
            variant="portrait"
          />
        )}

        {/* ── Noches de Terror ── */}
        {horrorMovies.length > 0 && (
          <HorizontalRow
            title="Noches de Terror"
            items={horrorMovies}
            type="movie"
            variant="portrait"
          />
        )}

        {/* ── Anime: El Mundo del Anime ── */}
        {allAnime.length > 0 && (
          <HorizontalRow
            title="El Mundo del Anime"
            items={allAnime}
            type="anime"
            variant="portrait"
          />
        )}

        {/* ── Entre Risas (Comedia) ── */}
        {comedyMovies.length > 0 && (
          <HorizontalRow
            title="Entre Risas"
            items={comedyMovies}
            type="movie"
            variant="portrait"
          />
        )}

        {/* ── La Magia en Tu Pantalla (Fantasía / Animación) ── */}
        {fantasyMovies.length > 0 && (
          <HorizontalRow
            title="La Magia en Tu Pantalla"
            items={fantasyMovies}
            type="movie"
            variant="portrait"
          />
        )}

        {/* ── Crimen y Misterio ── */}
        {crimeMovies.length > 0 && (
          <HorizontalRow
            title="Crimen y Misterio"
            items={crimeMovies}
            type="movie"
            variant="portrait"
          />
        )}

        {/* ── Cuando el Amor Llama (Romance) ── */}
        {romanceMovies.length > 0 && (
          <HorizontalRow
            title="Cuando el Amor Llama"
            items={romanceMovies}
            type="movie"
            variant="portrait"
          />
        )}

        {/* ── Viaje al Futuro (Sci-Fi) ── */}
        {scifiMovies.length > 0 && (
          <HorizontalRow
            title="Viaje al Futuro"
            items={scifiMovies}
            type="movie"
            variant="portrait"
          />
        )}

        {/* ── Historias que Trascienden (Drama) ── */}
        {dramaMovies.length > 0 && (
          <HorizontalRow
            title="Historias que Trascienden"
            items={dramaMovies}
            type="movie"
            variant="portrait"
          />
        )}

      </div>
    </Layout>
  );
}
