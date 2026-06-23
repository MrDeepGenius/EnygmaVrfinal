import { useState, useEffect, useRef, useCallback } from "react";

export type OverlayMode = "preroll" | "pause" | "buffering";

interface UseMediaOverlayProps {
  videoElement: HTMLVideoElement | null;
  backdropUrl?: string;
  adEnabled?: boolean;
}

export function useMediaOverlay({
  videoElement,
  backdropUrl,
  adEnabled = true,
}: UseMediaOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<OverlayMode>("preroll");
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prerollShownRef = useRef(false);

  // Pre-roll: mostrar al comenzar reproducción (una sola vez)
  const showPreroll = useCallback(() => {
    if (!prerollShownRef.current) {
      setMode("preroll");
      setVisible(true);
      prerollShownRef.current = true;
    }
  }, []);

  // Ocultar overlay
  const hideOverlay = useCallback(() => {
    setVisible(false);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
  }, []);

  // Reanudar reproducción
  const resumePlayback = useCallback(() => {
    console.log('[useMediaOverlay] resumePlayback llamado');
    if (videoElement) {
      console.log('[useMediaOverlay] Llamando play() en video element');
      videoElement.play().catch((err) => {
        console.log('[useMediaOverlay] Error al hacer play:', err);
      });
    } else {
      console.log('[useMediaOverlay] videoElement es null');
    }
  }, [videoElement]);

  // Comportamiento: SOLO mostrar pre-roll, NO mostrar en pausa
  useEffect(() => {
    if (!videoElement) return;

    const handlePlay = () => {
      // Solo ocultar overlay si estaba visible (después de preroll)
      if (visible && mode === "preroll") {
        setVisible(false);
      }
    };

    const handleWaiting = () => {
      // NO mostrar overlay en buffering/waiting - es muy invasivo
      // El video maneja esto internamente
    };

    const handlePlaying = () => {
      // Ocultar cualquier overlay que estuviera visible
      setVisible(false);
    };

    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("waiting", handleWaiting);
    videoElement.addEventListener("playing", handlePlaying);

    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("waiting", handleWaiting);
      videoElement.removeEventListener("playing", handlePlaying);
    };
  }, [videoElement, visible, mode]);

  return {
    visible,
    mode,
    showPreroll,
    hideOverlay,
    resumePlayback,
    backdropUrl,
    adEnabled,
  };
}
