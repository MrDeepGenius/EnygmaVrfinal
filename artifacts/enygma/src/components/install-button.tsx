import { Download } from "lucide-react";
import { useState, useEffect } from "react";

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstall) return null;

  return (
    <button
      onClick={handleInstall}
      className="w-full flex items-center justify-center gap-2 bg-[#7B2FBE] hover:bg-[#6a28a6] text-white font-bold py-3 rounded-lg transition-colors mt-4"
      title="Instalar ENYGMA como aplicación"
    >
      <Download className="w-5 h-5" />
      Instalar App
    </button>
  );
}
