import { type Request } from "express";

export interface GeoLocation {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  timestamp: string;
  userAgent: string;
}

/**
 * Get client IP address from request
 * Handles proxies and load balancers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

/**
 * Simple IP-based geolocation using free services
 * Returns basic country/city info
 */
export async function getGeoLocation(ip: string): Promise<Partial<GeoLocation>> {
  try {
    // Try ip-api.com (free tier)
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

/**
 * Get full geolocation info from request
 */
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

/**
 * Store geolocation data (in-memory for now, can be upgraded to DB)
 */
let geoLocations: GeoLocation[] = [];
const MAX_STORED = 1000;

export function storeGeoLocation(geo: GeoLocation): void {
  geoLocations.unshift(geo);
  if (geoLocations.length > MAX_STORED) {
    geoLocations = geoLocations.slice(0, MAX_STORED);
  }
}

export function getStoredGeoLocations(): GeoLocation[] {
  return geoLocations;
}

export function clearGeoLocations(): void {
  geoLocations = [];
}
