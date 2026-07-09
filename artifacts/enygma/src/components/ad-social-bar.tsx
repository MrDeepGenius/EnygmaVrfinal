import { useEffect } from "react";
import { usePremium } from "@/lib/premium-context";

const SOCIAL_BAR_URL = "https://pl29330305.effectivecpmnetwork.com/45/0b/a7/450ba794fa0a1424a6370d8e5612d3d8.js";
/** Carga el Social Bar de Adsterra en cada sesión (no throttle). */
export function AdSocialBar() {
  const { sinPublicidades } = usePremium();

  useEffect(() => {
    if (sinPublicidades) return;

    // No cargar en Replit dev/preview
    const host = window.location.hostname;
    const isDevEnv = host.includes("replit.dev") || host.includes("kirk.replit") || host === "localhost" || host === "127.0.0.1";
    if (isDevEnv) return;

    // Evitar duplicados si el script ya está en el DOM
    if (document.querySelector(`script[src="${SOCIAL_BAR_URL}"]`)) return;

    const script  = document.createElement("script");
    script.src    = SOCIAL_BAR_URL;
    script.async  = true;
    script.type   = "text/javascript";
    document.body.appendChild(script);
  }, [sinPublicidades]);

  return null;
}
