import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send } from "lucide-react";
import type { Movie, Series } from "@workspace/api-client-react";

interface AiSmartSearchProps {
  onSearch: (results: (Movie | Series)[], query: string) => void;
  allItems: (Movie | Series)[];
}

const QUICK_CHIPS = [
  { icon: "🔥", label: "Tendencias", query: "tendencias popular" },
  { icon: "😱", label: "No te dejarán dormir", query: "no me dejarán dormir suspenso terror" },
  { icon: "🤯", label: "Finales inesperados", query: "finales inesperados giro" },
  { icon: "😭", label: "Para llorar", query: "para llorar emocional drama" },
  { icon: "❤️", label: "Ver en pareja", query: "romance pareja amor" },
  { icon: "🍿", label: "Maratón perfecto", query: "maratón adictivo binge" },
  { icon: "🧠", label: "Te hará pensar", query: "pensar filosofía profundo" },
  { icon: "🚀", label: "Ciencia ficción épica", query: "ciencia ficción épico futuro" },
  { icon: "👻", label: "Terror psicológico", query: "terror psicológico miedo" },
  { icon: "🏆", label: "Obras maestras", query: "mejores clásico obra maestra" },
  { icon: "🎭", label: "Hechos reales", query: "basado hechos reales historia verdadera" },
  { icon: "⚡", label: "Acción sin parar", query: "acción aventura rápido explosivo" },
];

const PLACEHOLDERS = [
  "Quiero una película que no me deje dormido",
  "Algo parecido a Interstellar",
  "Una serie para maratonear",
  "Películas con finales inesperados",
  "Quiero llorar",
  "Algo para ver con mi pareja",
  "Terror psicológico de verdad",
  "Una joya escondida",
  "Lo mejor que salió este año",
  "Una serie más adictiva que Breaking Bad",
  "Películas que te hacen pensar",
  "Algo divertido para esta noche",
  "Historias basadas en hechos reales",
  "Quiero sorprenderme",
  "Ciencia ficción épica",
];

function scoreByAiQuery(item: Movie | Series, query: string): number {
  const lower = query.toLowerCase();
  let score = 0;

  // Emotion mapping
  const emotionMap: Record<string, string[]> = {
    "miedo|terror|asust|horror": ["Terror", "Thriller"],
    "triste|llorar|emocion|drama": ["Drama", "Romance"],
    "felicidad|divertid|comedi|rir": ["Comedia"],
    "tension|suspen": ["Thriller", "Drama"],
    "adrenalina|accion|explosiv|pelea": ["Acción", "Aventura"],
    "nostalgia|retro": ["Drama"],
    "romance|amor|pareja": ["Romance"],
  };

  // Thematic mapping
  const thematicMap: Record<string, string[]> = {
    "viaje|tiempo|temporal": ["Ciencia Ficción"],
    "asesino|crimen|detective|policial": ["Thriller", "Drama"],
    "supervivencia|sobreviv": ["Acción", "Aventura"],
    "guerra|conflicto|batalla": ["Acción", "Drama"],
    "detective|misterio|investigacion": ["Thriller", "Drama"],
    "mafia|crimen|criminal": ["Thriller", "Drama"],
    "espacio|astronauta|galaxia": ["Ciencia Ficción"],
    "universo|paralelo|dimension": ["Ciencia Ficción"],
    "invasion|alien|extraterrestre": ["Ciencia Ficción"],
    "inteligencia|robot|ia": ["Ciencia Ficción"],
    "zombie|muerto": ["Terror"],
    "fantasma|sobrenatural": ["Terror"],
    "verdad|real|documental|historico": ["Drama"],
  };

  // Comparison mapping
  const comparisonMap: Record<string, string[]> = {
    "interstellar": ["Ciencia Ficción", "Drama"],
    "breaking bad": ["Drama", "Thriller"],
    "dark": ["Thriller", "Drama"],
    "stranger things": ["Drama", "Ciencia Ficción"],
    "el conjuro": ["Terror"],
    "game of thrones": ["Drama", "Aventura"],
  };

  // Situation mapping
  const situationMap: Record<string, boolean> = {
    "pareja|dos": true,
    "familia|niños|infantil": true,
    "maratone|binge|largo": true,
    "lluvia|noche|dormir": true,
    "solo|soledad": true,
  };

  const genres = (item.genero || "").toLowerCase();
  const title = (item.titulo || "").toLowerCase();
  const synopsis = (item.sinopsis || "").toLowerCase();

  // Check emotions
  for (const [pattern, genreList] of Object.entries(emotionMap)) {
    if (new RegExp(pattern).test(lower)) {
      for (const g of genreList) {
        if (genres.includes(g.toLowerCase())) score += 20;
      }
    }
  }

  // Check thematics
  for (const [pattern, genreList] of Object.entries(thematicMap)) {
    if (new RegExp(pattern).test(lower)) {
      for (const g of genreList) {
        if (genres.includes(g.toLowerCase())) score += 15;
      }
      // Also check in title/synopsis
      const regex = new RegExp(pattern);
      if (regex.test(title)) score += 10;
      if (regex.test(synopsis)) score += 5;
    }
  }

  // Check comparisons
  for (const [comparison, genreList] of Object.entries(comparisonMap)) {
    if (lower.includes(comparison)) {
      for (const g of genreList) {
        if (genres.includes(g.toLowerCase())) score += 25;
      }
    }
  }

  // Check situations
  for (const [situation, _] of Object.entries(situationMap)) {
    if (new RegExp(situation).test(lower)) {
      score += 5;
    }
  }

  // Direct keyword matching
  const keywords = lower.split(/\s+/).filter((w: string) => w.length > 3);
  for (const keyword of keywords) {
    if (title.includes(keyword)) score += 15;
    if (genres.includes(keyword)) score += 12;
    if (synopsis.includes(keyword)) score += 3;
  }

  // Popularity bonus
  if ((item as any).valoracion && parseFloat((item as any).valoracion) >= 7.5) score += 8;

  return score;
}

export function AiSmartSearch({ onSearch, allItems }: AiSmartSearchProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(PLACEHOLDERS[0]);

  // Rotate placeholder
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Use Gemini API for smart search
    const fetchResults = async () => {
      try {
        const response = await fetch("https://enygmacinehd.fun/api/gemini-search/movies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery, limit: 120, offset: 0 }),
        });

        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        onSearch(data.items || [], searchQuery);
      } catch (error) {
        console.error("Gemini search error:", error);
        // Fallback to local search
        const scored = allItems.map((item) => ({
          item,
          score: scoreByAiQuery(item, searchQuery),
        }));
        scored.sort((a, b) => b.score - a.score);
        const results = scored.slice(0, 120).map((s) => s.item);
        onSearch(results, searchQuery);
      }
    };

    fetchResults();
    setShowResults(true);
  }, [allItems, onSearch]);

  const handleQuickChip = useCallback((chipQuery: string) => {
    setQuery(chipQuery);
    handleSearch(chipQuery);
  }, [handleSearch]);

  const handleSurpriseMe = useCallback(() => {
    // Get random high-quality content
    const scored = allItems.map((item) => ({
      item,
      score: (Math.random() * 50) + (parseFloat((item as any).valoracion) || 0) * 5,
    }));

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, 30).map((s) => s.item);

    onSearch(results, "¡Sorpresa IA!");
    setShowResults(true);
  }, [allItems, onSearch]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative"
    >
      {/* Main Search Container */}
      <div className="relative mb-8">
        {/* Title */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2 mb-2"
          >
            <Sparkles className="w-6 h-6 text-[#7B2FBE]" />
            <h1 className="text-3xl md:text-4xl font-black text-white">
              ¿Qué te gustaría ver hoy?
            </h1>
            <Sparkles className="w-6 h-6 text-[#7B2FBE]" />
          </motion.div>
          <p className="text-white/60 text-sm md:text-base">
            Describe cualquier película, serie, emoción o experiencia que estés buscando
          </p>
        </div>

        {/* Search Input */}
        <motion.div
          className="relative max-w-4xl mx-auto"
          whileFocus={{ scale: 1.02 }}
        >
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#7B2FBE]/20 via-[#9B59E8]/20 to-[#7B2FBE]/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />

            {/* Input container */}
            <div className="relative bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-4 border border-white/10 hover:border-[#7B2FBE]/50 focus-within:border-[#7B2FBE] transition-all">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#7B2FBE] flex-shrink-0 animate-pulse" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch(query)}
                  placeholder={currentPlaceholder}
                  className="flex-1 bg-transparent text-white placeholder-white/40 text-lg outline-none font-medium"
                />
                <button
                  onClick={() => handleSearch(query)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7B2FBE] to-[#9B59E8] text-white font-bold rounded-lg hover:opacity-90 transition-all hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex flex-wrap justify-center gap-2 max-w-4xl mx-auto px-4"
        >
          {QUICK_CHIPS.map((chip, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickChip(chip.query)}
              className="px-4 py-2 rounded-full text-sm font-bold bg-white/8 hover:bg-white/15 border border-white/20 hover:border-[#7B2FBE]/50 text-white transition-all flex items-center gap-1.5"
            >
              <span>{chip.icon}</span>
              <span className="hidden sm:inline">{chip.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Surprise Me Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mt-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSurpriseMe}
            className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Sparkles className="w-5 h-5" />
            ✨ Sorpréndeme con IA
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AiSmartSearch;
