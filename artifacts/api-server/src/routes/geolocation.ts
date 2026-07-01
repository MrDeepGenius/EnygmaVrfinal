import { Router, type Request, type Response } from "express";
import { getFullGeoLocation, storeGeoLocation, getStoredGeoLocations, clearGeoLocations, getGeoStats, resetGeoStats } from "../lib/geolocation";

const router = Router();

router.get("/track", async (req: Request, res: Response) => {
  try {
    const geo = await getFullGeoLocation(req);
    storeGeoLocation(geo);
    res.json(geo);
  } catch (error) {
    console.error("Track geolocation error:", error);
    res.status(500).json({ error: "Failed to track geolocation" });
  }
});

router.get("/stats", (_req: Request, res: Response) => {
  try {
    res.json(getGeoStats());
  } catch (error) {
    console.error("Stats geolocation error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/list", (_req: Request, res: Response) => {
  try {
    const locations = getStoredGeoLocations();
    res.json({ total: locations.length, locations });
  } catch (error) {
    console.error("List geolocation error:", error);
    res.status(500).json({ error: "Failed to list geolocation" });
  }
});

router.post("/clear", (_req: Request, res: Response) => {
  try {
    resetGeoStats();
    clearGeoLocations();
    res.json({ success: true, message: "Geolocation data cleared" });
  } catch (error) {
    console.error("Clear geolocation error:", error);
    res.status(500).json({ error: "Failed to clear geolocation" });
  }
});

export default router;
