import { useState, useEffect } from "react";
import { Check, Trash2, Eye, EyeOff, Loader2, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PremiumUser {
  usuario: string;
  nombre: string;
  email?: string;
  metodo_pago?: string;
  fecha_solicitud?: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  sinPublicidades: boolean;
}

export function AdminPremiumTab() {
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([]);
  const [premiumLoading, setPremiumLoading] = useState(false);

  useEffect(() => {
    fetchPremiumUsers();
  }, []);

  const fetchPremiumUsers = async () => {
    setPremiumLoading(true);
    try {
      const res = await fetch(`${BASE}/api/premium/list`);
      const data = await res.json();
      setPremiumUsers(data.users || []);
    } catch (e) {
      console.error("Error fetching premium users:", e);
      setPremiumUsers([]);
    } finally {
      setPremiumLoading(false);
    }
  };

  const toggleUserAds = async (usuario: string, currentState: boolean) => {
    try {
      const res = await fetch(`${BASE}/api/premium/toggle-ads`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, sinPublicidades: !currentState }),
      });
      if (res.ok) {
        fetchPremiumUsers();
      } else {
        alert("Error al actualizar el estado");
      }
    } catch (e) {
      alert("Error de conexión: " + String(e));
    }
  };

  const approvePremiumRequest = async (usuario: string) => {
    try {
      const res = await fetch(`${BASE}/api/premium/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario }),
      });
      if (res.ok) {
        fetchPremiumUsers();
      } else {
        alert("Error al aprobar la solicitud");
      }
    } catch (e) {
      alert("Error de conexión: " + String(e));
    }
  };

  const rejectPremiumRequest = async (usuario: string) => {
    try {
      const res = await fetch(`${BASE}/api/premium/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario }),
      });
      if (res.ok) {
        fetchPremiumUsers();
      } else {
        alert("Error al rechazar la solicitud");
      }
    } catch (e) {
      alert("Error de conexión: " + String(e));
    }
  };

  const removePremiumUser = async (usuario: string) => {
    if (!confirm(`¿Eliminar premium de ${usuario}?`)) return;
    try {
      const res = await fetch(`${BASE}/api/premium/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario }),
      });
      if (res.ok) {
        fetchPremiumUsers();
      } else {
        alert("Error al eliminar el premium");
      }
    } catch (e) {
      alert("Error de conexión: " + String(e));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">💎 Gestión de Premium</h2>
        <p className="text-white/40 text-sm mb-4">Aprueba solicitudes de usuarios premium y gestiona sus privilegios.</p>
      </div>

      {premiumLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#7B2FBE] animate-spin" />
        </div>
      ) : premiumUsers.length === 0 ? (
        <div className="text-center py-12 text-white/20 text-sm border border-dashed border-white/10 rounded-xl">
          No hay solicitudes de premium ni usuarios premium.
        </div>
      ) : (
        <div className="space-y-3">
          {premiumUsers.map((user) => (
            <div key={user.usuario} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold truncate">{user.nombre}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                        user.estado === "aprobado"
                          ? "bg-green-900/50 text-green-400"
                          : user.estado === "rechazado"
                            ? "bg-red-900/50 text-red-400"
                            : "bg-yellow-900/50 text-yellow-400"
                      }`}
                    >
                      {user.estado === "aprobado"
                        ? "✅ Aprobado"
                        : user.estado === "rechazado"
                          ? "❌ Rechazado"
                          : "⏳ Pendiente"}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">@{user.usuario}</p>
                  {user.email && <p className="text-white/40 text-xs">{user.email}</p>}
                  {user.metodo_pago && <p className="text-white/40 text-xs">Pago: {user.metodo_pago}</p>}
                  {user.fecha_solicitud && (
                    <p className="text-white/30 text-xs">Solicitado: {new Date(user.fecha_solicitud).toLocaleString("es-AR")}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {user.estado === "pendiente" && (
                    <>
                      <button
                        onClick={() => approvePremiumRequest(user.usuario)}
                        className="flex items-center gap-1 bg-green-600/80 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => rejectPremiumRequest(user.usuario)}
                        className="flex items-center gap-1 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Rechazar
                      </button>
                    </>
                  )}

                  {user.estado === "aprobado" && (
                    <>
                      <button
                        onClick={() => toggleUserAds(user.usuario, user.sinPublicidades)}
                        className={`flex items-center gap-1 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                          user.sinPublicidades
                            ? "bg-[#7B2FBE]/80 hover:bg-[#7B2FBE]"
                            : "bg-white/10 hover:bg-white/15"
                        }`}
                      >
                        {user.sinPublicidades ? (
                          <>
                            <Eye className="w-3 h-3" />
                            Con Ads
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            Sin Ads
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => removePremiumUser(user.usuario)}
                        className="flex items-center gap-1 bg-white/10 hover:bg-red-600/20 text-white/60 hover:text-red-400 text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
