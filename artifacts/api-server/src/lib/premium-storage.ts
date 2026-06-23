import { logger } from "./logger";
import path from "node:path";
import { promises as fs } from "node:fs";

export interface PremiumUser {
  id: string;
  usuario: string;
  nombre: string;
  email?: string;
  estado_premium: boolean;
  sin_publicidades: boolean;
  metodo_pago: "transferencia" | "crypto";
  timestamp_solicitud: string;
  timestamp_aprobacion?: string;
  aprobado_por?: string;
  notas?: string;
  activo: boolean;
}

const PREMIUM_FILE = path.join(process.cwd(), "data", "premium_users.json");

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (e) {
    logger.warn({ err: e }, "Could not create data directory");
  }
}

async function loadPremiumUsers(): Promise<PremiumUser[]> {
  try {
    await ensureDataDir();
    const content = await fs.readFile(PREMIUM_FILE, "utf-8");
    return JSON.parse(content) as PremiumUser[];
  } catch (e) {
    if ((e as any).code === "ENOENT") {
      return [];
    }
    logger.error({ err: e }, "Error loading premium users");
    return [];
  }
}

async function savePremiumUsers(users: PremiumUser[]): Promise<void> {
  try {
    await ensureDataDir();
    await fs.writeFile(PREMIUM_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (e) {
    logger.error({ err: e }, "Error saving premium users");
    throw e;
  }
}

export async function createPremiumRequest(
  usuario: string,
  nombre: string,
  email: string | undefined,
  metodo_pago: "transferencia" | "crypto",
): Promise<PremiumUser> {
  const users = await loadPremiumUsers();

  // Check if user already has pending or active premium
  const existing = users.find(
    (u) => u.usuario === usuario && (u.estado_premium || u.estado_premium === false),
  );
  if (existing) {
    throw new Error(`User ${usuario} already has a premium request or subscription`);
  }

  const newRequest: PremiumUser = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    usuario,
    nombre,
    email,
    estado_premium: false,
    sin_publicidades: false,
    metodo_pago,
    timestamp_solicitud: new Date().toISOString(),
    activo: false,
  };

  users.push(newRequest);
  await savePremiumUsers(users);
  logger.info({ usuario, nombre }, "Premium request created");
  return newRequest;
}

export async function approvePremiumRequest(
  usuario: string,
  adminUser: string,
): Promise<PremiumUser> {
  const users = await loadPremiumUsers();
  const user = users.find((u) => u.usuario === usuario && !u.estado_premium);

  if (!user) {
    throw new Error(`Pending premium request not found for user ${usuario}`);
  }

  user.estado_premium = true;
  user.sin_publicidades = true;
  user.timestamp_aprobacion = new Date().toISOString();
  user.aprobado_por = adminUser;
  user.activo = true;

  await savePremiumUsers(users);
  logger.info({ usuario, adminUser }, "Premium request approved");
  return user;
}

export async function rejectPremiumRequest(usuario: string): Promise<void> {
  const users = await loadPremiumUsers();
  const index = users.findIndex((u) => u.usuario === usuario && !u.estado_premium);

  if (index === -1) {
    throw new Error(`Pending premium request not found for user ${usuario}`);
  }

  users.splice(index, 1);
  await savePremiumUsers(users);
  logger.info({ usuario }, "Premium request rejected");
}

export async function getPremiumStatus(usuario: string) {
  const users = await loadPremiumUsers();
  const user = users.find((u) => u.usuario === usuario && u.estado_premium && u.activo);

  if (!user) {
    return {
      usuario,
      isPremium: false,
      sinPublicidades: false,
    };
  }

  return {
    usuario,
    isPremium: true,
    sinPublicidades: user.sin_publicidades,
  };
}

export async function toggleAds(usuario: string, sinPublicidades: boolean): Promise<void> {
  const users = await loadPremiumUsers();
  const user = users.find((u) => u.usuario === usuario && u.estado_premium);

  if (!user) {
    throw new Error(`Premium user not found: ${usuario}`);
  }

  user.sin_publicidades = sinPublicidades;
  await savePremiumUsers(users);
  logger.info({ usuario, sinPublicidades }, "Premium ads toggle updated");
}

export async function listPendingRequests(): Promise<PremiumUser[]> {
  const users = await loadPremiumUsers();
  return users.filter((u) => !u.estado_premium);
}

export async function listApprovedUsers(): Promise<PremiumUser[]> {
  const users = await loadPremiumUsers();
  return users.filter((u) => u.estado_premium && u.activo);
}

export async function removePremium(usuario: string): Promise<void> {
  const users = await loadPremiumUsers();
  const user = users.find((u) => u.usuario === usuario);

  if (!user) {
    throw new Error(`User not found: ${usuario}`);
  }

  user.estado_premium = false;
  user.activo = false;
  await savePremiumUsers(users);
  logger.info({ usuario }, "Premium access removed");
}
