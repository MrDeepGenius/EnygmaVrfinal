import { Layout } from "@/components/layout";
import { PosterCard } from "@/components/poster-card";
import { useFavorites } from "@/lib/use-favorites";
import { Heart } from "lucide-react";

export default function MyList() {
  const { favorites } = useFavorites();

  const toItem = (f: typeof favorites[number]) => ({
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
  });

  return (
    <Layout>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-10 lg:px-16 xl:px-20 py-8">
        <h1 className="text-3xl md:text-4xl font-bold font-display uppercase tracking-wider mb-8 flex items-center gap-3">
          <Heart className="w-8 h-8 text-[#7B2FBE] fill-[#7B2FBE]" />
          Mi Lista
        </h1>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Heart className="w-16 h-16 text-white/10 mb-6" />
            <h2 className="text-xl font-display text-white/30 mb-2">Tu lista está vacía</h2>
            <p className="text-white/20 text-sm max-w-xs">
              Presiona el corazon en cualquier película o serie para agregarla aquí.
            </p>
          </div>
        ) : (
          <>
            <p className="text-white/30 text-sm mb-6">{favorites.length} {favorites.length === 1 ? "título guardado" : "títulos guardados"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {favorites.map((fav) => (
                <PosterCard
                  key={fav.id}
                  item={toItem(fav) as any}
                  type={fav.tipo}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
