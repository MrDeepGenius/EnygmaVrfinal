import { useEffect, useState } from "react";
import { Loader } from "lucide-react";

interface Item {
  id: string;
  titulo: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  categoria: "movie" | "serie" | "anime";
}

interface PremiumPlaybackScreenProps {
  item: Item;
  onComplete: () => void;
}

export function PremiumPlaybackScreen({ item, onComplete }: PremiumPlaybackScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showPoster, setShowPoster] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Timeline of animations
  useEffect(() => {
    const timers = [
      // 1 second: animate poster
      setTimeout(() => setShowPoster(true), 1000),
      // 2 seconds: show progress bar
      setTimeout(() => setShowProgressBar(true), 2000),
      // 3 seconds: show loading message
      setTimeout(() => setShowMessage(true), 3000),
      // 5 seconds: fade out and complete
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          onComplete();
        }, 500); // 0.5s fade out duration
      }, 5000),
    ];

    // Progress bar animation (0-100% over 5 seconds)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 20; // increment every 100ms = 20% per 100ms
        return Math.min(newProgress, 100);
      });
    }, 100);

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  const backdropImage = item.backdropUrl || "https://images.unsplash.com/photo-1489599849228-bed96c3f4c4f?w=1920&h=1080&fit=crop";
  const posterImage = item.posterUrl || "https://images.unsplash.com/photo-1489599849228-bed96c3f4c4f?w=500&h=750&fit=crop";

  return (
    <div
      className={`fixed inset-0 z-[300] transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      style={{
        backgroundImage: `url(${backdropImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Strong blur overlay with dark tint */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* Content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-4">
        {/* ENYGMA Logo */}
        <div className="text-center mb-4">
          <h1
            className="text-4xl sm:text-5xl font-black tracking-wider"
            style={{
              background: "linear-gradient(135deg, #7B2FBE, #9B59E8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ENYGMA
          </h1>
          <p className="text-white/40 text-xs tracking-[0.2em] uppercase mt-1">Cinematografía Premium</p>
        </div>

        {/* Poster Container with animation */}
        <div
          className={`relative transform transition-all duration-700 ${
            showPoster ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
          style={{
            filter: "drop-shadow(0 20px 60px rgba(123, 47, 190, 0.4))",
          }}
        >
          <img
            src={posterImage}
            alt={item.titulo}
            className="h-48 sm:h-56 md:h-64 rounded-2xl object-cover border-2 border-white/20"
          />
        </div>

        {/* Title */}
        <h2 className="text-white text-xl sm:text-2xl font-bold text-center max-w-xl line-clamp-2">
          {item.titulo}
        </h2>

        {/* Progress Bar */}
        {showProgressBar && (
          <div className="w-full max-w-xs sm:max-w-md">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7B2FBE] to-[#9B59E8] transition-all duration-100 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Loading Message with spinner */}
        {showMessage && (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <Loader className="w-6 h-6 text-[#7B2FBE] animate-spin" />
            <div className="text-center">
              <p className="text-white/90 font-semibold text-sm">Preparando reproducción...</p>
              <p className="text-white/50 text-xs mt-1">Optimizando calidad de streaming</p>
              <p className="text-white/40 text-xs mt-1">Cargando contenido HD</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
