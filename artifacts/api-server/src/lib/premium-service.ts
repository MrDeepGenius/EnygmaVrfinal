import { logger } from "./logger";
import {
  createPremiumRequest,
  approvePremiumRequest,
  rejectPremiumRequest,
  getPremiumStatus,
  toggleAds,
  listPendingRequests,
  listApprovedUsers,
  removePremium,
  type PremiumUser,
} from "./premium-storage";
import { notifyPremiumRequest, notifyApprovalSuccess } from "./telegram-notifier";

export interface PremiumRequestData {
  usuario: string;
  nombre: string;
  email?: string;
  metodo_pago: "transferencia" | "crypto";
}

export interface PremiumStatus {
  usuario: string;
  isPremium: boolean;
  sinPublicidades: boolean;
}

export async function handlePremiumRequest(data: PremiumRequestData): Promise<{
  success: boolean;
  message: string;
  requestId?: string;
}> {
  try {
    const request = await createPremiumRequest(
      data.usuario,
      data.nombre,
      data.email,
      data.metodo_pago,
    );

    // Send Telegram notification asynchronously (don't block response)
    notifyPremiumRequest(request.id, request.nombre, request.usuario, data.metodo_pago)
      .catch((err) => logger.error({ err }, "Failed to send Telegram notification"));

    return {
      success: true,
      message: "Premium request submitted successfully. You will receive confirmation once approved.",
      requestId: request.id,
    };
  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message, data }, "Failed to create premium request");
    throw error;
  }
}

export async function handlePremiumApproval(usuario: string, adminUser: string): Promise<void> {
  try {
    const user = await approvePremiumRequest(usuario, adminUser);
    
    // Send notification to admin and user
    notifyApprovalSuccess(usuario)
      .catch((err) => logger.error({ err }, "Failed to send approval notification"));

    logger.info({ usuario, adminUser }, "Premium request approved");
  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message, usuario }, "Failed to approve premium request");
    throw error;
  }
}

export async function handlePremiumRejection(usuario: string): Promise<void> {
  try {
    await rejectPremiumRequest(usuario);
    logger.info({ usuario }, "Premium request rejected");
  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message, usuario }, "Failed to reject premium request");
    throw error;
  }
}

export async function handleGetPremiumStatus(usuario: string): Promise<PremiumStatus> {
  try {
    return await getPremiumStatus(usuario);
  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message, usuario }, "Failed to get premium status");
    return {
      usuario,
      isPremium: false,
      sinPublicidades: false,
    };
  }
}

export async function handleToggleAds(usuario: string, sinPublicidades: boolean): Promise<void> {
  try {
    await toggleAds(usuario, sinPublicidades);
    logger.info({ usuario, sinPublicidades }, "Premium ads toggled");
  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message, usuario }, "Failed to toggle ads");
    throw error;
  }
}

export async function handleListPendingRequests(): Promise<PremiumUser[]> {
  try {
    return await listPendingRequests();
  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message }, "Failed to list pending requests");
    return [];
  }
}

export async function handleListApprovedUsers(): Promise<PremiumUser[]> {
  try {
    return await listApprovedUsers();
  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message }, "Failed to list approved users");
    return [];
  }
}

export async function handleRemovePremium(usuario: string): Promise<void> {
  try {
    await removePremium(usuario);
    logger.info({ usuario }, "Premium access removed");
  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message, usuario }, "Failed to remove premium");
    throw error;
  }
}
