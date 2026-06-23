import { createContext, useContext, useEffect, useMemo, useState } from "react";

function detectTvMode(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  const forced = url.searchParams.get("tv");
  if (forced === "1") return true;
  if (forced === "0") return false;

  try {
    const stored = localStorage.getItem("tv_mode");
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {}

  const ua = navigator.userAgent || "";
  const tvUa =
    /(Android TV|GoogleTV|SMART-TV|SmartTV|Tizen|Web0S|NetCast|HbbTV|Viera|BRAVIA|AFT|Roku|CrKey)/i.test(ua);
  // Nota:
  // Antes activábamos "tv mode" por heurística en pantallas grandes sin touch,
  // lo que en PC de escritorio hacía que se oculte el cursor (mala UX).
  // Ahora solo se activa automáticamente si el user-agent parece de Smart TV.
  return tvUa;
}

function applyTvDataset(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) root.dataset.tv = "true";
  else delete root.dataset.tv;
}

const TvModeContext = createContext(false);

export function TvModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled] = useState(() => detectTvMode());
  const value = useMemo(() => enabled, [enabled]);

  useEffect(() => {
    applyTvDataset(enabled);
  }, [enabled]);

  return <TvModeContext.Provider value={value}>{children}</TvModeContext.Provider>;
}

export function useTvMode() {
  return useContext(TvModeContext);
}
