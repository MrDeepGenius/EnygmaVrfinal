import { useState, useEffect } from "react";
import { Loader2, Trash2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PremiumUser {
  usuario: string;
  nombre: string;
  email?: string;
  metodo_pago?: string;
  fecha_solicitud?: string;
  timestamp_solicitud?: string;
  fecha_vencimiento?: string;
  estado_premium?: boolean;
  estado: "pendiente" | "aprobado" | "rechazado";
  sinPublicidades: boolean;
}

function CyberpunkSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center w-12 h-6 rounded-full transition-all duration-300 focus:outline-none disabled:opacity-50"
      style={{
        background: checked
          ? "linear-gradient(90deg,#7c3aed,#a78bfa)"
          : "rgba(255,255,255,0.1)",
        border: checked ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.15)",
        boxShadow: checked ? "0 0 10px rgba(167,139,250,0.5)" : "none",
      }}
    >
      <span
        className="inline-block w-4 h-4 rounded-full transition-transform duration-300"
        style={{
          background: checked ? "#fff" : "#6b7280",
          transform: checked ? "translateX(26px)" : "translateX(3px)",
          boxShadow: checked ? "0 0 6px rgba(167,139,250,0.8)" : "none",
        }}
      />
    </button>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isExpired(fecha_vencimiento?: string) {
  if (!fecha_vencimiento) return false;
  return new Date(fecha_vencimiento) < new Date();
}

export function AdminPremiumTab() {
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/premium/list`);
      const data = await res.json();
      const all = [...(data.pending || []), ...(data.approved || []), ...(data.users || [])];
      // dedupe by usuario
      const seen = new Set<string>();
      setUsers(all.filter((u: PremiumUser) => {
        if (seen.has(u.usuario)) return false;
        seen.add(u.usuario);
        return true;
      }));
    } catch (e) {
      console.error("Error fetching premium users:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePremium = async (usuario: string, currentIsPremium: boolean) => {
    setToggling(usuario);
    try {
      const res = await fetch(`${BASE}/api/premium/toggle-premium`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, activate: !currentIsPremium }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error("Error toggling premium:", e);
    } finally {
      setToggling(null);
    }
  };

  const handleApprove = async (usuario: string) => {
    setToggling(usuario);
    try {
      const res = await fetch(`${BASE}/api/premium/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario }),
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  };

  const handleRemove = async (usuario: string) => {
    if (!confirm(`¿Quitar premium de ${usuario}?`)) return;
    try {
      const res = await fetch(`${BASE}/api/premium/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario }),
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className="space-y-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-lg font-black tracking-widest uppercase"
            style={{ color: "#a78bfa" }}
          >
            ⚡ Panel Premium
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#38bdf8" }}>
            Gestioná accesos Premium · Switch activa 30 días automáticos
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="text-xs px-3 py-1.5 rounded-lg font-bold transition-colors"
          style={{
            background: "rgba(167,139,250,0.1)",
            border: "1px solid rgba(167,139,250,0.3)",
            color: "#a78bfa",
          }}
        >
          ↻ Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2
            className="animate-spin"
            style={{ color: "#a78bfa", width: 32, height: 32 }}
          />
        </div>
      ) : users.length === 0 ? (
        <div
          className="text-center py-12 text-sm rounded-2xl"
          style={{
            color: "#6b7280",
            border: "1px dashed rgba(167,139,250,0.2)",
            background: "rgba(167,139,250,0.03)",
          }}
        >
          No hay solicitudes ni usuarios premium.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(167,139,250,0.2)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "rgba(167,139,250,0.08)", borderBottom: "1px solid rgba(167,139,250,0.2)" }}>
                {["Usuario / Email", "Nombre", "Método", "Solicitado", "Vence", "Rol", "Premium"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-black tracking-wider uppercase"
                    style={{ color: "#a78bfa" }}
                  >
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isPremium = u.estado === "aprobado" || !!u.estado_premium;
                const expired = isExpired(u.fecha_vencimiento);
                return (
                  <tr
                    key={u.usuario}
                    style={{
                      background: i % 2 === 0 ? "rgba(0,0,0,0.3)" : "rgba(167,139,250,0.03)",
                      borderBottom: "1px solid rgba(167,139,250,0.1)",
                    }}
                  >
                    {/* Email */}
                    <td className="px-4 py-3">
                      <span style={{ color: "#e2e8f0" }}>{u.usuario}</span>
                      {u.email && u.email !== u.usuario && (
                        <div style={{ color: "#6b7280" }}>{u.email}</div>
                      )}
                    </td>

                    {/* Nombre */}
                    <td className="px-4 py-3" style={{ color: "#c4b5fd" }}>
                      {u.nombre || "—"}
                    </td>

                    {/* Método */}
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={
                          u.metodo_pago === "crypto"
                            ? { background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }
                            : { background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)" }
                        }
                      >
                        {u.metodo_pago === "crypto" ? "⛓️ Cripto" : "💳 Transfer"}
                      </span>
                    </td>

                    {/* Fecha solicitud */}
                    <td className="px-4 py-3" style={{ color: "#6b7280" }}>
                      {formatDate(u.fecha_solicitud)}
                    </td>

                    {/* Fecha vencimiento */}
                    <td className="px-4 py-3">
                      {u.fecha_vencimiento ? (
                        <span
                          className="font-bold"
                          style={{ color: expired ? "#f97316" : "#a78bfa" }}
                        >
                          {expired ? "⚠️ " : "✅ "}{formatDate(u.fecha_vencimiento)}
                        </span>
                      ) : (
                        <span style={{ color: "#6b7280" }}>—</span>
                      )}
                    </td>

                    {/* Rol */}
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-black tracking-wider uppercase"
                        style={
                          isPremium && !expired
                            ? {
                                background: "rgba(124,58,237,0.2)",
                                color: "#a78bfa",
                                border: "1px solid rgba(124,58,237,0.4)",
                                boxShadow: "0 0 8px rgba(124,58,237,0.3)",
                              }
                            : {
                                background: "rgba(255,255,255,0.05)",
                                color: "#6b7280",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }
                        }
                      >
                        {isPremium && !expired ? "⚡ Premium" : "free"}
                      </span>
                    </td>

                    {/* Switch */}
                    <td className="px-4 py-3">
                      {toggling === u.usuario ? (
                        <Loader2 className="animate-spin w-4 h-4" style={{ color: "#a78bfa" }} />
                      ) : u.estado === "pendiente" ? (
                        <button
                          onClick={() => handleApprove(u.usuario)}
                          className="text-xs px-2 py-1 rounded font-bold transition-colors"
                          style={{
                            background: "rgba(167,139,250,0.15)",
                            color: "#a78bfa",
                            border: "1px solid rgba(167,139,250,0.4)",
                          }}
                        >
                          Aprobar
                        </button>
                      ) : (
                        <CyberpunkSwitch
                          checked={isPremium && !expired}
                          onChange={() => handleTogglePremium(u.usuario, isPremium && !expired)}
                        />
                      )}
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemove(u.usuario)}
                        className="p-1.5 rounded transition-colors hover:bg-red-500/20"
                        style={{ color: "#6b7280" }}
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
