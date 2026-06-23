import { Router, type Request, type Response } from "express";
import { getFullGeoLocation, storeGeoLocation, getStoredGeoLocations, clearGeoLocations } from "../lib/geolocation";

const router = Router();

/**
 * GET /api/geo/track
 * Track current user's geolocation
 */
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

/**
 * GET /api/geo/list
 * Get list of all tracked geolocation data (Admin only)
 */
router.get("/list", (_req: Request, res: Response) => {
  try {
    const locations = getStoredGeoLocations();
    res.json({
      total: locations.length,
      locations,
    });
  } catch (error) {
    console.error("List geolocation error:", error);
    res.status(500).json({ error: "Failed to list geolocation" });
  }
});

/**
 * POST /api/geo/clear
 * Clear all geolocation data (Admin only)
 */
router.post("/clear", (_req: Request, res: Response) => {
  try {
    clearGeoLocations();
    res.json({ success: true, message: "Geolocation data cleared" });
  } catch (error) {
    console.error("Clear geolocation error:", error);
    res.status(500).json({ error: "Failed to clear geolocation" });
  }
});

export default router;
