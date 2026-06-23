import { Router } from "express";
import axios from "axios";

const router = Router();

const OS_BASE = "https://api.opensubtitles.com/api/v1";
const OS_KEY = "jBRbBgS6GZv1SbyZXUikk4XdRwUa2gUt";
const OS_HEADERS = {
  "Api-Key": OS_KEY,
  "Content-Type": "application/json",
  "User-Agent": "ENYGMAApp v1.0",
};

router.get("/subtitles/search", async (req, res): Promise<void> => {
  const { query, languages } = req.query;
  if (!query) {
    res.status(400).json({ error: "query is required" });
    return;
  }
  try {
    const { data } = await axios.get(`${OS_BASE}/subtitles`, {
      headers: OS_HEADERS,
      params: {
        query: String(query),
        languages: String(languages || "es,en"),
      },
      timeout: 8000,
    });
    const results = (data.data || []).slice(0, 30).map((item: any) => ({
      id: item.id,
      language: item.attributes?.language ?? "?",
      release: item.attributes?.release ?? String(query),
      files: (item.attributes?.files || []).map((f: any) => ({
        file_id: f.file_id,
        file_name: f.file_name ?? item.attributes?.release ?? String(query),
      })),
    }));
    res.set("Cache-Control", "public, max-age=300");
    res.json({ results });
  } catch {
    res.status(502).json({ error: "OpenSubtitles unavailable", results: [] });
  }
});

router.post("/subtitles/download", async (req, res): Promise<void> => {
  const { file_id } = req.body;
  if (!file_id) {
    res.status(400).json({ error: "file_id is required" });
    return;
  }
  try {
    const { data } = await axios.post(
      `${OS_BASE}/download`,
      { file_id },
      { headers: OS_HEADERS, timeout: 8000 },
    );
    res.json({ link: data.link, file_name: data.file_name });
  } catch {
    res.status(502).json({ error: "OpenSubtitles download failed" });
  }
});

export default router;
