import { useState, useCallback } from "react";

export type Rating = "love" | "like" | "dislike" | null;

const STORAGE_KEY = "enygma:ratings";

function load(): Record<string, Rating> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function save(data: Record<string, Rating>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function useRatings() {
  const [ratings, setRatings] = useState<Record<string, Rating>>(load);

  const rate = useCallback((id: string, value: Rating) => {
    setRatings((prev) => {
      const next = { ...prev };
      if (value === null || next[id] === value) {
        delete next[id];
      } else {
        next[id] = value;
      }
      save(next);
      return next;
    });
  }, []);

  const getRating = useCallback((id: string): Rating => ratings[id] ?? null, [ratings]);

  return { rate, getRating };
}
