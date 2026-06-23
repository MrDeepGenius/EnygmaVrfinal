import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(onLoadMore: () => void, hasMore: boolean) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollHandlerRef = useRef<((this: Window, ev: Event) => any) | null>(null);
  const tickingRef = useRef(false);
  const lastFireRef = useRef(0);

  const setSentinel = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node;
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (scrollHandlerRef.current) {
      window.removeEventListener("scroll", scrollHandlerRef.current);
      scrollHandlerRef.current = null;
    }
    if (node && hasMore) {
      // Prefer IntersectionObserver, but add a scroll fallback too (algunos WebViews
      // / navegadores lo soportan mal y se queda cargando solo la primera página).
      if (typeof IntersectionObserver !== "undefined") {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              onLoadMore();
            }
          },
          // Mucho margen para que cargue antes y no quede “clavado” en la primera página
          { rootMargin: "2000px" }
        );
        observerRef.current.observe(node);
      }

      const onScroll = () => {
        if (!sentinelRef.current) return;
        if (!hasMore) return;
        if (tickingRef.current) return;
        tickingRef.current = true;
        window.requestAnimationFrame(() => {
          tickingRef.current = false;
          const now = Date.now();
          // Evitar disparos demasiado seguidos
          if (now - lastFireRef.current < 400) return;
          const rect = sentinelRef.current!.getBoundingClientRect();
          // Cargar bastante antes del final, para que en Chrome (con imágenes pesadas)
          // no parezca que “se queda en 120”.
          const thresholdPx = 3000;
          if (rect.top < window.innerHeight + thresholdPx) {
            lastFireRef.current = now;
            onLoadMore();
          }
        });
      };
      scrollHandlerRef.current = onScroll;
      window.addEventListener("scroll", onScroll, { passive: true });
      // Chequeo inicial por si ya está cerca del final
      onScroll();
    }
  }, [onLoadMore, hasMore]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      if (scrollHandlerRef.current) {
        window.removeEventListener("scroll", scrollHandlerRef.current);
        scrollHandlerRef.current = null;
      }
    };
  }, []);

  return setSentinel;
}
