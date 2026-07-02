import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "../../data/requests.json");

export interface ContentRequest {
  id: string;
  profile: string;
  title: string;
  type: "pelicula" | "serie" | "anime";
  comment?: string;
  status: "pendiente" | "visto" | "conseguido" | "rechazado";
  createdAt: string;
}

function readRequests(): ContentRequest[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as ContentRequest[];
  } catch {
    return [];
  }
}

function writeRequests(items: ContentRequest[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
}

const router = Router();

router.get("/requests", (_req, res) => {
  const items = readRequests().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ items });
});

router.post("/requests", (req, res) => {
  const { profile, title, type, comment } = req.body as {
    profile: string;
    title: string;
    type: ContentRequest["type"];
    comment?: string;
  };

  if (!profile || !title || !type) {
    res.status(400).json({ error: "Faltan campos requeridos" });
    return;
  }

  const items = readRequests();

  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  const recent = items.find(
    (r) =>
      r.profile === profile &&
      Date.now() - new Date(r.createdAt).getTime() < ONE_WEEK
  );
  if (recent) {
    const nextAllowed = new Date(recent.createdAt).getTime() + ONE_WEEK;
    res.status(429).json({
      error: "Ya hiciste tu pedido esta semana",
      nextAllowed,
    });
    return;
  }

  const newReq: ContentRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    profile,
    title: title.trim(),
    type,
    comment: comment?.trim() || undefined,
    status: "pendiente",
    createdAt: new Date().toISOString(),
  };

  items.push(newReq);
  writeRequests(items);

  res.status(201).json(newReq);
});

router.patch("/requests/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: ContentRequest["status"] };
  const items = readRequests();
  const idx = items.findIndex((r) => r.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }
  items[idx].status = status;
  writeRequests(items);
  res.json(items[idx]);
});

router.delete("/requests/:id", (req, res) => {
  const { id } = req.params;
  const items = readRequests();
  const filtered = items.filter((r) => r.id !== id);
  writeRequests(filtered);
  res.json({ ok: true });
});

export default router;
