import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PosterCard } from "./poster-card";
import type { Movie, Series } from "@workspace/api-client-react";

interface HorizontalRowProps {
  title: string;
  items: (Movie | Series)[];
  type: "movie" | "serie" | "anime";
  isNumbered?: boolean;
  variant?: "portrait" | "landscape";
  eagerCount?: number;
}

function useLazyVisible(rootMargin = "300px") {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

export function HorizontalRow({ title, items, type, isNumbered = false, variant = "portrait", eagerCount = 4 }: HorizontalRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const { ref: sentinelRef, visible } = useLazyVisible("300px");

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth + 100 : scrollLeft + clientWidth - 100;
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div
      ref={sentinelRef}
      className="w-full mb-4 sm:mb-6 relative group/row px-4 md:px-10 lg:px-16 xl:px-20"
      style={{ minHeight: variant === "landscape" ? "200px" : "260px", contentVisibility: "auto" }}
    >
      {/* Título premium */}
      <div className="mb-4 sm:mb-6 relative">
        <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase font-display tracking-tighter text-white drop-shadow-lg">
          {title}
        </h2>
        <div className="absolute bottom-0 left-0 h-1 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-purple-500 via-red-600 to-transparent rounded-full mt-2" />
      </div>

      {visible ? (
        <div className="relative">
          {/* Left scroll button */}
          <button
            onClick={() => scroll("left")}
            className="absolute -left-4 md:-left-10 lg:-left-16 xl:-left-20 top-0 bottom-0 w-12 flex items-center justify-center bg-gradient-to-r from-black/90 via-black/40 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 z-40 hover:text-purple-500 text-white/70"
          >
            <ChevronLeft className="w-8 h-8 drop-shadow-lg" />
          </button>

          <div
            ref={rowRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x pt-1 pb-6 -mt-1"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {items.map((item, index) => (
              <div key={item.id} className="snap-start flex-shrink-0">
                <PosterCard
                  item={item}
                  rank={isNumbered ? index + 1 : undefined}
                  type={type}
                  variant={variant}
                  eager={index < eagerCount}
                />
              </div>
            ))}
          </div>

          {/* Right scroll button */}
          <button
            onClick={() => scroll("right")}
            className="absolute -right-4 md:-right-10 lg:-right-16 xl:-right-20 top-0 bottom-0 w-12 flex items-center justify-center bg-gradient-to-l from-black/90 via-black/40 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 z-40 hover:text-purple-500 text-white/70"
          >
            <ChevronRight className="w-8 h-8 drop-shadow-lg" />
          </button>
        </div>
      ) : (
        <div className="flex gap-3 sm:gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex-shrink-0 rounded-xl bg-zinc-900 animate-pulse ${variant === "landscape" ? "w-[200px] sm:w-[260px] aspect-video" : "w-[130px] sm:w-[170px] aspect-[2/3]"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
