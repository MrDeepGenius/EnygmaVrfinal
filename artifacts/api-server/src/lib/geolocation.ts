import { type Request } from "express";
import fs from "node:fs";
import path from "node:path";

export interface GeoLocation {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  timestamp: string;
  userAgent: string;
}

interface PersistedStats {
  totalVisits: number;
  uniqueIps: string[];
  dailyCounts: Record<string, number>;
}

const STATS_FILE = path.join(process.cwd(), "geo-stats.json");

function loadStats(): PersistedStats {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const raw = fs.readFileSync(STATS_FILE, "utf-8");
      return JSON.parse(raw) as PersistedStats;
    }
  } catch {
    // ignore
  }
  return { totalVisits: 0, uniqueIps: [], dailyCounts: {} };
}

function saveStats(): void {
  try {
    const data: PersistedStats = {
      totalVisits: persistedStats.totalVisits,
      uniqueIps: Array.from(uniqueIpSet),
      dailyCounts: persistedStats.dailyCounts,
    };
    fs.writeFileSync(STATS_FILE, JSON.stringify(data), "utf-8");
  } catch {
    // ignore
  }
}

const loaded = loadStats();
let persistedStats: PersistedStats = loaded;
const uniqueIpSet: Set<string> = new Set(loaded.uniqueIps);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

export async function getGeoLocation(ip: string): Promise<Partial<GeoLocation>> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city,region,status`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { country: "Unknown", countryCode: "XX", city: "Unknown", region: "Unknown" };
    }

    const data = await response.json() as any;

    if (data.status === "fail") {
      return { country: "Unknown", countryCode: "XX", city: "Unknown", region: "Unknown" };
    }

    return {
      country: data.country || "Unknown",
      countryCode: data.countryCode || "XX",
      city: data.city || "Unknown",
      region: data.region || "Unknown",
    };
  } catch (error) {
    console.error("Geolocation error:", error);
    return { country: "Unknown", countryCode: "XX", city: "Unknown", region: "Unknown" };
  }
}

export async function getFullGeoLocation(req: Request): Promise<GeoLocation> {
  const ip = getClientIp(req);
  const geo = await getGeoLocation(ip);
  const userAgent = req.headers["user-agent"] || "Unknown";

  return {
    ip,
    country: geo.country || "Unknown",
    countryCode: geo.countryCode || "XX",
    city: geo.city || "Unknown",
    region: geo.region || "Unknown",
    timestamp: new Date().toISOString(),
    userAgent: userAgent as string,
  };
}

let geoLocations: GeoLocation[] = [];
const MAX_STORED = 1000;

export function storeGeoLocation(geo: GeoLocation): void {
  geoLocations.unshift(geo);
  if (geoLocations.length > MAX_STORED) {
    geoLocations = geoLocations.slice(0, MAX_STORED);
  }

  persistedStats.totalVisits++;

  uniqueIpSet.add(geo.ip);

  const day = todayKey();
  persistedStats.dailyCounts[day] = (persistedStats.dailyCounts[day] || 0) + 1;

  const keys = Object.keys(persistedStats.dailyCounts).sort();
  if (keys.length > 30) {
    delete persistedStats.dailyCounts[keys[0]];
  }

  saveStats();
}

export function getStoredGeoLocations(): GeoLocation[] {
  return geoLocations;
}

export function clearGeoLocations(): void {
  geoLocations = [];
}

export function getGeoStats() {
  const today = todayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const last7Days = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
  );
  const last7Total = last7Days.reduce((sum, d) => sum + (persistedStats.dailyCounts[d] || 0), 0);

  return {
    totalVisits: persistedStats.totalVisits,
    uniqueVisitors: uniqueIpSet.size,
    today: persistedStats.dailyCounts[today] || 0,
    yesterday: persistedStats.dailyCounts[yesterday] || 0,
    last7Days: last7Total,
    dailyCounts: persistedStats.dailyCounts,
  };
}

export function resetGeoStats(): void {
  persistedStats = { totalVisits: 0, uniqueIps: [], dailyCounts: {} };
  uniqueIpSet.clear();
  geoLocations = [];
  saveStats();
}
