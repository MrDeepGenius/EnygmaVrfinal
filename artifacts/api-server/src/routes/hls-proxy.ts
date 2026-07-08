import { Router, type IRouter } from "express";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";

const router: IRouter = Router();

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** Map CDN subdomains to the correct embed origin for Referer/Origin headers */
const CDN_ORIGIN_MAP: { test: RegExp; origin: string }[] = [
  { test: /\.vimeos\.net$/i,   origin: "https://vimeos.net" },
  { test: /\.streamwish\./i,   origin: "https://streamwish.com" },
  { test: /\.waaw\./i,         origin: "https://waaw.tv" },
];

function proxyHeaders(targetUrl: string): Record<string, string> {
  let origin = "https://vimeos.net";
  try {
    const { protocol, hostname } = new URL(targetUrl);
    const mapped = CDN_ORIGIN_MAP.find((r) => r.test.test(hostname));
    origin = mapped ? mapped.origin : `${protocol}//${hostname}`;
  } catch { /* keep default */ }
  return {
    "User-Agent": UA,
    Referer: `${origin}/`,
    Origin: origin,
    Accept: "*/*",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
    Connection: "keep-alive",
  };
}

/** Hosts that require curl (TLS fingerprint mismatch with Node.js fetch) */
const CURL_HOSTS = /\.goodstream\.one$/i;

/** Fetch via curl subprocess — bypasses TLS fingerprinting done by some CDNs */
function curlFetch(url: string, timeoutMs: number): Promise<{ status: number; body: Buffer; ct: string }> {
  return new Promise((resolve, reject) => {
    const args = [
      "-s", "-L",
      "--max-time", String(Math.ceil(timeoutMs / 1000)),
      "--write-out", "\n__STATUS__%{http_code}__CT__%{content_type}__",
      url,
    ];
    const proc = spawn("curl", args);
    const chunks: Buffer[] = [];
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.stderr.resume(); // discard stderr
    proc.on("close", (code) => {
      if (code !== 0) { reject(new Error(`curl exit ${code}`)); return; }
      const full = Buffer.concat(chunks);
      const tail = full.slice(-200).toString();
      const m = tail.match(/__STATUS__(\d+)__CT__([^_]*)__/);
      if (!m) { reject(new Error("curl: bad output")); return; }
      const status = parseInt(m[1]);
      const ct = m[2].split(";")[0].trim();
      // strip the trailing meta line from body
      const metaIdx = full.lastIndexOf(Buffer.from("\n__STATUS__"));
      const body = metaIdx >= 0 ? full.slice(0, metaIdx) : full;
      resolve({ status, body, ct });
    });
    proc.on("error", reject);
  });
}

// Simple in-memory cache for .m3u8 manifests (short TTL) and TS segments (long TTL)
interface CacheEntry { body: Buffer; ct: string; ts: number; }
const CACHE = new Map<string, CacheEntry>();
const M3U8_TTL  = 3_000;   // 3 s — manifests change frequently
const SEG_TTL   = 300_000; // 5 min — segments are immutable
const MAX_CACHE = 200;

function cacheGet(key: string): CacheEntry | null {
  const e = CACHE.get(key);
  if (!e) return null;
  const ttl = key.includes(".m3u8") || key.includes("mpegurl") ? M3U8_TTL : SEG_TTL;
  if (Date.now() - e.ts > ttl) { CACHE.delete(key); return null; }
  return e;
}
function cachePut(key: string, body: Buffer, ct: string) {
  if (CACHE.size >= MAX_CACHE) {
    // evict oldest
    const oldest = [...CACHE.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) CACHE.delete(oldest[0]);
  }
  CACHE.set(key, { body, ct, ts: Date.now() });
}

function makeProxyUrl(originalUrl: string): string {
  return `/api/hls-proxy?url=${encodeURIComponent(originalUrl)}`;
}

function resolveRelativeUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).toString();
  } catch {
    return relative;
  }
}

function rewriteM3u8(content: string, manifestUrl: string): string {
  const lines = content.split("\n");
  const rewritten: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("#") && trimmed.includes('URI="')) {
      const rewrittenLine = trimmed.replace(/URI="([^"]+)"/g, (_, uri) => {
        const abs = resolveRelativeUrl(manifestUrl, uri);
        return `URI="${makeProxyUrl(abs)}"`;
      });
      rewritten.push(rewrittenLine);
      continue;
    }

    if (trimmed && !trimmed.startsWith("#")) {
      const abs = resolveRelativeUrl(manifestUrl, trimmed);
      rewritten.push(makeProxyUrl(abs));
      continue;
    }

    rewritten.push(line);
  }

  return rewritten.join("\n");
}

router.get("/hls-proxy", async (req, res): Promise<void> => {
  const url = req.query.url as string | undefined;
  if (!url) { res.status(400).send("Missing url param"); return; }

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    res.status(400).send("Invalid url");
    return;
  }

  const isM3u8 = url.includes(".m3u8") || url.includes("mpegurl");

  // Serve from cache when available
  const cached = cacheGet(url);
  if (cached) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", cached.ct);
    res.setHeader("Cache-Control", isM3u8 ? "no-cache" : "public, max-age=300");
    res.setHeader("X-Cache", "HIT");
    res.send(cached.body);
    return;
  }

  const timeoutMs = isM3u8 ? 8_000 : 12_000;
  const useCurl = CURL_HOSTS.test(targetUrl.hostname);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  try {
    // ── curl path (GoodStream CDN — TLS fingerprint sensitive) ──────────────
    if (useCurl) {
      const { status, body, ct } = await curlFetch(targetUrl.toString(), timeoutMs);
      if (status !== 200) { res.status(status).send(`Upstream error: ${status}`); return; }
      const isActuallyM3u8 = ct.includes("mpegurl") || ct.includes("m3u8") || isM3u8;
      if (isActuallyM3u8) {
        const rewritten = rewriteM3u8(body.toString("utf-8"), url);
        const buf = Buffer.from(rewritten, "utf-8");
        cachePut(url, buf, "application/vnd.apple.mpegurl");
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.setHeader("Cache-Control", "no-cache");
        res.send(buf);
      } else {
        const finalCt = ct || "application/octet-stream";
        if (body.length < 4 * 1024 * 1024) cachePut(url, body, finalCt);
        res.setHeader("Content-Type", finalCt);
        res.setHeader("Cache-Control", "public, max-age=300");
        res.send(body);
      }
      return;
    }

    // ── fetch path (vimeos.net, streamwish, etc.) ───────────────────────────
    const abort = new AbortController();
    const timeoutId = setTimeout(() => abort.abort(), timeoutMs);
    const upstream = await fetch(targetUrl.toString(), {
      headers: proxyHeaders(targetUrl.toString()),
      signal: abort.signal,
    });
    clearTimeout(timeoutId);

    if (!upstream.ok) { res.status(upstream.status).send(`Upstream error: ${upstream.status}`); return; }

    const ct = upstream.headers.get("content-type") || "";
    const isActuallyM3u8 = ct.includes("mpegurl") || ct.includes("m3u8") || isM3u8;

    if (isActuallyM3u8) {
      const text = await upstream.text();
      const rewritten = rewriteM3u8(text, url);
      const buf = Buffer.from(rewritten, "utf-8");
      cachePut(url, buf, "application/vnd.apple.mpegurl");
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache");
      res.send(buf);
    } else {
      const finalCt = ct || "application/octet-stream";
      const len = upstream.headers.get("content-length");
      res.setHeader("Content-Type", finalCt);
      res.setHeader("Cache-Control", "public, max-age=300");
      if (len) res.setHeader("Content-Length", len);
      if (upstream.body) {
        const chunks: Buffer[] = [];
        const nodeStream = Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]);
        nodeStream.on("data", (chunk: Buffer) => { chunks.push(chunk); res.write(chunk); });
        nodeStream.on("end", () => {
          const full = Buffer.concat(chunks);
          if (full.length < 4 * 1024 * 1024) cachePut(url, full, finalCt);
          res.end();
        });
        nodeStream.on("error", () => { if (!res.headersSent) res.status(502).send("Stream error"); else res.end(); });
      } else {
        const buf = Buffer.from(await upstream.arrayBuffer());
        if (buf.length < 4 * 1024 * 1024) cachePut(url, buf, finalCt);
        res.send(buf);
      }
    }
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    if (!res.headersSent) {
      if (isAbort) res.status(504).send("Upstream timeout");
      else { req.log?.error?.({ err, url }, "hls-proxy error"); res.status(502).send("Proxy fetch failed"); }
    }
  }
});

router.options("/hls-proxy", (_, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.status(204).end();
});

export default router;
