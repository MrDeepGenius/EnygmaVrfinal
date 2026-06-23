import { Link } from "wouter";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";

interface TopTenItem {
  id: string;
  titulo: string;
  posterUrl?: string | null;
  año?: string | null;
}

interface TopTenRankingProps {
  items: TopTenItem[];
  title?: string;
  type?: "movie" | "serie" | "anime";
  accentColor?: string;
  shadowColor?: string;
}

export function TopTenRanking({
  items,
  title = "Top 10 en ENYGMA",
  type = "movie",
  accentColor = "#E50914",
  shadowColor = "rgba(229,9,20,0.45)",
}: TopTenRankingProps) {
  if (!items || items.length === 0) return null;

  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 350;
    const newPosition =
      direction === "left"
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
    container.scrollTo({ left: newPosition, behavior: "smooth" });
    setScrollPosition(newPosition);
  };

  const detailHref = (id: string) =>
    type === "movie" ? `/detail/movie/${id}` : `/detail/${type}/${id}`;

  const top10 = items.slice(0, 10);

  return (
    <div className="px-4 md:px-10 lg:px-16 xl:px-20 overflow-visible">
      <div className="mb-5 flex items-center gap-3">
        <div
          className="w-1.5 h-8 rounded-full"
          style={{ background: accentColor, boxShadow: `0 0 12px ${shadowColor}` }}
        />
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">
          {title}
        </h2>
      </div>

      <div className="relative group overflow-visible">
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 md:-left-10 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth overflow-y-visible"
        >
          <div className="flex gap-7 pb-6 overflow-visible">
            {top10.map((item, index) => (
              <div key={item.id} className="flex-shrink-0 group/card relative">
                <div
                  className="absolute -bottom-1 -left-2 font-black pointer-events-none select-none leading-none z-10 overflow-visible"
                  style={{
                    fontSize: "clamp(72px, 9vw, 110px)",
                    WebkitTextStroke: "3px black",
                    color: accentColor,
                    transform: "translateY(30%)",
                    lineHeight: "1",
                    opacity: 0.92,
                  }}
                >
                  {index + 1}
                </div>

                <div className="relative w-36 md:w-48 aspect-[2/3] rounded-xl overflow-visible bg-zinc-900 border border-white/10 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 cursor-pointer">
                  <Link href={detailHref(item.id)} className="absolute inset-0 z-20" />

                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.titulo}
                      className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover/card:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-3 rounded-xl">
                      <span className="text-white/40 text-xs text-center font-bold leading-tight">{item.titulo}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-xl" />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 bg-black/40 transition-all duration-200 z-10 backdrop-blur-sm rounded-xl">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: accentColor }}
                    >
                      <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover/card:opacity-100 transition-all duration-200 bg-gradient-to-t from-black/95 to-transparent p-3 z-10 rounded-b-xl">
                    <p className="text-white/90 text-xs font-bold line-clamp-2 leading-tight">{item.titulo}</p>
                    {item.año && <p className="text-white/50 text-[10px] mt-0.5">{item.año}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 md:-right-10 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
