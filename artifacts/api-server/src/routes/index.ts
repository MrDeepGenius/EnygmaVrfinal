import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import contentRouter from "./content";
import tmdbRouter from "./tmdb-route";
import resolveRouter from "./resolve";
import hlsProxyRouter from "./hls-proxy";
import adminRouter from "./admin";
import tvRouter from "./tv";
import subtitlesRouter from "./subtitles";
import premiumRouter from "./premium";
import geoRouter from "./geolocation";
import aiSearchRouter from "./ai-search";
import geminiSearchRouter from "./gemini-search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(contentRouter);
router.use(tmdbRouter);
router.use(resolveRouter);
router.use(hlsProxyRouter);
router.use(adminRouter);
router.use(tvRouter);
router.use(subtitlesRouter);
router.use("/premium", premiumRouter);
router.use("/geo", geoRouter);
router.use("/api", aiSearchRouter);
router.use("/api", geminiSearchRouter);

export default router;
