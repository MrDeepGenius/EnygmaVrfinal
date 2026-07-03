import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PremiumState {
  isPremium: boolean;
  sinPublicidades: boolean;
  gmail: string | null;
  setGmail: (gmail: string) => void;
  refresh: () => void;
}

const PremiumContext = createContext<PremiumState>({
  isPremium: false,
  sinPublicidades: false,
  gmail: null,
  setGmail: () => {},
  refresh: () => {},
});

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [gmail, setGmailState] = useState<string | null>(() =>
    localStorage.getItem("enygma-gmail")
  );
  const [isPremium, setIsPremium] = useState(false);
  const [sinPublicidades, setSinPublicidades] = useState(false);

  const setGmail = useCallback((g: string) => {
    localStorage.setItem("enygma-gmail", g);
    setGmailState(g);
  }, []);

  const refresh = useCallback(async () => {
    const stored = localStorage.getItem("enygma-gmail");
    if (!stored) return;
    try {
      const res = await fetch(`${BASE}/api/premium/status?usuario=${encodeURIComponent(stored)}`);
      if (!res.ok) return;
      const data = await res.json();
      setIsPremium(!!data.isPremium);
      setSinPublicidades(!!data.sinPublicidades);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [gmail, refresh]);

  return (
    <PremiumContext.Provider value={{ isPremium, sinPublicidades, gmail, setGmail, refresh }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
