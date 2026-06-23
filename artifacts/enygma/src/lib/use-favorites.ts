import { useState, useEffect, useCallback } from "react";
import { useProfile } from "./profile-context";

export interface FavoriteItem {
  id: string;
  titulo: string;
  tipo: "movie" | "serie" | "anime";
  posterUrl: string | null;
  backdropUrl: string | null;
  año: string;
  categoria: string;
}

const STORAGE_KEY = "enygma_favorites";

function read(profile: string): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, FavoriteItem[]>) : {};
    return data[profile] || [];
  } catch {
    return [];
  }
}

function write(profile: string, items: FavoriteItem[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, FavoriteItem[]>) : {};
    data[profile] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function useFavorites() {
  const { profile } = useProfile();

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() =>
    profile ? read(profile) : []
  );

  useEffect(() => {
    setFavorites(profile ? read(profile) : []);
  }, [profile]);

  const toggle = useCallback(
    (item: FavoriteItem) => {
      if (!profile) return;
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === item.id);
        const next = exists ? prev.filter((f) => f.id !== item.id) : [item, ...prev];
        write(profile, next);
        return next;
      });
    },
    [profile]
  );

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  return { favorites, toggle, isFavorite };
}
