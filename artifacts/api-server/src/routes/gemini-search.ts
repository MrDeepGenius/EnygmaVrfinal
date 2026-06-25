import { Router, type IRouter, type Request, type Response } from "express";
import { getMovies, getSeries, getAnime } from "../lib/sheets";

const router: IRouter = Router();

const GEMINI_API_KEY = "Ab8RN6LZPlhsJC1g7x9DRTiEwZFJluHocsSaxAPsvRR6RoVprAG";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

interface SearchIntent {
  genres: string[];
  keywords: string[];
  mood: string;
  themes: string[];
  explanation: string; // Amigable para mostrar al usuario
}

/**
 * Extract search intent with friendly explanation using Gemini
 */
async function extractSearchIntentWithGemini(userQuery: string): Promise<SearchIntent> {
  try {
    const prompt = `Analiza esta consulta y extrae la intención de búsqueda.

Consulta: "${userQuery}"

Responde EXACTAMENTE en JSON (sin markdown):
{
  "genres": ["máximo 3 géneros"],
  "keywords": ["palabras clave principales"],
  "mood": "una palabra: scary|exciting|emotional|funny|thoughtful|romantic|intense",
  "themes": ["temas principales"],
  "explanation": "Explicación amigable en 1-2 líneas de qué busca el usuario. Ej: 'Buscas historias de ciencia ficción que te hagan pensar profundamente'"
}

Géneros: Acción, Comedia, Drama, Ciencia Ficción, Terror, Aventura, Animación, Thriller, Romance, Familia

Sé conciso y preciso.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!response.ok) {
      console.error("Gemini API error:", response.status);
      return {
        genres: [],
        keywords: [],
        mood: "",
        themes: [],
        explanation: "Buscando contenido relevante para ti...",
      };
    }

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          genres: parsed.genres || [],
          keywords: parsed.keywords || [],
          mood: parsed.mood || "",
          themes: parsed.themes || [],
          explanation: parsed.explanation || "Buscando contenido para ti...",
        };
      }
    } catch (e) {
      console.error("Failed to parse Gemini response:", e);
    }

    return {
      genres: [],
      keywords: [],
      mood: "",
      themes: [],
      explanation: "Buscando contenido relevante...",
    };
  } catch (error) {
    console.error("Gemini extraction error:", error);
    return {
      genres: [],
      keywords: [],
      mood: "",
      themes: [],
      explanation: "Buscando contenido para ti...",
    };
  }
}

/**
 * Generate confidence score (0-100) for an item
 */
function calculateConfidenceScore(
  item: any,
  intent: SearchIntent
): number {
  let score = 0;

  const itemGenres = (item.genero || "").toLowerCase();
  const itemTitle = (item.titulo || "").toLowerCase();
  const itemSynopsis = (item.sinopsis || "").toLowerCase();

  // Genre matching (50%)
  let genreMatches = 0;
  for (const genre of intent.genres) {
    if (itemGenres.includes(genre.toLowerCase())) {
      genreMatches++;
    }
  }
  if (intent.genres.length > 0) {
    score += (genreMatches / intent.genres.length) * 50;
  }

  // Keywords matching (30%)
  let keywordMatches = 0;
  for (const keyword of intent.keywords) {
    const keywordLower = keyword.toLowerCase();
    if (itemTitle.includes(keywordLower) || itemSynopsis.includes(keywordLower)) {
      keywordMatches++;
    }
  }
  if (intent.keywords.length > 0) {
    score += (keywordMatches / intent.keywords.length) * 30;
  }

  // Rating bonus (20%)
  if (item.valoracion) {
    const rating = parseFloat(item.valoracion);
    score += Math.min((rating / 10) * 20, 20);
  }

  return Math.round(Math.min(score, 100));
}

/**
 * Get confidence badge text
 */
function getConfidenceBadge(score: number): string {
  if (score >= 90) return "✨ Coincidencia perfecta";
  if (score >= 80) return "✨ Recomendado por Enygma AI";
  if (score >= 70) return "🧠 Muy similar";
  return "💡 Podría gustarte";
}

function setCacheHeaders(res: Response, seconds: number) {
  res.set("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=${seconds}`);
}

/**
 * POST /api/gemini-search/movies
 * Premium Gemini-powered search with explanations and confidence scores
 */
router.post("/gemini-search/movies", async (req, res): Promise<void> => {
  try {
    const { query, limit = 30, offset = 0, profile } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    // Extract intent with friendly explanation
    const intent = await extractSearchIntentWithGemini(query);

    // Get movies from catalog
    const catalogData = await getMovies({
      profile,
      limit: 500,
      offset: 0,
    });

    // Score and calculate confidence
    const scored = (catalogData.items || []).map((item: any) => {
      const confidenceScore = calculateConfidenceScore(item, intent);
      return {
        ...item,
        _confidenceScore: confidenceScore,
        _badge: getConfidenceBadge(confidenceScore),
      };
    });

    // Sort by confidence score (descending)
    scored.sort((a: any, b: any) => b._confidenceScore - a._confidenceScore);

    // Get top results
    const topResults = scored.slice(offset, offset + limit);

    // Build response with friendly AI explanation
    const withDetails = topResults.map((item: any) => {
      const { _confidenceScore, _badge, ...rest } = item;
      return {
        ...rest,
        _aiConfidence: _confidenceScore,
        _aiBadge: _badge,
        _aiExplanation: `${_badge} • ${_confidenceScore}% de coincidencia`,
      };
    });

    // Build friendly user explanation
    const intentExplanation = `🧠 Enygma AI entendió que buscas:\n${
      intent.themes.map((t: string) => `• ${t}`).join("\n") ||
      intent.genres.map((g: string) => `• ${g}`).join("\n")
    }\n✨ Encontramos las mejores opciones de nuestro catálogo.`;

    setCacheHeaders(res, 30);
    res.json({
      items: withDetails,
      total: scored.length,
      intent: {
        ...intent,
        userFriendlyExplanation: intentExplanation,
      },
      hasResults: withDetails.length > 0,
      message: withDetails.length > 0
        ? "✨ Encontramos las mejores opciones para ti"
        : "No encontramos coincidencias exactas, pero estas opciones podrían gustarte.",
    });
  } catch (error) {
    console.error("Gemini search error:", error);
    res.status(500).json({
      error: "Search failed",
      items: [],
      total: 0,
      hasResults: false,
    });
  }
});

/**
 * POST /api/gemini-search/series
 */
router.post("/gemini-search/series", async (req, res): Promise<void> => {
  try {
    const { query, limit = 30, offset = 0, profile } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    const intent = await extractSearchIntentWithGemini(query);
    const catalogData = await getSeries({
      profile,
      limit: 500,
      offset: 0,
    });

    const scored = (catalogData.items || []).map((item: any) => {
      const confidenceScore = calculateConfidenceScore(item, intent);
      return {
        ...item,
        _confidenceScore: confidenceScore,
        _badge: getConfidenceBadge(confidenceScore),
      };
    });

    scored.sort((a: any, b: any) => b._confidenceScore - a._confidenceScore);
    const topResults = scored.slice(offset, offset + limit);

    const withDetails = topResults.map((item: any) => {
      const { _confidenceScore, _badge, ...rest } = item;
      return {
        ...rest,
        _aiConfidence: _confidenceScore,
        _aiBadge: _badge,
        _aiExplanation: `${_badge} • ${_confidenceScore}% de coincidencia`,
      };
    });

    const intentExplanation = `🧠 Enygma AI entendió que buscas:\n${
      intent.themes.map((t: string) => `• ${t}`).join("\n") ||
      intent.genres.map((g: string) => `• ${g}`).join("\n")
    }\n✨ Encontramos contenido similar disponible en EnygmaCine.`;

    setCacheHeaders(res, 30);
    res.json({
      items: withDetails,
      total: scored.length,
      intent: {
        ...intent,
        userFriendlyExplanation: intentExplanation,
      },
      hasResults: withDetails.length > 0,
      message: withDetails.length > 0
        ? "✨ Encontramos las mejores series para ti"
        : "No encontramos coincidencias exactas, pero estas opciones podrían gustarte.",
    });
  } catch (error) {
    console.error("Gemini search error:", error);
    res.status(500).json({
      error: "Search failed",
      items: [],
      total: 0,
      hasResults: false,
    });
  }
});

/**
 * POST /api/gemini-search/anime
 */
router.post("/gemini-search/anime", async (req, res): Promise<void> => {
  try {
    const { query, limit = 30, offset = 0, profile } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    const intent = await extractSearchIntentWithGemini(query);
    const catalogData = await getAnime({
      profile,
      limit: 500,
      offset: 0,
    });

    const scored = (catalogData.items || []).map((item: any) => {
      const confidenceScore = calculateConfidenceScore(item, intent);
      return {
        ...item,
        _confidenceScore: confidenceScore,
        _badge: getConfidenceBadge(confidenceScore),
      };
    });

    scored.sort((a: any, b: any) => b._confidenceScore - a._confidenceScore);
    const topResults = scored.slice(offset, offset + limit);

    const withDetails = topResults.map((item: any) => {
      const { _confidenceScore, _badge, ...rest } = item;
      return {
        ...rest,
        _aiConfidence: _confidenceScore,
        _aiBadge: _badge,
        _aiExplanation: `${_badge} • ${_confidenceScore}% de coincidencia`,
      };
    });

    const intentExplanation = `🧠 Enygma AI entendió que buscas:\n${
      intent.themes.map((t: string) => `• ${t}`).join("\n") ||
      intent.genres.map((g: string) => `• ${g}`).join("\n")
    }\n✨ Encontramos los mejores animes para ti.`;

    setCacheHeaders(res, 30);
    res.json({
      items: withDetails,
      total: scored.length,
      intent: {
        ...intent,
        userFriendlyExplanation: intentExplanation,
      },
      hasResults: withDetails.length > 0,
      message: withDetails.length > 0
        ? "✨ Encontramos los mejores animes para ti"
        : "No encontramos coincidencias exactas, pero estos animes podrían gustarte.",
    });
  } catch (error) {
    console.error("Gemini search error:", error);
    res.status(500).json({
      error: "Search failed",
      items: [],
      total: 0,
      hasResults: false,
    });
  }
});

export default router;
