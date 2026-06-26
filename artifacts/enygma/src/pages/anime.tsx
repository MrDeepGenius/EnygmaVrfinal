import { useListAnime, useGetTmdbDetails, getGetTmdbDetailsQueryKey } from "@workspace/api-client-react";
import { AdBannerSlot } from "@/components/ad-banner";
import { useProfile } from "@/lib/profile-context";
import { Layout } from "@/components/layout";
import { PosterCard } from "@/components/poster-card";

import { HorizontalRow } from "@/components/horizontal-row";
import { RuletaAnime } from "@/components/ruleta-anime";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Dices } from "lucide-react";
import { useLocation } from "wouter";
import type { Series } from "@workspace/api-client-react";
import { readLocalCache, writeLocalCache } from "@/lib/local-cache";

const PAGE_SIZE = 120;

const ANIME_GENRES = [
  { label: "🔥 Shonen", value: "Shonen" },
  { label: "🌑 Dark Fantasy", value: "Dark Fantasy" },
  { label: "😱 Horror", value: "Horror" },
  { label: "💜 Romance", value: "Romance" },
  { label: "⚙️ Mecha", value: "Mecha" },
  { label: "✨ Isekai", value: "Isekai" },
  { label: "⚡ Acción", value: "Acción" },
  { label: "😂 Comedia", value: "Comedia" },
];

function SectionHero({ items }: { items: Series[] }) {
  const [, setLocation] = useLocation();
  const [idx, setIdx] = useState(0);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heroItems = useMemo(() => {
    const withBackdrop = items.filter(a => a.backdropUrl);
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
      onClick={() => setLocation(`/detail/anime/${item.id}`)}
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

export default function AnimePage() {
  const { profile } = useProfile();
  const [genre, setGenre] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<Series[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [showRuleta, setShowRuleta] = useState(false);

  const cacheKey = `enygma:anime:first:${profile || "default"}`;
  const cachedFirstPage = readLocalCache<{ items: Series[]; total: number }>(cacheKey, 24 * 60 * 60 * 1000);

  const { data, isLoading, isFetching } = useListAnime({
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
  const trending = useMemo(() => allRaw.slice(0, 10), [allRaw]);

  const yearOptions = useMemo(() => {
    const years = allRaw.map(a => a.año?.trim()).filter((y): y is string => !!y && /^\d{4}$/.test(y)).map(Number);
    const unique = Array.from(new Set(years)).sort((a, b) => b - a);
    const max = unique[0] ?? new Date().getFullYear();
    const min = unique[unique.length - 1] ?? max;
    const result: number[] = [];
    for (let y = Math.max(max, 2026); y >= min; y--) result.push(y);
    return result;
  }, [allRaw]);

  const allItems = useMemo(() => {
    let filtered = allRaw;
    if (genre) filtered = filtered.filter(a => a.genero?.toLowerCase().includes(genre.toLowerCase()));
    if (year) filtered = filtered.filter(a => a.año?.trim() === year);
    return filtered;
  }, [allRaw, genre, year]);

  const loadMore = useCallback(() => { if (hasMore && !isFetching) setOffset(p => p + PAGE_SIZE); }, [hasMore, isFetching]);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore);

  return (
    <Layout>
      {!isLoading && allRaw.length > 0 && <SectionHero items={allRaw} />}

      <div className="mt-2 bg-black">
        {/* Trending row */}
        {!isLoading && trending.length > 0 && (
          <HorizontalRow title="Tendencias" items={trending} type="anime" isNumbered={true} variant="portrait" />
        )}

        {/* Ruleta */}
        {!isLoading && allRaw.length > 0 && (
          <div className="px-4 md:px-10 lg:px-16 xl:px-20 mb-6">
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={() => setShowRuleta(true)}
              className="relative overflow-hidden rounded-2xl cursor-pointer select-none"
              style={{ background: "linear-gradient(135deg, #1e0533 0%, #2d0a4e 40%, #1a0535 100%)", border: "1px solid rgba(168,85,247,0.25)", boxShadow: "0 0 30px rgba(124,58,237,0.12)" }}
            >
              <div className="relative flex items-center gap-4 px-6 py-3">
                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="text-4xl sm:text-5xl flex-shrink-0">🎰</motion.div>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-black text-lg sm:text-xl">Ruleta Anime</span>
                  <p className="text-white/40 text-xs sm:text-sm">Qué anime miro hoy? Deja que la suerte decida</p>
                </div>
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white" style={{ background: "linear-gradient(135deg, #6d28d9, #9333ea)", boxShadow: "0 0 16px rgba(109,40,217,0.5)" }}>
                  <Dices className="w-4 h-4" /><span className="hidden sm:inline">Girar</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Banner entre secciones */}
        <AdBannerSlot className="px-4 md:px-10 pb-2" />

        {/* Grid */}
        <div className="max-w-screen-2xl mx-auto px-4 md:px-10 lg:px-16 xl:px-20 pb-8 bg-black">
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
                {allItems.map(anime => <PosterCard key={anime.id} item={anime} type="anime" variant="grid" />)}
              </div>
              {hasMore && (
                <><div ref={sentinelRef} className="h-1" /><div className="flex justify-center mt-6"><div className="w-5 h-5 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin" /></div></>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-white/30"><p className="text-sm">No se encontró anime.</p></div>
          )}
        </div>
      </div>

      {showRuleta && <RuletaAnime items={allRaw} onClose={() => setShowRuleta(false)} />}
    </Layout>
  );
}
