import { logger } from "./logger";
import { getLogoUrl, getTrendingMovies, getTopRatedMovies } from "./tmdb";

function envUrl(name: string): string | null {
  const v = process.env[name];
  if (!v) return null;
  const trimmed = v.trim();
  return trimmed ? trimmed : null;
}

/**
 * Fuente de contenido (Google Sheets en CSV export).
 *
 * Se puede overridear por variables de entorno, por ejemplo en:
 * `artifacts/api-server/.env`
 *
 *   MOVIES_SHEET_URL=...
 *   SERIES_SHEET_URL=...
 *   ANIME_SHEET_URL=...
 */
const SHEET_URLS = {
  movies:
    envUrl("MOVIES_SHEET_URL") ??
    "https://docs.google.com/spreadsheets/d/1Xv3EcCNlwwxzLWfEeY_rjNcnGNyMc93IuHKVw6mjeRw/export?format=csv&gid=208195175",
  series:
    envUrl("SERIES_SHEET_URL") ??
    "https://docs.google.com/spreadsheets/d/1FuovS9r9syC7n3wykiILuxKuf9w6TqAtyHecV9PP4i0/export?format=csv&gid=642855286",
  anime:
    envUrl("ANIME_SHEET_URL") ??
    "https://docs.google.com/spreadsheets/d/1dyr3NtX4PQ-Znje2dJOd0UTFKinwkSBPqk0SOAWuG28/export?format=csv&gid=0",
};

function readEnvNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// Cache de Google Sheets:
// - Default más agresivo para que los cambios aparezcan rápido
// - Configurable por env (ms) en producción
const CACHE_TTL_MS = readEnvNumber("SHEETS_CACHE_TTL_MS", 5 * 60 * 1000);

// Cache del agregado de Home
const HOME_CACHE_TTL_MS = readEnvNumber("HOME_CACHE_TTL_MS", 2 * 60 * 1000);

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const homeCache = new Map<string, CacheEntry<unknown>>();

export function clearSheetsCache(): void {
  cache.clear();
  homeCache.clear();
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n");
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string | null | undefined): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    // Keep the LAST occurrence (overwrite previous)
    seen.set(key, item);
  }
  return Array.from(seen.values());
}

async function fetchSheet(key: keyof typeof SHEET_URLS): Promise<Record<string, string>[]> {
  const cached = cache.get(key) as CacheEntry<Record<string, string>[]> | undefined;
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  logger.info({ sheet: key, url: SHEET_URLS[key] }, "Fetching Google Sheet");
  
  // Retry logic with exponential backoff
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const timeout = 15000; // 15 seconds timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const res = await fetch(SHEET_URLS[key], { 
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Enygma-API/1.0"
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const error = new Error(`Failed to fetch sheet ${key}: ${res.status} ${res.statusText}`);
        logger.error({ sheet: key, status: res.status, attempt }, error.message);
        lastError = error;
        
        // Retry on 500/502/503 errors
        if ([500, 502, 503].includes(res.status) && attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          logger.info({ sheet: key, delay }, `Retrying after ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        
        throw error;
      }
      
      const text = await res.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error(`Sheet ${key} returned empty response`);
      }
      
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        logger.warn({ sheet: key }, "Sheet returned no data rows");
      }
      
      cache.set(key, { data: rows, fetchedAt: Date.now() });
      logger.info({ sheet: key, rowCount: rows.length }, "Sheet fetched successfully");
      return rows;
    } catch (error) {
      const err = error as Error;
      
      if (err.name === "AbortError") {
        logger.error({ sheet: key, attempt }, "Sheet fetch timeout");
      } else {
        logger.error({ sheet: key, attempt, error: err.message }, "Sheet fetch error");
      }
      
      lastError = err;
      
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  // If we have cached data even if expired, return it as fallback
  if (cached) {
    logger.warn({ sheet: key }, "Using expired cache as fallback due to fetch error");
    return cached.data;
  }
  
  throw lastError || new Error(`Failed to fetch sheet ${key} after ${maxRetries} attempts`);
}

export interface Movie {
  id: string;
  titulo: string;
  sinopsis: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  logoUrl: string | null;
  urlReproduccion: string | null;
  youtubeTrailer: string | null;
  genero: string | null;
  año: string | null;
  actores: string | null;
  vistas: string | null;
  esVip: boolean;
  enBanner: boolean;
  tipo: string | null;
  status: string | null;
  valoracion: string | null;
  categoria: "movie";
}

export interface SeriesParent {
  id: string;
  titulo: string;
  sinopsis: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  logoUrl: string | null;
  youtubeTrailer: string | null;
  genero: string | null;
  año: string | null;
  visible: boolean;
  totalSeasons: number;
  totalEpisodes: number;
  categoria: "serie" | "anime";
}

export interface Episode {
  serieId: string;
  temporada: string | null;
  episodio: string | null;
  tituloEpisodio: string;
  urlReproduccion: string | null;
  urlReproduccion2: string | null;
}

const KIDS_GENRES = [
  "animation",
  "animación",
  "family",
  "familia",
  "infantil",
  "kids",
  "children",
  "niños",
];

function isKidsContent(genero: string | null, titulo: string): boolean {
  if (!genero) return false;
  const g = genero.toLowerCase();
  return KIDS_GENRES.some((kg) => g.includes(kg));
}

function filterByProfile(
  items: Movie[],
  profile?: string,
): Movie[] {
  if (profile === "kids") {
    return items.filter((m) => isKidsContent(m.genero, m.titulo));
  }
  return items;
}

function filterSeriesByProfile(
  items: SeriesParent[],
  profile?: string,
): SeriesParent[] {
  if (profile === "kids") {
    return items.filter((s) => isKidsContent(s.genero, s.titulo));
  }
  return items;
}

export async function getMovies(opts?: {
  profile?: string;
  section?: string;
  genre?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: Movie[]; total: number }> {
  const rowsRaw = await fetchSheet("movies");
  // Si la sheet tiene filas duplicadas por id_unico, nos quedamos con la PRIMERA
  // aparición (no tomamos la última que hayas agregado de nuevo).
  const rows = uniqueBy(
    rowsRaw.filter((r) => r["id_unico"] && r["titulo"]),
    (r) => r["id_unico"],
  );

  let items: Movie[] = rows.map((r) => ({
      id: r["id_unico"],
      titulo: r["titulo"] || "",
      sinopsis: r["sinopsis"] || null,
      posterUrl: r["poster_url"] || null,
      backdropUrl: r["backdrop_url"] || null,
      logoUrl: null,
      urlReproduccion: r["url_reproduccion"] || null,
      youtubeTrailer: r["youtube_trailer"] || null,
      genero: r["genero"] || null,
      año: r["año"] || null,
      actores: r["actores"] || null,
      vistas: r["vistas"] || null,
      esVip: r["es_vip"]?.toLowerCase() === "true" || r["es_vip"] === "1",
      enBanner: r["en_banner"]?.toLowerCase() === "true" || r["en_banner"] === "1",
      tipo: r["tipo"] || null,
      status: r["status"] || null,
      valoracion: r["valoracion"] || null,
      categoria: "movie" as const,
    }));

  const section = opts?.section;

  if (section === "banner") {
    items = items.filter((m) => m.enBanner).slice(0, 10);
  } else if (section === "top10") {
    items = [...items]
      .sort((a, b) => {
        const va = parseFloat(a.valoracion || "0") || 0;
        const vb = parseFloat(b.valoracion || "0") || 0;
        return vb - va;
      })
      .slice(0, 10);
  } else if (section === "trending") {
    items = [...items]
      .sort((a, b) => {
        const va = parseInt(a.vistas || "0", 10) || 0;
        const vb = parseInt(b.vistas || "0", 10) || 0;
        return vb - va;
      })
      .slice(0, 30);
  } else if (section === "recommended") {
    items = [...items]
      .filter((m) => parseFloat(m.valoracion || "0") >= 7)
      .slice(0, 30);
  } else if (section === "latest") {
    items = [...items].reverse().slice(0, 30);
  } else {
    // Full grid — latest added first (bottom-to-top of sheet)
    items = [...items].reverse();
  }

  items = filterByProfile(items, opts?.profile);

  if (opts?.genre) {
    const g = opts.genre.toLowerCase();
    items = items.filter((m) => m.genero?.toLowerCase().includes(g));
  }

  if (opts?.search) {
    const q = opts.search.toLowerCase();
    items = items.filter(
      (m) =>
        m.titulo.toLowerCase().includes(q) ||
        m.sinopsis?.toLowerCase().includes(q) ||
        m.actores?.toLowerCase().includes(q),
    );
  }

  const total = items.length;
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 20;
  return { items: items.slice(offset, offset + limit), total };
}

export async function getMovieById(id: string): Promise<Movie | null> {
  const rows = await fetchSheet("movies");
  const row = rows.find((r) => r["id_unico"] === id);
  if (!row) return null;
  const logoUrl = await getLogoUrl(id, "movie").catch(() => null);
  return {
    id: row["id_unico"],
    titulo: row["titulo"] || "",
    sinopsis: row["sinopsis"] || null,
    posterUrl: row["poster_url"] || null,
    backdropUrl: row["backdrop_url"] || null,
    logoUrl,
    urlReproduccion: row["url_reproduccion"] || null,
    youtubeTrailer: row["youtube_trailer"] || null,
    genero: row["genero"] || null,
    año: row["año"] || null,
    actores: row["actores"] || null,
    vistas: row["vistas"] || null,
    esVip: row["es_vip"]?.toLowerCase() === "true" || row["es_vip"] === "1",
    enBanner: row["en_banner"]?.toLowerCase() === "true" || row["en_banner"] === "1",
    tipo: row["tipo"] || null,
    status: row["status"] || null,
    valoracion: row["valoracion"] || null,
    categoria: "movie" as const,
  };
}

async function buildSeriesAndEpisodes(): Promise<{
  seriesList: SeriesParent[];
  episodeMap: Map<string, Episode[]>;
}> {
  const rows = await fetchSheet("series");

  const parentRows = uniqueBy(
    rows.filter((r) => r["tipo"] === "serie" && r["id"]),
    (r) => r["id"],
  );
  const episodeRows = rows.filter((r) => r["tipo"] === "episodio" && r["serie_id"]);

  const episodeMap = new Map<string, Episode[]>();
  for (const ep of episodeRows) {
    const sid = ep["serie_id"];
    if (!sid) continue;
    if (!episodeMap.has(sid)) episodeMap.set(sid, []);
    episodeMap.get(sid)!.push({
      serieId: sid,
      temporada: ep["temporada"] || null,
      episodio: ep["episodio"] || null,
      tituloEpisodio: ep["titulo_episodio"] || "",
      urlReproduccion: ep["url_reproduccion"] || null,
      urlReproduccion2: null,
    });
  }

  const seriesList: SeriesParent[] = parentRows
    .filter((r) => r["visible"]?.toLowerCase() !== "false")
    .map((r) => {
      const sid = r["id"];
      const eps = episodeMap.get(sid) || [];
      const seasons = new Set(eps.map((e) => e.temporada).filter(Boolean));
      return {
        id: sid,
        titulo: r["titulo"] || "",
        sinopsis: r["sipnosis"] || null,
        posterUrl: r["poster_url"] || null,
        backdropUrl: r["backdrop_url"] || null,
        logoUrl: null,
        youtubeTrailer: r["Trailer"] || null,
        genero: null,
        año: null,
        visible: r["visible"]?.toLowerCase() !== "false",
        totalSeasons: seasons.size || 1,
        totalEpisodes: eps.length,
        categoria: "serie" as const,
      };
    });

  return { seriesList, episodeMap };
}

async function buildAnimeAndEpisodes(): Promise<{
  animeList: SeriesParent[];
  episodeMap: Map<string, Episode[]>;
}> {
  const rows = await fetchSheet("anime");

  const validRows = rows.filter(
    (r) => r["tipo"] === "anime" && r["id"] && r["titulo"] !== "titulo",
  );

  const episodeMap = new Map<string, Episode[]>();
  const animeMap = new Map<string, SeriesParent>();

  for (const r of validRows) {
    const sid = r["serie_id"] || r["id"];
    const animeId = r["id"];

    if (!animeMap.has(animeId)) {
      animeMap.set(animeId, {
        id: animeId,
        titulo: r["titulo"] || "",
        sinopsis: r["sipnosis"] || null,
        posterUrl: r["poster_url"] || null,
        backdropUrl: r["backdrop_url"] || null,
        logoUrl: null,
        youtubeTrailer: r["Trailer"] || null,
        genero: r["genero"] || null,
        año: r["año"] || null,
        visible: true,
        totalSeasons: 0,
        totalEpisodes: 0,
        categoria: "anime" as const,
      });
    }

    if (r["episodio"]) {
      if (!episodeMap.has(animeId)) episodeMap.set(animeId, []);
      episodeMap.get(animeId)!.push({
        serieId: animeId,
        temporada: r["temporada"] || null,
        episodio: r["episodio"] || null,
        tituloEpisodio: r["titulo_episodio"] || "",
        urlReproduccion: r["url_reproduccion"] || null,
        urlReproduccion2: r["url_reproduccion_2"] || null,
      });
    }
  }

  const animeList = Array.from(animeMap.values()).map((a) => {
    const eps = episodeMap.get(a.id) || [];
    const seasons = new Set(eps.map((e) => e.temporada).filter(Boolean));
    return { ...a, totalSeasons: seasons.size || 1, totalEpisodes: eps.length };
  });

  return { animeList, episodeMap };
}

export async function getSeries(opts?: {
  profile?: string;
  section?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: SeriesParent[]; total: number }> {
  const { seriesList } = await buildSeriesAndEpisodes();

  let items = filterSeriesByProfile(seriesList, opts?.profile);

  if (opts?.section === "latest") {
    items = [...items].reverse();
  } else if (opts?.section === "trending") {
    items = [...items].slice(0, 30);
  } else if (opts?.section === "recommended") {
    items = [...items].filter((s) => s.totalEpisodes > 5).slice(0, 30);
  } else {
    // Full grid — latest added first (bottom-to-top of sheet)
    items = [...items].reverse();
  }

  if (opts?.search) {
    const q = opts.search.toLowerCase();
    items = items.filter((s) => s.titulo.toLowerCase().includes(q));
  }

  const total = items.length;
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 20;
  return { items: items.slice(offset, offset + limit), total };
}

export async function getSeriesById(
  id: string,
): Promise<{ series: SeriesParent; episodes: Episode[]; seasons: number[] } | null> {
  const { seriesList, episodeMap } = await buildSeriesAndEpisodes();
  const series = seriesList.find((s) => s.id === id);
  if (!series) return null;
  const episodes = episodeMap.get(id) || [];
  const seasonsSet = new Set(
    episodes.map((e) => parseInt(e.temporada || "1", 10) || 1),
  );
  const logoUrl = await getLogoUrl(id, "tv").catch(() => null);
  return { series: { ...series, logoUrl }, episodes, seasons: Array.from(seasonsSet).sort((a, b) => a - b) };
}

export async function getAnime(opts?: {
  profile?: string;
  section?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: SeriesParent[]; total: number }> {
  const { animeList } = await buildAnimeAndEpisodes();

  let items = filterSeriesByProfile(animeList, opts?.profile);

  // Always show latest added first (bottom-to-top of sheet)
  items = [...items].reverse();

  if (opts?.search) {
    const q = opts.search.toLowerCase();
    items = items.filter((s) => s.titulo.toLowerCase().includes(q));
  }

  const total = items.length;
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 20;
  return { items: items.slice(offset, offset + limit), total };
}

export async function getAnimeById(
  id: string,
): Promise<{ series: SeriesParent; episodes: Episode[]; seasons: number[] } | null> {
  const { animeList, episodeMap } = await buildAnimeAndEpisodes();
  const series = animeList.find((s) => s.id === id);
  if (!series) return null;
  const episodes = episodeMap.get(id) || [];
  const seasonsSet = new Set(
    episodes.map((e) => parseInt(e.temporada || "1", 10) || 1),
  );
  const logoUrl = await getLogoUrl(id, "tv").catch(() => null);
  return { series: { ...series, logoUrl }, episodes, seasons: Array.from(seasonsSet).sort((a, b) => a - b) };
}

export async function getHomeContent(profile?: string): Promise<{
  banner: Movie[];
  top10: Movie[];
  trending: Movie[];
  recommended: Movie[];
  latestMovies: Movie[];
  latestSeries: SeriesParent[];
  latestAnime: SeriesParent[];
}> {
  const cacheKey = `home:${profile || "default"}`;
  const cached = homeCache.get(cacheKey) as
    | CacheEntry<{
        banner: Movie[];
        top10: Movie[];
        trending: Movie[];
        recommended: Movie[];
        latestMovies: Movie[];
        latestSeries: SeriesParent[];
        latestAnime: SeriesParent[];
      }>
    | undefined;

  if (cached && Date.now() - cached.fetchedAt < HOME_CACHE_TTL_MS) {
    return cached.data;
  }

  const [moviesRawAll, { seriesList }, { animeList }] = await Promise.all([
    fetchSheet("movies"),
    buildSeriesAndEpisodes(),
    buildAnimeAndEpisodes(),
  ]);

  const moviesRaw = uniqueBy(
    moviesRawAll.filter((r) => r["id_unico"] && r["titulo"]),
    (r) => r["id_unico"],
  );

  let allMovies: Movie[] = moviesRaw.map((r) => ({
      id: r["id_unico"],
      titulo: r["titulo"] || "",
      sinopsis: r["sinopsis"] || null,
      posterUrl: r["poster_url"] || null,
      backdropUrl: r["backdrop_url"] || null,
      logoUrl: null,
      urlReproduccion: r["url_reproduccion"] || null,
      youtubeTrailer: r["youtube_trailer"] || null,
      genero: r["genero"] || null,
      año: r["año"] || null,
      actores: r["actores"] || null,
      vistas: r["vistas"] || null,
      esVip: r["es_vip"]?.toLowerCase() === "true" || r["es_vip"] === "1",
      enBanner: r["en_banner"]?.toLowerCase() === "true" || r["en_banner"] === "1",
      tipo: r["tipo"] || null,
      status: r["status"] || null,
      valoracion: r["valoracion"] || null,
      categoria: "movie" as const,
    }));

  allMovies = filterByProfile(allMovies, profile);
  const allSeries = filterSeriesByProfile(seriesList, profile);
  const allAnime = filterSeriesByProfile(animeList, profile);

  // TOP 10 - ALWAYS from Google Sheets, UNIVERSAL for all users (NO profile filter)
  // These have real IDs from catalog and are the same for everyone
  const top10Unfiltered = [...moviesRaw
    .map((r) => ({
      id: r["id_unico"],
      titulo: r["titulo"] || "",
      sinopsis: r["sinopsis"] || null,
      posterUrl: r["poster_url"] || null,
      backdropUrl: r["backdrop_url"] || null,
      logoUrl: null,
      urlReproduccion: r["url_reproduccion"] || null,
      youtubeTrailer: r["youtube_trailer"] || null,
      genero: r["genero"] || null,
      año: r["año"] || null,
      actores: r["actores"] || null,
      vistas: r["vistas"] || null,
      esVip: r["es_vip"]?.toLowerCase() === "true" || r["es_vip"] === "1",
      enBanner: r["en_banner"]?.toLowerCase() === "true" || r["en_banner"] === "1",
      tipo: r["tipo"] || null,
      status: r["status"] || null,
      valoracion: r["valoracion"] || null,
      categoria: "movie" as const,
    }))]
    .sort((a, b) => {
      const va = parseFloat(a.valoracion || "0") || 0;
      const vb = parseFloat(b.valoracion || "0") || 0;
      return vb - va;
    })
    .slice(0, 10);

  const trending = [...allMovies]
    .filter((m) => m.vistas && parseInt(m.vistas, 10) > 0)
    .sort((a, b) => parseInt(b.vistas || "0", 10) - parseInt(a.vistas || "0", 10))
    .slice(0, 20);

  const trending2 = trending.length < 10 ? allMovies.slice(0, 20) : trending;

  const recommended = [...allMovies]
    .filter((m) => parseFloat(m.valoracion || "0") >= 7)
    .slice(0, 20);

  const latestMovies = [...allMovies].reverse().slice(0, 20);
  const latestSeries = [...allSeries].reverse().slice(0, 20);
  const latestAnime = [...allAnime].reverse().slice(0, 20);

  // Banner: pinned titles always appear first, in order
  const PINNED_BANNER_TITLES = [
    "obsesion",
    "spidernoir",
    "te encontrare",
  ];

  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .trim();

  const pinnedBanner: Movie[] = [];
  for (const title of PINNED_BANNER_TITLES) {
    const norm = normalize(title);
    // Search movies first
    const foundMovie = allMovies.find((m) =>
      normalize(m.titulo).includes(norm)
    );
    if (foundMovie) {
      pinnedBanner.push(foundMovie);
      continue;
    }
    // Then search series and anime
    const foundSerie = [...allSeries, ...allAnime].find((s) =>
      normalize(s.titulo).includes(norm)
    );
    if (foundSerie) {
      pinnedBanner.push({
        id: foundSerie.id,
        titulo: foundSerie.titulo,
        sinopsis: foundSerie.sinopsis,
        posterUrl: foundSerie.posterUrl,
        backdropUrl: foundSerie.backdropUrl,
        logoUrl: foundSerie.logoUrl,
        urlReproduccion: null,
        youtubeTrailer: foundSerie.youtubeTrailer,
        genero: foundSerie.genero,
        año: foundSerie.año,
        actores: null,
        vistas: null,
        esVip: false,
        enBanner: true,
        tipo: null,
        status: null,
        valoracion: null,
        categoria: "movie",
      });
    }
  }

  // Banner: SOLO los títulos fijados, sin relleno adicional
  const banner: Movie[] = pinnedBanner;

  const result = {
    banner,
    top10: top10Unfiltered.length > 0 ? top10Unfiltered : allMovies.slice(0, 10), // Fallback to profile-filtered movies from Sheets
    trending: trending2,
    recommended: recommended.length > 0 ? recommended : latestMovies.slice(0, 20),
    latestMovies,
    latestSeries,
    latestAnime,
  };

  homeCache.set(cacheKey, { data: result, fetchedAt: Date.now() });
  return result;
}

export async function searchContent(
  q: string,
  profile?: string,
  limit = 30,
): Promise<{
  movies: Array<{ id: string; titulo: string; posterUrl: string | null; genero: string | null; año: string | null; categoria: "movie" }>;
  series: Array<{ id: string; titulo: string; posterUrl: string | null; genero: string | null; año: string | null; categoria: "serie" }>;
  anime: Array<{ id: string; titulo: string; posterUrl: string | null; genero: string | null; año: string | null; categoria: "anime" }>;
  total: number;
}> {
  const ql = q.toLowerCase();
  const [{ items: movies }, { items: seriesItems }, { items: animeItems }] = await Promise.all([
    getMovies({ profile, search: q, limit }),
    getSeries({ profile, search: q, limit }),
    getAnime({ profile, search: q, limit }),
  ]);

  const movieResults = movies.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    posterUrl: m.posterUrl,
    genero: m.genero,
    año: m.año,
    categoria: "movie" as const,
  }));

  const seriesResults = seriesItems.map((s) => ({
    id: s.id,
    titulo: s.titulo,
    posterUrl: s.posterUrl,
    genero: s.genero,
    año: s.año,
    categoria: "serie" as const,
  }));

  const animeResults = animeItems.map((a) => ({
    id: a.id,
    titulo: a.titulo,
    posterUrl: a.posterUrl,
    genero: a.genero,
    año: a.año,
    categoria: "anime" as const,
  }));

  return {
    movies: movieResults,
    series: seriesResults,
    anime: animeResults,
    total: movieResults.length + seriesResults.length + animeResults.length,
  };
}
