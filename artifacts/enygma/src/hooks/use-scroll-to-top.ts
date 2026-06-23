import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Hook que hace scroll to top cuando cambia la ruta
 */
export function useScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top smoothly
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [location]);
}
