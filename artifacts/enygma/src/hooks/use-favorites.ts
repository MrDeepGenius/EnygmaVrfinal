import { useState, useCallback } from "react";

type ListType = "likes" | "watchLater";

function storageKey(type: ListType) {
  return `enygma_${type}`;
}

function readIds(type: ListType): string[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(type)) || "[]");
  } catch {
    return [];
  }
}

function writeIds(type: ListType, ids: string[]) {
  localStorage.setItem(storageKey(type), JSON.stringify(ids));
}

export function useFavorites() {
  const [likedIds, setLikedIds] = useState<string[]>(() => readIds("likes"));
  const [watchLaterIds, setWatchLaterIds] = useState<string[]>(() => readIds("watchLater"));

  const toggleLike = useCallback((id: string) => {
    setLikedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      writeIds("likes", next);
      return next;
    });
  }, []);

  const toggleWatchLater = useCallback((id: string) => {
    setWatchLaterIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      writeIds("watchLater", next);
      return next;
    });
  }, []);

  return {
    likedIds,
    watchLaterIds,
    toggleLike,
    toggleWatchLater,
    isLiked: (id: string) => likedIds.includes(id),
    isWatchLater: (id: string) => watchLaterIds.includes(id),
  };
}
