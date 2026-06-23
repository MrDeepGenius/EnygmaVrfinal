import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";
import { clearSheetsCache, getHomeContent } from "../lib/sheets";

const router: IRouter = Router();

function getConfigPath(): string {
  // En producción (DigitalOcean App Platform), conviene montar un volumen persistente
  // y apuntar ahí con ADMIN_CONFIG_PATH.
  const fromEnv = (process.env.ADMIN_CONFIG_PATH || "").trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), "data", "admin-config.json");
}

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY || "b9b334be32f57187296a06cfed4f2821";
const IMG = "https://image.tmdb.org/t/p/w500";
const BACK = "https://image.tmdb.org/t/p/w1280";

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(getConfigPath(), "utf-8"));
  } catch {
    return { banner: { override: false, items: [] }, top10: { override: false, items: [] }, hiddenSections: [], customSections: [] };
  }
}

function writeConfig(data: unknown) {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf-8");
}

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("language", "es-ES");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

router.get("/admin/config", (_req, res): void => {
  res.json(readConfig());
});

router.post("/admin/config", (req, res): void => {
  try {
    writeConfig(req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/admin/sync-sheets", async (_req, res): Promise<void> => {
  try {
    // Fuerza a volver a traer las Google Sheets (sin esperar TTL).
    clearSheetsCache();
    await getHomeContent();
    res.json({ ok: true, message: "Google Sheets sincronizado correctamente" });
  } catch (e) {
    res.status(500).json({ error: String(e), message: "Error al sincronizar Google Sheets" });
  }
});

router.get("/admin/tmdb-fetch", async (req, res): Promise<void> => {
  const type = (req.query.type as string) || "trending";
  let endpoint = "/trending/all/week";
  if (type === "popular_movies") endpoint = "/movie/popular";
  if (type === "popular_series") endpoint = "/tv/popular";
  if (type === "upcoming") endpoint = "/movie/upcoming";
  if (type === "top_rated") endpoint = "/movie/top_rated";
  if (type === "top_rated_series") endpoint = "/tv/top_rated";

  interface TmdbListResult {
    results: Array<{
      id: number;
      title?: string;
      name?: string;
      media_type?: string;
      poster_path: string | null;
      backdrop_path: string | null;
      overview: string;
      vote_average: number;
      release_date?: string;
      first_air_date?: string;
    }>;
  }

  const data = await tmdbGet<TmdbListResult>(endpoint, { page: "1" });
  if (!data) { res.status(502).json({ error: "TMDB error" }); return; }

  const items = data.results.slice(0, 20).map((item) => ({
    id: String(item.id),
    tmdbId: item.id,
    titulo: item.title || item.name || "Sin título",
    tipo: item.media_type === "tv" ? "serie" : (type.includes("series") ? "serie" : "movie"),
    posterUrl: item.poster_path ? `${IMG}${item.poster_path}` : null,
    backdropUrl: item.backdrop_path ? `${BACK}${item.backdrop_path}` : null,
    overview: item.overview,
    year: (item.release_date || item.first_air_date || "").slice(0, 4),
    rating: item.vote_average,
  }));

  res.json({ items });
});

router.get("/admin/tmdb-search", async (req, res): Promise<void> => {
  const qRaw = (req.query.q as string | undefined) ?? "";
  const q = qRaw.trim();
  const tipoRaw = (req.query.tipo as string | undefined) ?? "movie"; // movie | serie | anime | multi

  if (!q) {
    res.status(400).json({ error: "Missing q param" });
    return;
  }

  // Nota:
  // - "anime" en TMDB no es un media_type real; usamos search/tv como aproximación.
  // - "multi" devuelve movies + tv; filtramos personas.
  let endpoint = "/search/movie";
  if (tipoRaw === "serie" || tipoRaw === "anime") endpoint = "/search/tv";
  if (tipoRaw === "multi") endpoint = "/search/multi";

  interface TmdbSearchResult {
    results: Array<{
      id: number;
      media_type?: "movie" | "tv" | "person";
      title?: string;
      name?: string;
      poster_path: string | null;
      backdrop_path: string | null;
      overview?: string;
      release_date?: string;
      first_air_date?: string;
      vote_average?: number;
    }>;
  }

  const data = await tmdbGet<TmdbSearchResult>(endpoint, {
    query: q,
    include_adult: "false",
    page: "1",
  });

  if (!data) {
    res.status(502).json({ error: "TMDB error" });
    return;
  }

  const items = data.results
    .filter((r) => r.media_type !== "person")
    .slice(0, 20)
    .map((r) => {
      const isTv = r.media_type === "tv" || endpoint === "/search/tv";
      const resolvedTipo =
        tipoRaw === "anime" ? "anime" : isTv ? "serie" : "movie";

      return {
        tmdbId: r.id,
        titulo: r.title || r.name || "Sin título",
        tipo: resolvedTipo,
        posterUrl: r.poster_path ? `${IMG}${r.poster_path}` : null,
        backdropUrl: r.backdrop_path ? `${BACK}${r.backdrop_path}` : null,
        overview: r.overview || "",
        year: (r.release_date || r.first_air_date || "").slice(0, 4),
        rating: r.vote_average ?? null,
      };
    });

  res.json({ items });
});

export default router;
