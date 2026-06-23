import { Sparkles, Zap, Gem, Film, Moon } from "lucide-react";
import { Link } from "wouter";

interface ExclusiveSection {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  description: string;
  color: string;
  gradient: string;
  path: string;
}

const exclusiveSections: ExclusiveSection[] = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    emoji: "👑",
    title: "Selección ENYGMA",
    description: "Lo mejor de nuestro catálogo",
    color: "#7B2FBE",
    gradient: "from-purple-500/20 to-transparent",
    path: "/category/seleccion-enygma",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    emoji: "🔥",
    title: "Tendencia Global",
    description: "Lo más visto ahora",
    color: "#FF6B2C",
    gradient: "from-orange-500/20 to-transparent",
    path: "/category/tendencia-global",
  },
  {
    icon: <Gem className="w-6 h-6" />,
    emoji: "💎",
    title: "Joyas Ocultas",
    description: "Descubrimientos especiales",
    color: "#FFD700",
    gradient: "from-yellow-500/20 to-transparent",
    path: "/category/joyas-ocultas",
  },
  {
    icon: <Film className="w-6 h-6" />,
    emoji: "🍿",
    title: "Maratón Perfecta",
    description: "Series para una sesión",
    color: "#00D9FF",
    gradient: "from-cyan-500/20 to-transparent",
    path: "/category/maraton-perfecta",
  },
  {
    icon: <Moon className="w-6 h-6" />,
    emoji: "🌙",
    title: "Para Ver Esta Noche",
    description: "Estrenos y recomendados",
    color: "#9D4EDD",
    gradient: "from-purple-500/20 to-transparent",
    path: "/category/ver-esta-noche",
  },
];

interface ExclusiveSectionsRowProps {
  items?: any[];
}

export function ExclusiveSectionsRow({ items = [] }: ExclusiveSectionsRowProps) {
  return (
    <div className="px-4 md:px-10 lg:px-16 xl:px-20">
      {/* Premium title */}
      <div className="mb-6 sm:mb-8 relative flex items-center gap-3">
        <div className="w-1.5 h-8 sm:h-9 bg-gradient-to-b from-[#7B2FBE] to-[#9B59E8] rounded-full shadow-lg shadow-purple-500/50" />
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase font-display tracking-tighter text-white">
          ✨ Explorar Categorías
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {exclusiveSections.map((section, idx) => (
          <Link key={idx} href={section.path}>
            <div
              className={`group relative rounded-xl overflow-hidden p-4 sm:p-6 aspect-square sm:aspect-auto flex flex-col items-center justify-center text-center cursor-pointer border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 backdrop-blur-xl`}
              style={{
                background: `linear-gradient(135deg, rgba(123, 47, 190, 0.08), rgba(255, 77, 109, 0.04))`,
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
              }}
            >
              {/* Icono */}
              <div className="text-4xl sm:text-5xl mb-2 group-hover:scale-125 transition-transform duration-300">
                {section.emoji}
              </div>

              {/* Título */}
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider mb-1">
                {section.title}
              </h3>

              {/* Descripción */}
              <p className="text-[10px] sm:text-xs text-white/60 leading-tight">
                {section.description}
              </p>

              {/* Glow effect on hover */}
              <div
                className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10 blur-lg"
                style={{
                  background: `linear-gradient(135deg, ${section.color}, transparent)`,
                }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
