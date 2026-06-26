import { useEffect } from "react";

const SOCIAL_BAR_URL = "https://pl29330305.effectivecpmnetwork.com/45/0b/a7/450ba794fa0a1424a6370d8e5612d3d8.js";
const LOADED_KEY     = "__adsterra_socialbar_loaded__";

/** Carga el Social Bar de Adsterra UNA sola vez por sesión. */
export function AdSocialBar() {
  useEffect(() => {
    if ((window as any)[LOADED_KEY]) return;
    (window as any)[LOADED_KEY] = true;

    const script  = document.createElement("script");
    script.src    = SOCIAL_BAR_URL;
    script.async  = true;
    script.type   = "text/javascript";
    document.body.appendChild(script);
  }, []);

  return null;
}
