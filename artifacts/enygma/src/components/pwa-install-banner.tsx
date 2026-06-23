import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowBanner(false);
      return;
    }

    // Check localStorage for user dismissal
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      setShowBanner(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowBanner(false);
      localStorage.removeItem("pwa-install-dismissed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setShowBanner(false);
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error("Error installing PWA:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showBanner || !deferredPrompt) {
    return null;
  }

  return (
    <div className="w-full px-4 md:px-10 lg:px-16 xl:px-20 py-4 md:py-6 animate-fade-in">
      <div
        className="relative rounded-2xl border overflow-hidden transition-all duration-300 hover:border-[#7B2FBE]/50"
        style={{
          background: "linear-gradient(135deg, rgba(123, 47, 190, 0.15), rgba(123, 47, 190, 0.05))",
          border: "1px solid rgba(123, 47, 190, 0.25)",
        }}
      >
        <div className="p-5 md:p-6 lg:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#7B2FBE]/20 to-[#7B2FBE]/5 flex items-center justify-center">
            <Download className="w-6 h-6 md:w-7 md:h-7 text-[#7B2FBE]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-bold text-white leading-tight mb-1">
              Instalá Enygma Cine
            </h3>
            <p className="text-xs md:text-sm text-white/70 leading-relaxed">
              Acceso más rápido, pantalla completa y mejor experiencia.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-[#7B2FBE] to-[#b20710] hover:from-[#ff2a2a] hover:to-[#6a28a6] text-white font-bold text-sm md:text-base rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7B2FBE]/30"
            >
              {isInstalling ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Instalando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Instalar</span>
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200 flex-shrink-0"
              title="Descartar"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Gradient border effect */}
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-0"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(123, 47, 190, 0.4), transparent)",
            pointerEvents: "none",
          }}
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 200ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}
