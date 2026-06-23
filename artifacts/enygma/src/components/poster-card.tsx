import { useState } from "react";
import { Link } from "wouter";
import { Play, Heart, Star } from "lucide-react";
import type { Movie, Series } from "@workspace/api-client-react";
import { useFavorites } from "@/lib/use-favorites";
import { prefetchItemDetail } from "@/lib/prefetch-detail";

interface PosterCardProps {
  item: Movie | Series;
  rank?: number;
  type: "movie" | "serie" | "anime";
  variant?: "portrait" | "landscape" | "grid";
  eager?: boolean;
}

function Shimmer() {
  return (
    <div className="absolute inset-0 bg-zinc-800 overflow-hidden">
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}

export function PosterCard({ item, rank, type, variant = "portrait", eager = false }: PosterCardProps) {
  const { toggle, isFavorite } = useFavorites();
  const favorited = isFavorite(item.id);
  const rating = (item as Movie).valoracion;
  const loading = eager ? "eager" : "lazy";
  const fetchPriority = eager ? "high" : "auto";
  const [loaded, setLoaded] = useState(false);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      id: item.id,
      titulo: item.titulo,
      tipo: type,
      posterUrl: item.posterUrl ?? null,
      backdropUrl: item.backdropUrl ?? null,
      año: item.año ?? "",
      categoria: type,
    });
  };

  /* ─── GRID variant ─── */
  if (variant === "grid") {
    return (
      <div className="flex flex-col">
        <div className="relative group rounded-2xl overflow-hidden bg-zinc-900 aspect-[2/3] ring-1 ring-white/10 hover:ring-purple-500/60 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
          <Link
            href={`/detail/${type}/${item.id}`}
            className="absolute inset-0 z-20 rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          />

          {item.posterUrl ? (
            <>
              {!loaded && <Shimmer />}
              <img
                src={item.posterUrl}
                alt={item.titulo}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease, transform 0.3s ease" }}
                loading={loading}
                decoding="async"
                fetchPriority={fetchPriority}
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 15vw"
                onLoad={() => setLoaded(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-2 bg-zinc-800">
              <span className="font-bold text-xs text-white/50 text-center leading-tight">{item.titulo}</span>
            </div>
          )}

          {rating && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/85 rounded-lg px-2 py-1 backdrop-blur-md pointer-events-none border border-yellow-400/30">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-black text-yellow-400 leading-none">{Number(rating).toFixed(1)}</span>
            </div>
          )}

          <button
            onClick={handleFavorite}
            className={`absolute top-2 left-2 z-30 w-7 h-7 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center transition-all border border-white/20 hover:border-purple-500/60
              ${favorited ? "opacity-100 bg-purple-500/20 border-purple-500/60" : "opacity-0 group-hover:opacity-100"}`}
          >
            <Heart className={`w-3.5 h-3.5 ${favorited ? "text-purple-500 fill-purple-500" : "text-white"}`} />
          </button>

          <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-sm transition-all duration-200 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-purple-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </div>
          </div>
        </div>
        <div className="mt-2 px-0.5">
          <p className="text-white text-xs font-black leading-tight line-clamp-2 font-netflix">{item.titulo}</p>
          <p className="text-white/50 text-[10px] mt-1 font-medium">{item.año}</p>
        </div>
      </div>
    );
  }

  /* ─── LANDSCAPE variant ─── */
  if (variant === "landscape") {
    const imageUrl = item.backdropUrl || item.posterUrl;
    return (
      <div
        className="relative group flex-shrink-0 w-[190px] sm:w-[250px] md:w-[290px] aspect-video rounded-xl overflow-hidden bg-zinc-900 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300"
        style={{ transition: "transform 0.2s ease, box-shadow 0.3s ease", willChange: "transform" }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.06)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(123,47,190,0.4)";
          prefetchItemDetail(item.id, type);
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,.5)";
        }}
      >
        <Link
          href={`/detail/${type}/${item.id}`}
          className="absolute inset-0 z-20 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        />

        {imageUrl ? (
          <>
            {!loaded && <Shimmer />}
            <img
              src={imageUrl}
              alt={item.titulo}
              className="w-full h-full object-cover"
              style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease" }}
              loading={loading}
              decoding="async"
              fetchPriority={fetchPriority}
              sizes="(max-width: 640px) 55vw, (max-width: 1024px) 30vw, 20vw"
              onLoad={() => setLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3 bg-zinc-800">
            <span className="font-bold text-sm text-white/70">{item.titulo}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

        {rank && (
          <div
            className="absolute -left-3 bottom-0 text-[85px] sm:text-[110px] md:text-[130px] font-black leading-none tracking-tighter font-display z-10 pointer-events-none select-none"
            style={{
              color: "#7B2FBE",
              WebkitTextStroke: "2.5px #000",
              textShadow: "0 0 30px rgba(123,47,190,0.6),4px 8px 16px rgba(0,0,0,0.95)",
              filter: "drop-shadow(0 0 20px rgba(123,47,190,0.5))"
            }}
          >
            {rank}
          </div>
        )}

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-10 pointer-events-none">
          <div className="flex items-start justify-between">
            {rating && (
              <div className="flex items-center gap-1 bg-black/70 rounded-lg px-2 py-1 backdrop-blur-md border border-yellow-400/40">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-black text-yellow-400">{Number(rating).toFixed(1)}</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-white font-black text-sm line-clamp-2 mb-2 font-netflix uppercase tracking-wide">{item.titulo}</h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              </div>
              <span className="text-white/70 text-xs ml-auto font-bold">{item.año}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── PORTRAIT variant (default) ─── */
  return (
    <div
      className="relative group flex-shrink-0 w-[110px] sm:w-[150px] md:w-[180px] aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300"
      style={{ transition: "transform 0.18s ease, box-shadow 0.3s ease" }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "scale(1.08)";
        e.currentTarget.style.boxShadow = "0 15px 40px rgba(123,47,190,0.4)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,.5)";
      }}
    >
      <Link
        href={`/detail/${type}/${item.id}`}
        className="absolute inset-0 z-20 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      />

      {item.posterUrl ? (
        <>
          {!loaded && <Shimmer />}
          <img
            src={item.posterUrl}
            alt={item.titulo}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
            style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease" }}
            loading={loading}
            decoding="async"
            fetchPriority={fetchPriority}
            sizes="(max-width: 640px) 32vw, (max-width: 1024px) 18vw, 12vw"
            onLoad={() => setLoaded(true)}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-3 bg-zinc-800">
          <span className="font-display font-black text-xs text-white/70 text-center leading-tight">{item.titulo}</span>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

      <button
        onClick={handleFavorite}
        className={`absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center transition-all border border-white/20 hover:border-purple-500/60
          ${favorited ? "opacity-100 bg-purple-500/20 border-purple-500/60" : "opacity-0 group-hover:opacity-100"}`}
      >
        <Heart className={`w-3.5 h-3.5 ${favorited ? "text-purple-500 fill-purple-500" : "text-white"}`} />
      </button>

      {rating && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-0.5 bg-black/80 backdrop-blur-md rounded-lg px-2 py-1 border border-yellow-400/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-black text-yellow-400">{Number(rating).toFixed(1)}</span>
        </div>
      )}

      {rank && (
        <div
          className="absolute -left-2 sm:-left-3 bottom-0 text-[85px] sm:text-[120px] font-black leading-none tracking-tighter font-display z-10 pointer-events-none select-none"
          style={{
            color: "#7B2FBE",
            WebkitTextStroke: "3px #000",
            textShadow: "0 0 30px rgba(123,47,190,0.7),4px 8px 16px rgba(0,0,0,0.95)",
            filter: "drop-shadow(0 0 20px rgba(123,47,190,0.6))"
          }}
        >
          {rank}
        </div>
      )}

      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2.5 z-10 pointer-events-none">
        <p className="text-white font-black text-xs line-clamp-3 font-netflix leading-tight">{item.titulo}</p>
      </div>
    </div>
  );
}
