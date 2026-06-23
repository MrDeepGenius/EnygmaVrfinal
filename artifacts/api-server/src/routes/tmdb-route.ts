import { Router, type IRouter } from "express";
import { GetTmdbDetailsQueryParams, GetTmdbDetailsResponse, GetTmdbPersonQueryParams, GetTmdbPersonResponse } from "@workspace/api-zod";
import { getTmdbDetails, getTmdbPerson } from "../lib/tmdb";

const router: IRouter = Router();

router.get("/tmdb/details", async (req, res): Promise<void> => {
  const params = GetTmdbDetailsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { tmdbId, type } = params.data;
  const details = await getTmdbDetails(tmdbId, type as "movie" | "tv");
  if (!details) {
    res.status(404).json({ error: "TMDB details not found" });
    return;
  }
  res.json(GetTmdbDetailsResponse.parse(details));
});

router.get("/tmdb/person", async (req, res): Promise<void> => {
  const params = GetTmdbPersonQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const person = await getTmdbPerson(params.data.personId);
  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }
  res.json(GetTmdbPersonResponse.parse(person));
});

export default router;
