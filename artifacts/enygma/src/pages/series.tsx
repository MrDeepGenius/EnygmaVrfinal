import { useListSeries, useGetTmdbDetails, getGetTmdbDetailsQueryKey } from "@workspace/api-client-react";
import { AdBannerSlot } from "@/components/ad-banner";
import { useProfile } from "@/lib/profile-context";
import { Layout } from "@/components/layout";
import { PosterCard } from "@/components/poster-card";

import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import type { Series } from "@workspace/api-client-react";
import { readLocalCache, writeLocalCache } from "@/lib/local-cache";

const PAGE_SIZE = 120;
const SERIES_GENRES = ["Acción", "Drama", "Comedia", "Thriller", "Crimen", "Sci-Fi", "Terror", "Romance", "Fantasía", "Misterio"];

function SectionHero({ items }: { items: Series[] }) {
  const [, setLocation] = useLocation();
  const [idx, setIdx] = useState(0);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heroItems = useMemo(() => {
    const withBackdrop = items.filter(s => s.backdropUrl);
    if (withBackdrop.length <= 8) return withBackdrop;
    return [...withBackdrop].sort(() => Math.random() - 0.5).slice(0, 8);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length > 0]);

  const item = heroItems[displayIdx] ?? null;

  const tmdbParams = { tmdbId: item?.id ?? "", type: "tv" as const };
  const { data: tmdb } = useGetTmdbDetails(tmdbParams, {
    query: { enabled: !!item?.id, queryKey: getGetTmdbDetailsQueryKey(tmdbParams) },
  });

  const backdrop = tmdb?.backdropPath || item?.backdropUrl;
  const logo = tmdb?.logoPath || item?.logoUrl;
  const synopsis = tmdb?.overview || item?.sinopsis;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(p => (p + 1) % Math.max(heroItems.length, 1)), 7000);
  }, [heroItems.length]);

  useEffect(() => {
    if (!heroItems.length) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [heroItems.length, resetTimer]);

  useEffect(() => {
    if (idx === displayIdx) return;
    setFading(true);
    if (transRef.current) clearTimeout(transRef.current);
    transRef.current = setTimeout(() => { setDisplayIdx(idx); setFading(false); }, 280);
    return () => { if (transRef.current) clearTimeout(transRef.current); };
  }, [idx]);

  if (!item || !backdrop) return null;

  const goTo = (i: number) => { setIdx(i); resetTimer(); };

  return (
    <div
      className="relative w-full select-none -mt-14 md:-mt-20 cursor-pointer overflow-hidden"
      style={{ height: "62svh", minHeight: 360 }}
      onClick={() => setLocation(`/detail/serie/${item.id}`)}
    >
      <div className="absolute inset-0" style={{ opacity: fading ? 0 : 1, transition: "opacity 0.35s ease" }}>
        <img
          src={backdrop}
          alt={item.titulo}
          className="w-full h-full object-cover object-center"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.72) 68%, rgba(0,0,0,0.97) 100%)"
      }} />

      <div
        className="absolute inset-0 flex flex-col justify-end items-center pb-12 px-6 text-center pointer-events-none"
        style={{ opacity: fading ? 0 : 1, transition: "opacity 0.35s ease" }}
      >
        {logo ? (
          <img
            src={logo}
            alt={item.titulo}
            className="max-h-16 sm:max-h-24 md:max-h-28 max-w-[220px] sm:max-w-xs md:max-w-sm object-contain mb-2"
            style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.9))" }}
            decoding="async"
          />
        ) : (
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 leading-tight tracking-tight" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
            {item.titulo}
          </h2>
        )}

        <div className="flex items-center gap-2 text-white/65 text-xs font-semibold mb-2">
          {item.año && <span>{item.año}</span>}
          {item.totalSeasons && <><span className="w-px h-3 bg-white/30 rounded-full" /><span>{item.totalSeasons} Temp.</span></>}
        </div>

        {synopsis && (
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-sm line-clamp-2 mb-3" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
            {synopsis}
          </p>
        )}

        {heroItems.length > 1 && (
          <div className="flex items-center gap-2">
            {heroItems.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                className={`transition-all duration-300 rounded-full pointer-events-auto ${i === idx ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/35 hover:bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </div>

      {heroItems.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); goTo((idx - 1 + heroItems.length) % heroItems.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/70 hover:text-white transition-all backdrop-blur-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); goTo((idx + 1) % heroItems.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/70 hover:text-white transition-all backdrop-blur-sm">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}

export default function SeriesPage() {
  const { profile } = useProfile();
  const [genre, setGenre] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<Series[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const cacheKey = `enygma:series:first:${profile || "default"}`;
  const cachedFirstPage = readLocalCache<{ items: Series[]; total: number }>(cacheKey, 24 * 60 * 60 * 1000);

  const { data, isLoading, isFetching } = useListSeries({
    profile: profile || undefined,
    limit: PAGE_SIZE,
    offset,
  }, { query: { placeholderData: offset === 0 ? (cachedFirstPage as any) : undefined } });

  useEffect(() => { if (data && offset === 0) writeLocalCache(cacheKey, data as any); }, [data, offset, cacheKey]);
  useEffect(() => { setOffset(0); setItems([]); setHasMore(true); }, [profile]);
  useEffect(() => {
    if (!data) return;
    const next = data.items || [];
    setItems((prev) => (offset === 0 ? next : [...prev, ...next]));
    setHasMore(next.length === PAGE_SIZE);
  }, [data, offset]);

  const allRaw: Series[] = items.length > 0 ? items : (offset === 0 ? (data?.items || []) : []);

  const yearOptions = useMemo(() => {
    const years = allRaw.map(s => s.año?.trim()).filter((y): y is string => !!y && /^\d{4}$/.test(y)).map(Number);
    const unique = Array.from(new Set(years)).sort((a, b) => b - a);
    const maxY = unique[0] ?? new Date().getFullYear();
    const minY = unique[unique.length - 1] ?? maxY;
    const result: number[] = [];
    for (let y = Math.max(maxY, 2026); y >= minY; y--) result.push(y);
    return result;
  }, [allRaw]);

  const allItems = useMemo(() => {
    let filtered = allRaw;
    if (genre) filtered = filtered.filter(s => s.genero?.toLowerCase().includes(genre.toLowerCase()));
    if (year) filtered = filtered.filter(s => s.año?.trim() === year);
    return filtered;
  }, [allRaw, genre, year]);

  const loadMore = useCallback(() => { if (hasMore && !isFetching) setOffset(p => p + PAGE_SIZE); }, [hasMore, isFetching]);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore);

  return (
    <Layout>
      {!isLoading && allRaw.length > 0 && <SectionHero items={allRaw} />}

      <AdBannerSlot className="px-4 md:px-10 pt-2" />

      <div className="max-w-screen-2xl mx-auto px-3 md:px-10 lg:px-16 xl:px-20 py-6 bg-black">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="aspect-[2/3] rounded-lg bg-zinc-800 animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : allItems.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-4">
              {allItems.map(serie => <PosterCard key={serie.id} item={serie} type="serie" variant="grid" />)}
            </div>
            {hasMore && (
              <><div ref={sentinelRef} className="h-1" /><div className="flex justify-center mt-6"><div className="w-5 h-5 border-2 border-sky-400/40 border-t-sky-400 rounded-full animate-spin" /></div></>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-white/30"><p className="text-sm">No se encontraron series.</p></div>
        )}
      </div>
    </Layout>
  );
}
