import { Download } from "lucide-react";
import { useState, useEffect } from "react";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [installAttempted, setInstallAttempted] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      return;
    }

    // Check si ya intentó instalar
    const attempted = localStorage.getItem("enygma:install-attempted");
    if (attempted === "true") {
      setInstallAttempted(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPrompt);
      setShowModal(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    // Mostrar modal automaticamente después de 2 segundos
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 2000);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleConfirmInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      setShowModal(false);
      localStorage.setItem("enygma:install-attempted", "true");
      setInstallAttempted(true);
      setDeferredPrompt(null);
    } else {
      // Mostrar instrucciones si no hay prompt
      alert("📱 Para instalar ENYGMA:\n\n1️⃣ Abre el menú (⋮ o ≡)\n2️⃣ Toca 'Instalar app' o 'Agregar a pantalla de inicio'\n3️⃣ ¡Listo! Abre desde tu pantalla de inicio\n\n⭐ Acceso rápido • Sin conexión • Experiencia nativa");
      setShowModal(false);
      localStorage.setItem("enygma:install-attempted", "true");
      setInstallAttempted(true);
    }
  };

  // Modal OBLIGATORIO - Sin opción de cerrar
  if (showModal && !installAttempted) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-zinc-900 to-black border border-purple-500/50 rounded-3xl max-w-sm w-full shadow-2xl shadow-purple-500/40 overflow-hidden animate-in fade-in scale-95">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-red-600 px-6 py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-md">
                <Download className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-white font-black text-2xl">Instala ENYGMA</h2>
            <p className="text-purple-100 text-sm font-semibold mt-2">Acceso instantáneo a tu contenido</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-6">
            {/* Beneficios */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-white font-bold text-sm">Acceso Súper Rápido</p>
                  <p className="text-white/60 text-xs">Abre la app en un click</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📴</span>
                <div>
                  <p className="text-white font-bold text-sm">Sin Conexión</p>
                  <p className="text-white/60 text-xs">Funciona offline</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎮</span>
                <div>
                  <p className="text-white font-bold text-sm">Experiencia Nativa</p>
                  <p className="text-white/60 text-xs">Pantalla completa, sin barra</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="text-white font-bold text-sm">En tu Pantalla de Inicio</p>
                  <p className="text-white/60 text-xs">Ícono personalizado</p>
                </div>
              </div>
            </div>

            {/* Aviso */}
            <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-300 text-xs font-semibold">✓ Puedes desinstalar cuando quieras desde configuración</p>
            </div>
          </div>

          {/* Footer - SOLO BOTÓN DE INSTALAR */}
          <div className="px-6 py-4 bg-black/30 border-t border-purple-500/20">
            <button
              onClick={handleConfirmInstall}
              className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/50"
            >
              ✓ INSTALAR AHORA
            </button>
            <p className="text-center text-white/40 text-xs mt-3">Presiona el botón para instalar</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
