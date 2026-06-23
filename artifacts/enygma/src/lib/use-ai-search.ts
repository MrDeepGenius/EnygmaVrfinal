import { useCallback } from "react";

interface AISearchResult {
  items: any[];
  query: string;
  timestamp: string;
}

/**
 * Hook para manejar búsqueda tradicional vs AI
 * NO modifica la lógica existente, solo agrega una capa nueva
 */
export function useAiSearch() {
  /**
   * Búsqueda IA - Endpoint nuevo
   * PONER AQUÍ TU LÓGICA DE AI CUANDO ESTÉ LISTA
   */
  const aiSearch = useCallback(async (mood: string): Promise<AISearchResult> => {
    try {
      // Si tienes un backend que soporte esto:
      // const response = await fetch(`/api/ai-search`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ mood, profile: userProfile })
      // });
      // return response.json();

      // Por ahora, simulación:
      console.log("🤖 AI Search activated with mood:", mood);
      return {
        items: [],
        query: mood,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("AI Search Error:", error);
      throw error;
    }
  }, []);

  return {
    aiSearch,
  };
}
