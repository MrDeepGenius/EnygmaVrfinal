import { Router, type IRouter, type Request, type Response } from "express";
import {
  ListMoviesQueryParams,
  ListSeriesQueryParams,
  ListAnimeQueryParams,
  GetHomeContentQueryParams,
  SearchContentQueryParams,
  ListMoviesResponse,
  GetMovieResponse,
  ListSeriesResponse,
  GetSeriesDetailResponse,
  ListAnimeResponse,
  GetAnimeDetailResponse,
  GetHomeContentResponse,
  SearchContentResponse,
  GetMovieParams,
  GetSeriesDetailParams,
  GetAnimeDetailParams,
} from "@workspace/api-zod";
import {
  getMovies,
  getMovieById,
  getSeries,
  getSeriesById,
  getAnime,
  getAnimeById,
  getHomeContent,
  searchContent,
} from "../lib/sheets";

const router: IRouter = Router();

function setCacheHeaders(res: Response, seconds: number) {
  res.set("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
}

router.get("/content/movies", async (req, res): Promise<void> => {
  const params = ListMoviesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { profile, section, genre, search, limit, offset } = params.data;
  const result = await getMovies({ profile, section, genre, search, limit, offset });
  setCacheHeaders(res, 300);
  res.json(ListMoviesResponse.parse(result));
});

router.get("/content/movies/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const movie = await getMovieById(raw);
  if (!movie) {
    res.status(404).json({ error: "Movie not found" });
    return;
  }
  setCacheHeaders(res, 300);
  res.json(GetMovieResponse.parse(movie));
});

router.get("/content/series", async (req, res): Promise<void> => {
  const params = ListSeriesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { profile, section, search, limit, offset } = params.data;
  const result = await getSeries({ profile, section, search, limit, offset });
  setCacheHeaders(res, 300);
  res.json(ListSeriesResponse.parse(result));
});

router.get("/content/series/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const detail = await getSeriesById(raw);
  if (!detail) {
    res.status(404).json({ error: "Series not found" });
    return;
  }
  setCacheHeaders(res, 300);
  res.json(GetSeriesDetailResponse.parse(detail));
});

router.get("/content/anime", async (req, res): Promise<void> => {
  const params = ListAnimeQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { profile, section, search, limit, offset } = params.data;
  const result = await getAnime({ profile, section, search, limit, offset });
  setCacheHeaders(res, 300);
  res.json(ListAnimeResponse.parse(result));
});

router.get("/content/anime/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const detail = await getAnimeById(raw);
  if (!detail) {
    res.status(404).json({ error: "Anime not found" });
    return;
  }
  setCacheHeaders(res, 300);
  res.json(GetAnimeDetailResponse.parse(detail));
});

router.get("/content/home", async (req, res): Promise<void> => {
  const params = GetHomeContentQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const home = await getHomeContent(params.data.profile);
  setCacheHeaders(res, 120);
  res.json(GetHomeContentResponse.parse(home));
});

router.get("/content/search", async (req, res): Promise<void> => {
  const params = SearchContentQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { q, profile, limit } = params.data;
  const results = await searchContent(q, profile, limit);
  setCacheHeaders(res, 60);
  res.json(SearchContentResponse.parse(results));
});

export default router;
