import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ── In-memory cache ─────────────────────────────────────────────────────────
interface ResolveEntry {
  result: { hlsUrl: string; tracks: { file: string; label: string; kind: string; default?: boolean }[] };
  ts: number;
}
const resolveCache = new Map<string, ResolveEntry>();
const RESOLVE_TTL = 30 * 60 * 1000; // 30 min — embed pages rarely change
const MAX_ENTRIES = 300;

function cacheGet(url: string): ResolveEntry["result"] | null {
  const e = resolveCache.get(url);
  if (!e) return null;
  if (Date.now() - e.ts > RESOLVE_TTL) { resolveCache.delete(url); return null; }
  return e.result;
}
function cachePut(url: string, result: ResolveEntry["result"]) {
  if (resolveCache.size >= MAX_ENTRIES) {
    const oldest = [...resolveCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) resolveCache.delete(oldest[0]);
  }
  resolveCache.set(url, { result, ts: Date.now() });
}
// ─────────────────────────────────────────────────────────────────────────────

function decodePacker(p: string, a: number, c: number, k: string[]): string {
  const toBase = (n: number): string =>
    (n < a ? "" : toBase(Math.floor(n / a))) +
    (n % a > 35 ? String.fromCharCode(n % a + 29) : (n % a).toString(36));
  for (let i = c - 1; i >= 0; i--) {
    if (k[i]) {
      p = p.replace(new RegExp("\\b" + toBase(i) + "\\b", "g"), k[i]);
    }
  }
  return p;
}

function extractHlsFromHtml(html: string): {
  hlsUrl: string;
  tracks: { file: string; label: string; kind: string; default?: boolean }[];
} | null {
  const evalIdx = html.indexOf("eval(function(p,a,c,k,e,d)");
  if (evalIdx === -1) return null;

  const block = html.slice(evalIdx);
  const innerMatch = block.match(/\('((?:[^'\\]|\\.)*)',\s*(\d+),\s*(\d+),\s*'((?:[^'\\]|\\.)*)'\s*\.split/);
  if (!innerMatch) return null;

  const packed = innerMatch[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
  const radix = parseInt(innerMatch[2]);
  const count = parseInt(innerMatch[3]);
  const dict = innerMatch[4].split("|");

  const decoded = decodePacker(packed, radix, count, dict);

  const hlsMatch = decoded.match(/file:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)/);
  if (!hlsMatch) return null;

  const hlsUrl = hlsMatch[1];

  const tracks: { file: string; label: string; kind: string; default?: boolean }[] = [];
  const trackRe = /\{file:\s*["']([^"']+\.(?:vtt|srt)[^"']*)["'].*?label:\s*["']([^"']+)["'].*?kind:\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = trackRe.exec(decoded)) !== null) {
    tracks.push({ file: m[1], label: m[2], kind: m[3] });
  }

  const spIdx = tracks.findIndex(
    (t) =>
      t.label.toLowerCase().includes("español") ||
      t.label.toLowerCase().includes("spanish") ||
      t.label.toLowerCase().includes("spa")
  );
  if (spIdx >= 0) tracks[spIdx].default = true;
  else if (tracks.length > 0) tracks[0].default = true;

  return { hlsUrl, tracks };
}

router.get("/resolve", async (req, res): Promise<void> => {
  const url = req.query.url as string | undefined;
  if (!url) {
    res.status(400).json({ error: "Missing url param" });
    return;
  }

  // Serve from cache immediately — no network round-trip needed
  const cached = cacheGet(url);
  if (cached) {
    res.setHeader("X-Cache", "HIT");
    res.json(cached);
    return;
  }

  // Timeout: 10 s to fetch the embed page
  const abort = new AbortController();
  const timeoutId = setTimeout(() => abort.abort(), 10_000);

  try {
    const response = await fetch(url, {
      signal: abort.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://vimeos.net/",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      res.status(404).json({ error: "Embed page not reachable" });
      return;
    }

    const html = await response.text();
    const result = extractHlsFromHtml(html);

    if (!result) {
      res.status(404).json({ error: "Could not extract HLS URL from embed" });
      return;
    }

    cachePut(url, result);
    res.json(result);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === "AbortError";
    if (isAbort) {
      res.status(504).json({ error: "Embed page took too long to respond" });
    } else {
      req.log?.error?.({ err }, "resolve error");
      res.status(500).json({ error: "Failed to resolve video URL" });
    }
  }
});

export default router;
