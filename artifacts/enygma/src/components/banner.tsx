import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGetTmdbDetails, getGetTmdbDetailsQueryKey } from "@workspace/api-client-react";
import type { Movie } from "@workspace/api-client-react";

interface BannerProps {
  items: Movie[];
}

export function Banner({ items }: BannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [, setLocation] = useLocation();
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayItem = items[displayIndex] ?? items[0];
  const tmdbType = displayItem?.categoria === "serie" || displayItem?.categoria === "anime" ? "tv" : "movie";
  const tmdbParams = { tmdbId: displayItem?.id ?? "", type: tmdbType as "movie" | "tv" };
  const { data: tmdb } = useGetTmdbDetails(tmdbParams, {
    query: { enabled: !!displayItem?.id, queryKey: getGetTmdbDetailsQueryKey(tmdbParams) },
  });

  const logoSrc = displayItem?.logoUrl || tmdb?.logoPath || null;

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, 7000);
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
    resetTimer();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % items.length);
    resetTimer();
  };

  const handleDotClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setCurrentIndex(idx);
    resetTimer();
  };

  const handleBannerClick = () => {
    if (!displayItem) return;
    const cat = displayItem.categoria;
    if (cat === "serie" || cat === "anime") {
      setLocation(`/detail/${cat}/${displayItem.id}`);
    } else {
      setLocation(`/detail/movie/${displayItem.id}`);
    }
  };

  useEffect(() => {
    if (!items || items.length === 0) return;
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items]);

  useEffect(() => {
    if (currentIndex === displayIndex) return;
    setFading(true);
    if (transitionRef.current) clearTimeout(transitionRef.current);
    transitionRef.current = setTimeout(() => {
      setDisplayIndex(currentIndex);
      setFading(false);
    }, 250);
    return () => { if (transitionRef.current) clearTimeout(transitionRef.current); };
  }, [currentIndex]);

  if (!items || items.length === 0) return null;

  // Use backdrop (original quality, cinematic landscape) as primary.
  // posterUrl is w500 portrait — only use as last resort if no backdrop.
  const imageSrc = displayItem.backdropUrl || displayItem.posterUrl;

  return (
    <div className="relative w-full select-none">
      {/* Banner container — full height, cursor pointer, clickable */}
      <div
        className="relative w-full overflow-hidden cursor-pointer"
        style={{ height: "90svh", minHeight: 480 }}
        onClick={handleBannerClick}
      >
        {/* Background image with fade */}
        <div
          className="absolute inset-0"
          style={{ opacity: fading ? 0 : 1, transition: "opacity 0.35s ease" }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={displayItem.titulo}
              className="w-full h-full object-cover object-center"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
          )}
        </div>

        {/* Gradient overlays — heavy at bottom, subtle at top */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)"
        }} />

        {/* Content — bottom aligned, centered on mobile */}
        <div
          className="absolute inset-0 flex flex-col justify-end items-center pb-14 px-6 text-center pointer-events-none"
          style={{ opacity: fading ? 0 : 1, transition: "opacity 0.35s ease" }}
        >
          {/* Logo or Title */}
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={displayItem.titulo}
              className="max-h-20 sm:max-h-28 md:max-h-36 max-w-[260px] sm:max-w-xs md:max-w-lg object-contain mb-3"
              style={{ filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.95))" }}
              loading="eager"
              decoding="async"
            />
          ) : (
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-2 leading-none"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)", fontFamily: "'Montserrat', sans-serif" }}
            >
              {displayItem.titulo}
            </h1>
          )}

          {/* Tagline / categoria */}
          {displayItem.genero && (
            <p className="text-white/70 text-[11px] sm:text-xs font-bold tracking-[0.15em] uppercase mb-2">
              {displayItem.genero.split(",").slice(0, 3).map((g: string) => g.trim()).join("  ·  ")}
            </p>
          )}

          {/* Metadata — year · rating */}
          <div className="flex items-center gap-3 text-white/60 text-xs font-semibold mb-3">
            {displayItem.edadRecomendada && (
              <span>{displayItem.edadRecomendada}+</span>
            )}
            {displayItem.edadRecomendada && displayItem.año && (
              <span className="w-0.5 h-3 bg-white/30 rounded-full" />
            )}
            {displayItem.año && <span>{displayItem.año}</span>}
          </div>

          {/* Synopsis */}
          {displayItem.sinopsis && (
            <p
              className="text-white/80 text-sm sm:text-base leading-relaxed max-w-sm sm:max-w-md line-clamp-3 font-medium mb-4"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
            >
              {displayItem.sinopsis}
            </p>
          )}

          {/* Carousel dots */}
          <div className="flex items-center gap-2 mt-1">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => handleDotClick(e, idx)}
                className={`transition-all duration-300 rounded-full pointer-events-auto ${
                  idx === currentIndex
                    ? "w-6 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/35 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Left arrow */}
        <button
          onClick={handlePrevious}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/70 hover:text-white transition-all backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Right arrow */}
        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/70 hover:text-white transition-all backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
}
