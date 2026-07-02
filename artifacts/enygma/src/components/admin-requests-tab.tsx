import { useState, useEffect, useCallback } from "react";
import { Trash2, RefreshCw, Clapperboard, Tv2, Sword, Clock, CheckCircle, XCircle, Eye } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface ContentRequest {
  id: string;
  profile: string;
  title: string;
  type: "pelicula" | "serie" | "anime";
  comment?: string;
  status: "pendiente" | "visto" | "conseguido" | "rechazado";
  createdAt: string;
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pelicula: { label: "Pelicula", icon: Clapperboard, color: "#E50914" },
  serie: { label: "Serie", icon: Tv2, color: "#0ea5e9" },
  anime: { label: "Anime", icon: Sword, color: "#a855f7" },
};

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pendiente: { label: "Pendiente", icon: Clock, color: "#f59e0b" },
  visto: { label: "Visto", icon: Eye, color: "#3b82f6" },
  conseguido: { label: "Conseguido", icon: CheckCircle, color: "#22c55e" },
  rechazado: { label: "Rechazado", icon: XCircle, color: "#6b7280" },
};

const STATUSES = ["pendiente", "visto", "conseguido", "rechazado"] as const;

export function AdminRequestsTab() {
  const [items, setItems] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/requests`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: ContentRequest["status"]) => {
    setUpdating(id);
    try {
      await fetch(`${BASE}/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setItems(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } finally {
      setUpdating(null);
    }
  };

  const deleteRequest = async (id: string) => {
    setUpdating(id);
    try {
      await fetch(`${BASE}/api/requests/${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(r => r.id !== id));
    } finally {
      setUpdating(null);
    }
  };

  const pendingCount = items.filter(r => r.status === "pendiente").length;

  const filtered = filter === "todos" ? items : items.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Pedidos de contenido</h2>
          {pendingCount > 0 && (
            <p className="text-amber-400 text-xs mt-0.5">{pendingCount} pendiente{pendingCount !== 1 ? "s" : ""} sin revisar</p>
          )}
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["todos", ...STATUSES].map(s => {
          const meta = s === "todos" ? null : STATUS_META[s];
          const count = s === "todos" ? items.length : items.filter(r => r.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filter === s ? (meta?.color ?? "#7B2FBE") + "22" : "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: filter === s ? (meta?.color ?? "#7B2FBE") : "rgba(255,255,255,0.08)",
                color: filter === s ? (meta?.color ?? "#fff") : "rgba(255,255,255,0.4)",
              }}
            >
              {s === "todos" ? "Todos" : meta?.label} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">
          {filter === "todos" ? "Aun no hay pedidos." : "No hay pedidos en esta categoria."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(req => {
            const typeMeta = TYPE_META[req.type];
            const statusMeta = STATUS_META[req.status];
            const TypeIcon = typeMeta?.icon ?? Clapperboard;
            const StatusIcon = statusMeta?.icon ?? Clock;
            const isUpdating = updating === req.id;
            return (
              <div
                key={req.id}
                className="rounded-xl border border-white/8 bg-white/3 p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: (typeMeta?.color ?? "#888") + "1a" }}
                  >
                    <TypeIcon className="w-4 h-4" style={{ color: typeMeta?.color ?? "#888" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm truncate">{req.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: (typeMeta?.color ?? "#888") + "22", color: typeMeta?.color ?? "#888" }}>
                        {typeMeta?.label ?? req.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                      <span className="font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{req.profile}</span>
                      <span>·</span>
                      <span>{new Date(req.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    {req.comment && (
                      <p className="mt-1.5 text-white/40 text-xs italic">&ldquo;{req.comment}&rdquo;</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteRequest(req.id)}
                    disabled={isUpdating}
                    className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs" style={{ color: statusMeta?.color ?? "#888" }}>
                    <StatusIcon className="w-3 h-3" />
                    {statusMeta?.label ?? req.status}
                  </span>
                  <div className="flex gap-1.5 ml-auto flex-wrap">
                    {STATUSES.filter(s => s !== req.status).map(s => {
                      const sm = STATUS_META[s];
                      const Ic = sm.icon;
                      return (
                        <button
                          key={s}
                          onClick={() => updateStatus(req.id, s)}
                          disabled={isUpdating}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all disabled:opacity-40"
                          style={{ background: sm.color + "18", color: sm.color, border: `1px solid ${sm.color}30` }}
                        >
                          <Ic className="w-3 h-3" />
                          {sm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
