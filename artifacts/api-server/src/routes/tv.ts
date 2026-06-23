import { Router, type IRouter } from "express";
import axios from "axios";

const router: IRouter = Router();

const PLAYLISTS = [
  { url: "https://tecnotv.club/21e5/lista.m3u", playlist: "general" as const },
  { url: "https://tecnotv.club/21e5/deportes.m3u", playlist: "deportes" as const },
];

const SPORT_LOGOS: Record<string, string> = {
  espn: "https://bestleague.world/img/espn.webp",
  "espn 2": "https://bestleague.world/img/espn2.webp",
  "espn 3": "https://bestleague.world/img/espn3.webp",
  "espn 4": "https://bestleague.world/img/espn4.webp",
  "espn 5": "https://bestleague.world/img/espn5.webp",
  "espn 6": "https://bestleague.world/img/espn6.webp",
  "ds sport": "https://bestleague.world/img/dsports.webp",
  "ds sport 2": "https://bestleague.world/img/dsports2.webp",
  "ds sport plus": "https://bestleague.world/img/dsportsplus.webp",
  "fox sports": "https://bestleague.world/img/foxnew.png",
  "fox sports 2": "https://bestleague.world/img/foxnew2.png",
  "fox sports 3": "https://bestleague.world/img/foxnew3.png",
  "tnt sports": "https://bestleague.world/img/tntar.svg",
  "tyc sports": "https://bestleague.world/img/tyc.webp",
  tudn: "https://bestleague.world/img/tudn.png",
  "win sports": "https://bestleague.world/img/win.png",
};

function logoForSport(name: string) {
  const k = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(SPORT_LOGOS)) {
    if (k.includes(key)) return val;
  }
  return "";
}

export interface TVChannel {
  id: string;
  name: string;
  logo: string;
  category: string;
  streamUrl: string;
  playlist: "general" | "deportes";
}

function parseM3U(text: string, playlist: "general" | "deportes"): TVChannel[] {
  const lines = text.split(/\r?\n/);
  const out: TVChannel[] = [];
  let pending: { name: string; logo: string; category: string } | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("#EXTINF")) {
      const logo = (line.match(/tvg-logo="([^"]*)"/) ?? [])[1] ?? "";
      const cat = (line.match(/group-title="([^"]*)"/) ?? [])[1]?.trim() ?? "General";
      const ci = line.lastIndexOf(",");
      const name = ci !== -1 ? line.slice(ci + 1).trim() : "";
      if (name && !name.includes("@") && name.toLowerCase() !== "principal") {
        pending = { name, logo, category: cat };
      }
    } else if (line && !line.startsWith("#") && pending) {
      let logo = pending.logo;
      if (!logo || logo === "logo.png" || logo === ".png") logo = logoForSport(pending.name);
      out.push({
        id: `${playlist}-${out.length}`,
        name: pending.name,
        logo,
        category: pending.category,
        streamUrl: line,
        playlist,
      });
      pending = null;
    }
  }
  return out;
}

let cache: { data: TVChannel[]; ts: number } | null = null;
const CACHE_MS = 30 * 60 * 1000;

async function load(): Promise<TVChannel[]> {
  if (cache && Date.now() - cache.ts < CACHE_MS) return cache.data;
  const results = await Promise.all(
    PLAYLISTS.map(p =>
      axios.get<string>(p.url, { responseType: "text", timeout: 15000 })
        .then(r => parseM3U(r.data, p.playlist))
        .catch(() => [] as TVChannel[])
    )
  );
  const data = results.flat();
  cache = { data, ts: Date.now() };
  return data;
}

router.get("/tv/channels", async (_req, res): Promise<void> => {
  try {
    const channels = await load();
    res.set("Cache-Control", "public, max-age=900");
    res.json(channels);
  } catch {
    res.status(500).json({ error: "Failed to load channels" });
  }
});

export default router;
