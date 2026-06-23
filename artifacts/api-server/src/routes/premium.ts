import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";
import {
  handlePremiumRequest,
  handlePremiumApproval,
  handlePremiumRejection,
  handleGetPremiumStatus,
  handleToggleAds,
  handleListPendingRequests,
  handleListApprovedUsers,
  handleRemovePremium,
  type PremiumRequestData,
} from "../lib/premium-service";

const router = Router();

// Middleware to check admin authentication
const requireAdminAuth = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const adminToken = process.env.ADMIN_TOKEN;

  if (!authHeader || !adminToken) {
    return res.status(403).json({ error: "Admin authentication required" });
  }

  const token = authHeader.replace("Bearer ", "");
  if (token !== adminToken) {
    return res.status(403).json({ error: "Invalid admin token" });
  }

  next();
};

/**
 * POST /api/premium/request
 * Create a new premium request
 */
router.post("/request", async (req: Request, res: Response) => {
  try {
    const { usuario, nombre, email, metodo_pago } = req.body;

    // Validation
    if (!usuario || typeof usuario !== "string" || usuario.trim() === "") {
      return res.status(400).json({ error: "Invalid usuario field" });
    }

    if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
      return res.status(400).json({ error: "Invalid nombre field" });
    }

    if (!metodo_pago || !["transferencia", "crypto"].includes(metodo_pago)) {
      return res.status(400).json({ error: "Invalid metodo_pago field" });
    }

    const result = await handlePremiumRequest({
      usuario: usuario.trim(),
      nombre: nombre.trim(),
      email: email?.trim(),
      metodo_pago,
    });

    res.status(201).json(result);
  } catch (error) {
    const err = error as Error;
    logger.error({ err: err.message }, "Premium request failed");
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/premium/status
 * Get premium status for current user
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const usuario = (req.query.usuario as string) || "";

    if (!usuario) {
      return res.status(400).json({ error: "usuario query parameter required" });
    }

    const status = await handleGetPremiumStatus(usuario);
    res.json(status);
  } catch (error) {
    const err = error as Error;
    logger.error({ err: err.message }, "Failed to get premium status");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/premium/approve
 * Admin: Approve a premium request
 */
router.put("/approve", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { usuario, adminUser } = req.body;

    if (!usuario) {
      return res.status(400).json({ error: "usuario field required" });
    }

    await handlePremiumApproval(usuario, adminUser || "unknown");
    res.json({ success: true, message: "Premium request approved" });
  } catch (error) {
    const err = error as Error;
    logger.error({ err: err.message }, "Failed to approve premium");
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/premium/reject
 * Admin: Reject a premium request
 */
router.put("/reject", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { usuario } = req.body;

    if (!usuario) {
      return res.status(400).json({ error: "usuario field required" });
    }

    await handlePremiumRejection(usuario);
    res.json({ success: true, message: "Premium request rejected" });
  } catch (error) {
    const err = error as Error;
    logger.error({ err: err.message }, "Failed to reject premium");
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/premium/toggle-ads
 * Admin: Toggle ads for a user
 */
router.put("/toggle-ads", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { usuario, sinPublicidades } = req.body;

    if (!usuario) {
      return res.status(400).json({ error: "usuario field required" });
    }

    if (typeof sinPublicidades !== "boolean") {
      return res.status(400).json({ error: "sinPublicidades must be boolean" });
    }

    await handleToggleAds(usuario, sinPublicidades);
    res.json({
      success: true,
      message: sinPublicidades ? "Ads hidden for user" : "Ads shown for user",
    });
  } catch (error) {
    const err = error as Error;
    logger.error({ err: err.message }, "Failed to toggle ads");
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/premium/list
 * Admin: List all pending requests and approved users
 */
router.get("/list", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const pending = await handleListPendingRequests();
    const approved = await handleListApprovedUsers();

    res.json({
      pending,
      approved,
      total: pending.length + approved.length,
    });
  } catch (error) {
    const err = error as Error;
    logger.error({ err: err.message }, "Failed to list premium users");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/premium/remove
 * Admin: Remove premium access from user
 */
router.delete("/remove", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { usuario } = req.body;

    if (!usuario) {
      return res.status(400).json({ error: "usuario field required" });
    }

    await handleRemovePremium(usuario);
    res.json({ success: true, message: "Premium access removed" });
  } catch (error) {
    const err = error as Error;
    logger.error({ err: err.message }, "Failed to remove premium");
    res.status(400).json({ error: err.message });
  }
});

export default router;
