import { queryClient } from "@/lib/query-client";
import { getGetTmdbDetailsQueryKey } from "@workspace/api-client-react";

/**
 * Predictive prefetch for item details
 * Loads data when user hovers over a card without blocking interaction
 */
export function prefetchItemDetail(itemId: string, type: "movie" | "serie" | "anime") {
  // Debounce prefetch to avoid excessive requests
  const timeoutKey = `prefetch:${itemId}:${type}`;
  
  if ((window as any)[timeoutKey]) {
    clearTimeout((window as any)[timeoutKey]);
  }

  (window as any)[timeoutKey] = setTimeout(() => {
    try {
      const queryKey = getGetTmdbDetailsQueryKey({
        tmdbId: itemId,
        type: type === "serie" ? "tv" : type,
      });
      
      // Only prefetch if not already cached
      const data = queryClient.getQueryData(queryKey);
      if (!data) {
        queryClient.prefetchQuery({
          queryKey,
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      }
    } catch (err) {
      console.debug("Prefetch failed silently", err);
    }
  }, 300); // 300ms debounce for hover
}
