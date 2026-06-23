import { Link, useLocation } from "wouter";
import { Search, User, Download, SmartphoneNfc, Heart, Home, Film, Tv, Music } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useProfile } from "@/lib/profile-context";
import { useFavorites } from "@/lib/use-favorites";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/use-install-prompt";

export function Layout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [location, setLocation] = useLocation();
  const { profile } = useProfile();
  const { favorites } = useFavorites();
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { canInstall, install } = useInstallPrompt();
  const [installDismissed, setInstallDismissed] = useState(() => {
    try { return localStorage.getItem("pwa_install_dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    let raf = 0;
    const handleScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const next = window.scrollY > 20;
        setScrolled((prev) => (prev === next ? prev : next));
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (clickCount.current >= 10) {
      clickCount.current = 0;
      setLocation("/admin");
      return;
    }
    clickTimer.current = setTimeout(() => {
      if (clickCount.current > 0 && clickCount.current < 10) setLocation("/home");
      clickCount.current = 0;
    }, 1500);
  };

  const dismissInstall = () => {
    setInstallDismissed(true);
    try { localStorage.setItem("pwa_install_dismissed", "1"); } catch {}
  };

  // No mostrar ads en reproductor ni en perfil
  const isWatchPage = location?.startsWith("/watch");
  const isProfilePage = location === "/profiles" || location === "/";

  const navLinks = [
    { href: "/home", label: "Inicio" },
    { href: "/movies", label: "Películas" },
    { href: "/series", label: "Series" },
    { href: "/anime", label: "Anime" },
    { href: "/mylist", label: "Mi Lista" },
  ];

  const bottomNavLinks = [
    { href: "/home", label: "Inicio", icon: Home },
    { href: "/movies", label: "Films", icon: Film },
    { href: "/series", label: "Series", icon: Tv },
    { href: "/anime", label: "Anime", icon: Music },
    { href: "/mylist", label: "Mi Lista", icon: Heart },
    { href: "/profile", label: "Perfil", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/90 backdrop-blur-2xl"
            : "bg-transparent"
        }`}
      >
        {/* Subtle top gradient — only visible when not scrolled, fades into banner */}
        {!scrolled && (
          <div className="absolute inset-0 bg-transparent pointer-events-none" />
        )}

        <div className="relative max-w-screen-2xl mx-auto px-6 md:px-12 lg:px-20 xl:px-24 h-16 md:h-20 flex items-center justify-between">
          {/* Logo + Desktop Nav (left) */}
          <div className="flex items-center gap-8 md:gap-12">
            <span
              onClick={handleLogoClick}
              className="cursor-pointer select-none flex-shrink-0"
            >
              <img
                src="/enygma-logo.png"
                alt="ENYGMA"
                className="h-10 w-10 md:h-12 md:w-12 rounded-xl object-cover shadow-xl"
                style={{ filter: "drop-shadow(0 0 12px rgba(123,47,190,0.55))" }}
              />
            </span>

            {/* Desktop nav */}
            <nav className="hidden md:flex gap-8 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-semibold tracking-wide transition-all duration-200 hover:text-white relative group ${
                    location === link.href ? "text-white" : "text-white/55"
                  }`}
                >
                  {link.label === "Mi Lista" && (
                    <Heart className={`w-3.5 h-3.5 ${location === link.href ? "fill-[#7B2FBE] text-[#7B2FBE]" : favorites.length > 0 ? "text-[#7B2FBE]" : ""}`} />
                  )}
                  {link.label === "Anime" && (
                    <img
                      src="/anime-logo.png"
                      alt="Anime"
                      className={`w-5 h-5 rounded-md object-cover transition-all duration-200 ${location === link.href ? "opacity-100 scale-110" : "opacity-55 group-hover:opacity-100"}`}
                      style={location === link.href ? { filter: "drop-shadow(0 0 4px #a78bfa88)" } : undefined}
                    />
                  )}
                  {link.label}
                  {link.label === "Mi Lista" && favorites.length > 0 && (
                    <span className="bg-[#7B2FBE] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                      {favorites.length > 99 ? "99" : favorites.length}
                    </span>
                  )}
                  {/* Active underline */}
                  <span className={`absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#7B2FBE] rounded-full transition-all duration-200 ${location === link.href ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-40 group-hover:scale-x-100"}`} />
                </Link>
              ))}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white hover:bg-white/8 transition-all rounded-xl"
              onClick={() => setLocation("/search")}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Desktop profile */}
            <div
              className="hidden md:flex items-center gap-2.5 cursor-pointer group ml-1"
              onClick={() => setLocation("/profile")}
            >
              {profile === "kids" && (
                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">Kids</span>
              )}
              <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-white/15 group-hover:border-[#7B2FBE]/70 transition-all duration-300 flex-shrink-0 shadow-lg">
                {profile ? (
                  <img
                    src={`/avatar-${profile}.png`}
                    alt={profile}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-white/60" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={`flex-1 w-full ${isProfilePage ? 'pt-0' : 'pt-14 md:pt-16'} pb-20 md:pb-12`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-black/85 backdrop-blur-xl border-t border-white/10" />
        <div className="relative flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom,8px)]">
          {bottomNavLinks.map(({ href, label, icon: Icon }) => {
            const isActive = location === href || (href === "/profiles" && location === "/");
            const isAnime = label === "Anime";
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90"
              >
                <span
                  className={`flex items-center justify-center w-6 h-6 transition-all duration-200 ${
                    isAnime ? "" : isActive ? "text-[#7B2FBE]" : "text-white/40"
                  }`}
                  style={
                    isActive && !isAnime
                      ? { filter: "drop-shadow(0 0 6px #7B2FBE) drop-shadow(0 0 12px #7B2FBEaa)" }
                      : undefined
                  }
                >
                  {isAnime ? (
                    <img
                      src="/anime-logo.png"
                      alt="Anime"
                      className="w-6 h-6 rounded-md object-cover transition-all duration-200"
                      style={isActive
                        ? { filter: "drop-shadow(0 0 5px #a78bfa) drop-shadow(0 0 10px #a78bfa88)", opacity: 1 }
                        : { opacity: 0.45 }
                      }
                    />
                  ) : (
                    <Icon
                      className="w-5 h-5"
                      fill={isActive && label === "Mi Lista" ? "#7B2FBE" : "none"}
                    />
                  )}
                </span>
                <span
                  className={`text-[10px] font-medium transition-all duration-200 ${
                    isActive ? "text-[#7B2FBE]" : "text-white/30"
                  }`}
                  style={
                    isActive
                      ? { textShadow: "0 0 8px #7B2FBE, 0 0 16px #7B2FBEaa" }
                      : undefined
                  }
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* PWA Install Banner — appears above bottom nav on mobile */}
      {canInstall && !installDismissed && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 p-4 bg-black/95 border-t border-white/10 backdrop-blur-md">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <img src="/enygma-logo.png" alt="ENYGMA" className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold leading-tight">Instalar ENYGMA Cine</p>
              <p className="text-white/50 text-xs">Accede sin navegador desde tu pantalla</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={dismissInstall}
                className="text-white/30 hover:text-white text-sm px-2 py-1 transition-colors"
              >
                No
              </button>
              <button
                onClick={install}
                className="flex items-center gap-1.5 bg-[#7B2FBE] hover:bg-[#6a28a6] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Instalar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer — desktop only */}
      <footer className="hidden md:block py-6 border-t border-white/5 bg-black text-center text-white/30 text-sm">
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src="/enygma-logo.png" alt="ENYGMA" className="w-8 h-8 rounded-lg opacity-50" />
          <p className="font-display tracking-wider">ENYGMA STREAMING</p>
        </div>
        <p className="mb-3">© {new Date().getFullYear()} Private Cinema Vault.</p>
        {canInstall && (
          <button
            onClick={install}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-medium px-4 py-2 rounded-full transition-all"
          >
            <SmartphoneNfc className="w-3.5 h-3.5" />
            Instalar App
          </button>
        )}
      </footer>
    </div>
  );
}
