import { useState, useEffect } from "react";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPrompt | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const attempted = localStorage.getItem("enygma:install-attempted");
    if (attempted === "true") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPrompt);
      setShowModal(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setShowModal(false);
    localStorage.setItem("enygma:install-attempted", "true");
    setDeferredPrompt(null);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }
    dismiss();
  };

  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={dismiss}
    >
      <div
        className="bg-gradient-to-b from-zinc-900 to-black border border-purple-500/50 rounded-3xl max-w-sm w-full shadow-2xl shadow-purple-500/40 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-red-600 px-6 py-6 text-center relative">
          <button onClick={dismiss} className="absolute top-3 right-3 text-white/60 hover:text-white text-xl leading-none">✕</button>
          <h2 className="text-white font-black text-2xl">Instala ENYGMA</h2>
          <p className="text-purple-100 text-sm font-semibold mt-1">Acceso instantaneo a tu contenido</p>
        </div>
        <div className="px-6 py-6">
          <button
            onClick={handleInstall}
            className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white font-black text-lg transition-all shadow-lg shadow-purple-500/50"
          >
            INSTALAR
          </button>
          <button onClick={dismiss} className="w-full mt-3 text-white/40 hover:text-white/70 text-sm transition-colors">
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
