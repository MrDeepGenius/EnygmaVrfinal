import { useRoute, Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useListMovies } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { PosterCard } from "@/components/poster-card";
import { useEffect, useMemo } from "react";

const CATEGORY_INFO: Record<string, { title: string; emoji: string }> = {
  "seleccion-enygma": { title: "Selección ENYGMA", emoji: "👑" },
  "tendencia-global": { title: "Tendencia Global", emoji: "🔥" },
  "joyas-ocultas": { title: "Joyas Ocultas", emoji: "💎" },
  "maraton-perfecta": { title: "Maratón Perfecta", emoji: "🍿" },
  "ver-esta-noche": { title: "Para Ver Esta Noche", emoji: "🌙" },
};

export default function CategoryPage() {
  const [, params] = useRoute("/category/:slug");
  const slug = params?.slug;

  const { data: moviesData } = useListMovies({ limit: 500 });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const categoryInfo = slug ? CATEGORY_INFO[slug] : null;
  const movies = useMemo(() => {
    if (!moviesData?.items) return [];
    // Shuffular las películas para que sea aleatorio cada vez
    const shuffled = [...moviesData.items].sort(() => Math.random() - 0.5);
    return shuffled;
  }, [moviesData]);

  if (!categoryInfo) {
    return (
      <Layout>
        <div className="w-full h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-white/70 text-lg mb-4">Categoría no encontrada</p>
            <Link href="/">
              <button className="px-6 py-3 bg-[#7B2FBE] hover:bg-[#6a28a6] text-white font-bold rounded-lg">
                ← Volver al Home
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Header */}
      <div className="relative w-full h-[40vh] md:h-[50vh] -mt-16 md:-mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Back button */}
        <div className="absolute top-8 left-6 z-20">
          <Link href="/">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white rounded-full border border-white/20 transition-all font-medium">
              <ChevronLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          </Link>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 pb-8 md:pb-12">
          <div className="space-y-3 md:space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-none tracking-tighter" style={{
              textShadow: "0 8px 24px rgba(0,0,0,0.9)"
            }}>
              <span className="text-5xl sm:text-6xl md:text-7xl">{categoryInfo.emoji}</span> {categoryInfo.title}
            </h1>
            <p className="text-sm md:text-base text-white/80 font-semibold">
              {movies.length} películas disponibles
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="bg-gradient-to-b from-black via-black to-black/95">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-8 md:py-12">
          {movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {movies.map((movie) => (
                <PosterCard key={movie.id} item={movie} type="movie" variant="grid" />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-white/40">
              <p className="text-base md:text-lg">No hay películas disponibles en esta categoría</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
