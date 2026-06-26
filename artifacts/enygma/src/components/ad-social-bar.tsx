import { useEffect } from "react";

const SOCIAL_BAR_URL = "https://pl29330305.effectivecpmnetwork.com/45/0b/a7/450ba794fa0a1424a6370d8e5612d3d8.js";
const STORAGE_KEY    = "adsterra_socialbar_last_shown";
const INTERVAL_MS    = 24 * 60 * 60 * 1000; // 1 vez por día

/** Carga el Social Bar de Adsterra una vez cada 24 horas. */
export function AdSocialBar() {
  useEffect(() => {
    const last = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    if (Date.now() - last < INTERVAL_MS) return;

    localStorage.setItem(STORAGE_KEY, String(Date.now()));

    const script  = document.createElement("script");
    script.src    = SOCIAL_BAR_URL;
    script.async  = true;
    script.type   = "text/javascript";
    document.body.appendChild(script);
  }, []);

  return null;
}
