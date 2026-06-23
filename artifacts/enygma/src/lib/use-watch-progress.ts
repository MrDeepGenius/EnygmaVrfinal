import { useState, useCallback } from "react";
import { useProfile } from "./profile-context";

export interface WatchProgressItem {
  id: string;
  titulo: string;
  tipo: "movie" | "serie" | "anime";
  posterUrl: string | null;
  backdropUrl: string | null;
  año: string;
  progress: number;
  lastWatched: number;
  episodio?: number;
  totalEpisodes?: number;
}

const KEY = "enygma_watch_progress";

function readAll(profile: string): WatchProgressItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, WatchProgressItem[]>) : {};
    return (data[profile] || []).sort((a, b) => b.lastWatched - a.lastWatched);
  } catch {
    return [];
  }
}

function writeAll(profile: string, items: WatchProgressItem[]) {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, WatchProgressItem[]>) : {};
    data[profile] = items.slice(0, 50);
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function useWatchProgress() {
  const { profile } = useProfile();
  const [progress, setProgress] = useState<WatchProgressItem[]>(() =>
    profile ? readAll(profile) : []
  );

  const addProgress = useCallback(
    (item: Omit<WatchProgressItem, "lastWatched">) => {
      if (!profile) return;
      setProgress((prev) => {
        const filtered = prev.filter((p) => p.id !== item.id);
        const next = [{ ...item, lastWatched: Date.now() }, ...filtered];
        writeAll(profile, next);
        return next;
      });
    },
    [profile]
  );

  const removeProgress = useCallback(
    (id: string) => {
      if (!profile) return;
      setProgress((prev) => {
        const next = prev.filter((p) => p.id !== id);
        writeAll(profile, next);
        return next;
      });
    },
    [profile]
  );

  const getProgress = useCallback(
    (id: string) => progress.find((p) => p.id === id),
    [progress]
  );

  return { progress, addProgress, removeProgress, getProgress };
}
