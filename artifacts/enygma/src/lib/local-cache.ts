type CacheEnvelope<T> = {
  ts: number;
  data: T;
};

/**
 * Cache muy simple en localStorage para acelerar la carga "percibida".
 * Se usa como placeholderData de React Query: muestra contenido inmediato
 * mientras se refetch-ea en background.
 */
export function readLocalCache<T>(key: string, maxAgeMs: number): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed.ts !== "number") return undefined;
    if (Date.now() - parsed.ts > maxAgeMs) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
}

export function writeLocalCache<T>(key: string, data: T): void {
  try {
    const payload: CacheEnvelope<T> = { ts: Date.now(), data };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

