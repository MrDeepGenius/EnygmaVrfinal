import { Router, type IRouter, type Request, type Response } from "express";
import { getMovies, getSeries, getAnime } from "../lib/sheets";

const router: IRouter = Router();

/**
 * Simple semantic search using word matching and category inference
 * This provides "AI-like" suggestions based on the user's mood description
 */
function inferSearchTermsFromMood(moodDescription: string): string[] {
  const lower = moodDescription.toLowerCase();
  const terms: string[] = [];

  // Mood/Genre mapping for common descriptions
  const moodMappings: Record<string, string[]> = {
    // Action-related moods
    "rápid": ["Acción", "Aventura"],
    "violent": ["Acción", "Thriller"],
    "robot": ["Ciencia Ficción", "Acción"],
    "futur": ["Ciencia Ficción", "Thriller"],
    "superhé": ["Acción", "Aventura"],
    "explosiv": ["Acción", "Thriller"],
    "pelea": ["Acción"],
    "lucha": ["Acción"],
    "batalla": ["Acción", "Aventura"],

    // Horror/Thriller moods
    "terror": ["Terror"],
    "miedo": ["Terror"],
    "psicológic": ["Thriller", "Drama"],
    "suspen": ["Thriller", "Drama"],
    "oscur": ["Thriller", "Drama"],
    "asust": ["Terror"],

    // Comedy moods
    "comedi": ["Comedia"],
    "divertid": ["Comedia", "Aventura"],
    "rir": ["Comedia"],
    "gracioso": ["Comedia"],
    "humor": ["Comedia"],

    // Drama/Romance
    "drama": ["Drama", "Romance"],
    "románt": ["Romance", "Drama"],
    "amor": ["Romance", "Drama"],
    "emocion": ["Drama", "Romance"],
    "sentimental": ["Romance", "Drama"],

    // Family-friendly
    "familia": ["Familia", "Animación"],
    "niños": ["Familia", "Animación"],
    "infantil": ["Familia", "Animación"],
    "chicos": ["Familia"],

    // Adventure
    "aventur": ["Aventura", "Acción"],
    "explor": ["Aventura", "Ciencia Ficción"],
    "descubrimiento": ["Aventura", "Drama"],
    "misterio": ["Thriller", "Drama"],
  };

  // Find matching genres based on mood keywords
  for (const [keyword, genres] of Object.entries(moodMappings)) {
    if (lower.includes(keyword)) {
      terms.push(...genres);
    }
  }

  // Extract standalone genre words if they appear
  const directGenres = ["acción", "comedia", "drama", "ciencia ficción", "terror", "aventura", "animación", "thriller", "romance", "familia", "misterio"];
  for (const genre of directGenres) {
    if (lower.includes(genre)) {
      terms.push(genre.charAt(0).toUpperCase() + genre.slice(1));
    }
  }

  // Remove duplicates
  return [...new Set(terms)];
}

/**
 * Score items based on multiple factors
 */
function scoreItem(item: any, moodLower: string, inferredGenres: string[]): number {
  let score = 0;

  // 1. Genre matching (40% weight)
  const itemGenres = (item.genero || "")
    .split(",")
    .map((g: string) => g.trim().toLowerCase());
  
  if (itemGenres.length > 0) {
    let genreMatches = 0;
    for (const genre of inferredGenres) {
      if (itemGenres.some((ig: string) => ig.includes(genre.toLowerCase()))) {
        genreMatches++;
      }
    }
    if (inferredGenres.length > 0) {
      score += (genreMatches / inferredGenres.length) * 0.4;
    } else {
      score += 0.1; // Default weight if no genres inferred
    }
  }

  // 2. Title matching (35% weight)
  const titleLower = (item.titulo || "").toLowerCase();
  const moodWords = moodLower.split(/\s+/).filter((w: string) => w.length > 2);
  let titleMatches = 0;
  for (const word of moodWords) {
    if (titleLower.includes(word)) titleMatches++;
  }
  if (moodWords.length > 0) {
    score += (titleMatches / moodWords.length) * 0.35;
  }

  // 3. Synopsis matching (25% weight)
  const synopsisLower = (item.sinopsis || "").toLowerCase();
  let synopsisMatches = 0;
  for (const word of moodWords) {
    if (synopsisLower.includes(word)) synopsisMatches++;
  }
  if (moodWords.length > 0) {
    score += (synopsisMatches / moodWords.length) * 0.25;
  }

  // 4. Minimum score - if no matches at all, still return 0.01 to show content
  return Math.max(score, 0.01);
}

function setCacheHeaders(res: Response, seconds: number) {
  res.set("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=${seconds}`);
}

/**
 * POST /api/ai-search/movies - AI-powered semantic search
 */
router.post("/ai-search/movies", async (req, res): Promise<void> => {
  try {
    const { mood, limit = 120, offset = 0, profile } = req.body;

    if (!mood || typeof mood !== "string" || mood.trim().length === 0) {
      res.status(400).json({ error: "mood parameter is required and must be non-empty" });
      return;
    }

    const moodLower = mood.toLowerCase();
    const inferredGenres = inferSearchTermsFromMood(mood);

    // Get all available movies
    const allMovies = await getMovies({
      profile,
      limit: 1000, // Fetch more to rank them
      offset: 0,
    });

    // Score movies based on multiple factors
    const scoredMovies = (allMovies.items || []).map((movie: any) => ({
      ...movie,
      _aiScore: scoreItem(movie, moodLower, inferredGenres),
    }));

    // Sort by AI score (descending)
    scoredMovies.sort((a: any, b: any) => b._aiScore - a._aiScore);

    // Remove the score field from response
    const results = scoredMovies.slice(offset, offset + limit).map((m: any) => {
      const { _aiScore, ...rest } = m;
      return rest;
    });

    setCacheHeaders(res, 15);
    res.json({
      items: results,
      total: scoredMovies.length,
    });
  } catch (error) {
    console.error("AI Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/ai-search/series", async (req, res): Promise<void> => {
  try {
    const { mood, limit = 120, offset = 0, profile } = req.body;

    if (!mood || typeof mood !== "string" || mood.trim().length === 0) {
      res.status(400).json({ error: "mood parameter is required and must be non-empty" });
      return;
    }

    const moodLower = mood.toLowerCase();
    const inferredGenres = inferSearchTermsFromMood(mood);
    const allSeries = await getSeries({
      profile,
      limit: 1000,
      offset: 0,
    });

    const scoredSeries = (allSeries.items || []).map((series: any) => ({
      ...series,
      _aiScore: scoreItem(series, moodLower, inferredGenres),
    }));

    scoredSeries.sort((a: any, b: any) => b._aiScore - a._aiScore);

    const results = scoredSeries.slice(offset, offset + limit).map((s: any) => {
      const { _aiScore, ...rest } = s;
      return rest;
    });

    setCacheHeaders(res, 15);
    res.json({
      items: results,
      total: scoredSeries.length,
    });
  } catch (error) {
    console.error("AI Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/ai-search/anime", async (req, res): Promise<void> => {
  try {
    const { mood, limit = 120, offset = 0, profile } = req.body;

    if (!mood || typeof mood !== "string" || mood.trim().length === 0) {
      res.status(400).json({ error: "mood parameter is required and must be non-empty" });
      return;
    }

    const moodLower = mood.toLowerCase();
    const inferredGenres = inferSearchTermsFromMood(mood);
    const allAnime = await getAnime({
      profile,
      limit: 1000,
      offset: 0,
    });

    const scoredAnime = (allAnime.items || []).map((anime: any) => ({
      ...anime,
      _aiScore: scoreItem(anime, moodLower, inferredGenres),
    }));

    scoredAnime.sort((a: any, b: any) => b._aiScore - a._aiScore);

    const results = scoredAnime.slice(offset, offset + limit).map((a: any) => {
      const { _aiScore, ...rest } = a;
      return rest;
    });

    setCacheHeaders(res, 15);
    res.json({
      items: results,
      total: scoredAnime.length,
    });
  } catch (error) {
    console.error("AI Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
