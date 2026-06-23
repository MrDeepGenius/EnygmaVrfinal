import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import "./ai-search-cyberpunk.css";

interface AiSearchProps {
  onSearch: (query: string) => void;
  onAiSearch?: (mood: string) => Promise<any>;
  placeholder?: string;
}

export function AiSearchCyberpunk({ onSearch, onAiSearch, placeholder = "Buscar..." }: AiSearchProps) {
  const [isAiMode, setIsAiMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      // Si NO está en modo AI, ejecutar búsqueda tradicional en tiempo real
      if (!isAiMode) {
        onSearch(value);
      }
    },
    [isAiMode, onSearch]
  );

  const handleAiModeToggle = useCallback(() => {
    setIsAiMode(!isAiMode);
    setSearchQuery("");
  }, [isAiMode]);

  const handleAiSearch = useCallback(async () => {
    if (!searchQuery.trim() || !onAiSearch) return;

    setIsLoading(true);
    try {
      await onAiSearch(searchQuery);
    } catch (err) {
      console.error("AI Search error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, onAiSearch]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && isAiMode) {
        handleAiSearch();
      }
    },
    [isAiMode, handleAiSearch]
  );

  const placeholderText = isAiMode
    ? "DESCRIBE TU MOOD AQUÍ... (Ej: Acción rápida y violenta con robots o Terror psicológico en un futuro rojo)"
    : placeholder;

  return (
    <motion.div
      className={`ai-search-container ${isAiMode ? "ai-mode-active" : ""}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Label */}
      <label className="ai-search-label">
        <span className="ai-search-label-text">ENYGMA AI</span>
        <span className="ai-search-label-dot">●</span>
      </label>

      {/* Toggle Switch */}
      <motion.div
        className={`ai-toggle-switch ${isAiMode ? "active" : ""}`}
        onClick={handleAiModeToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="ai-toggle-thumb"
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </motion.div>

      {/* Search Input Container */}
      <div className={`ai-search-input-wrapper ${isAiMode ? "ai-active" : ""}`}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholderText}
          className="ai-search-input"
          disabled={isLoading}
        />

        {/* AI Mode Indicator */}
        {isAiMode && (
          <motion.div
            className="ai-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {isLoading ? (
              <span className="ai-loading">●●●</span>
            ) : searchQuery.trim() ? (
              <motion.button
                className="ai-search-button"
                onClick={handleAiSearch}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ⚡
              </motion.button>
            ) : (
              <span className="ai-mode-badge">IA</span>
            )}
          </motion.div>
        )}
      </div>

      {/* Neon Glow Effect */}
      <div className="ai-neon-glow" />
    </motion.div>
  );
}

export default AiSearchCyberpunk;
