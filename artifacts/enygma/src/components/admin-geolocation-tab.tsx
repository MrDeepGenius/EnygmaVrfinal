import { useState, useEffect } from "react";
import { Loader2, Trash2, Globe, MapPin } from "lucide-react";

interface GeoLocation {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  timestamp: string;
  userAgent: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AdminGeolocationTab() {
  const [geoLocations, setGeoLocations] = useState<GeoLocation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGeoLocations();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchGeoLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchGeoLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/geo/list`);
      const data = await res.json();
      setGeoLocations(data.locations || []);
    } catch (e) {
      console.error("Error fetching geolocation:", e);
    } finally {
      setLoading(false);
    }
  };

  const clearGeoLocations = async () => {
    if (!confirm("¿Limpiar toda la data de geolocalización?")) return;
    try {
      await fetch(`${BASE}/api/geo/clear`, { method: "POST" });
      setGeoLocations([]);
    } catch (e) {
      alert("Error al limpiar data");
    }
  };

  const trackCurrentUser = async () => {
    try {
      await fetch(`${BASE}/api/geo/track`);
      fetchGeoLocations();
    } catch (e) {
      alert("Error al registrar geolocalización");
    }
  };

  // Group by country
  const byCountry: Record<string, GeoLocation[]> = {};
  geoLocations.forEach((geo) => {
    if (!byCountry[geo.country]) {
      byCountry[geo.country] = [];
    }
    byCountry[geo.country].push(geo);
  });

  const countries = Object.entries(byCountry).sort(([, a], [, b]) => b.length - a.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white mb-1">🌍 Geolocalización</h2>
        <p className="text-white/40 text-sm mb-4">
          Monitorea desde dónde se accede a la app. Total registros: {geoLocations.length}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={trackCurrentUser}
          className="flex items-center gap-2 bg-[#7B2FBE] hover:bg-[#6a28a6] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Globe className="w-4 h-4" />
          Registrar Mi IP Ahora
        </button>
        <button
          onClick={fetchGeoLocations}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizar"}
        </button>
        <button
          onClick={clearGeoLocations}
          className="flex items-center gap-2 bg-red-900/50 hover:bg-red-900/70 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Limpiar Todo
        </button>
      </div>

      {/* By Country */}
      <div className="space-y-4">
        {countries.length > 0 ? (
          countries.map(([country, locations]) => (
            <div key={country} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#7B2FBE]" />
                  {country} ({locations[0]?.countryCode || "XX"})
                </h3>
                <span className="bg-[#7B2FBE]/20 text-[#7B2FBE] text-xs font-bold px-3 py-1 rounded-full">
                  {locations.length} accesos
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {locations.map((geo, idx) => (
                  <div
                    key={`${geo.ip}-${geo.timestamp}-${idx}`}
                    className="flex flex-col gap-1 bg-white/5 p-2.5 rounded border border-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <code className="text-[#7B2FBE] font-mono text-sm font-bold">{geo.ip}</code>
                      <span className="text-white/40 text-xs">
                        {new Date(geo.timestamp).toLocaleTimeString("es-AR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span>📍 {geo.city || "—"}</span>
                      <span>📍 {geo.region || "—"}</span>
                    </div>
                    <div className="text-xs text-white/40 truncate">
                      User Agent: {geo.userAgent.substring(0, 80)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-white/40">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No hay registros de geolocalización aún</p>
            <p className="text-xs mt-2">Haz clic en "Registrar Mi IP Ahora" para empezar</p>
          </div>
        )}
      </div>

      {/* Stats */}
      {countries.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 text-sm">📊 Estadísticas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-white/40 text-xs">Total de Accesos</p>
              <p className="text-white font-bold text-lg">{geoLocations.length}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Países Únicos</p>
              <p className="text-white font-bold text-lg">{countries.length}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Más Común</p>
              <p className="text-white font-bold text-lg">
                {countries[0]?.[0].substring(0, 10) || "—"}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Último Acceso</p>
              <p className="text-white font-bold text-xs">
                {geoLocations.length > 0
                  ? new Date(geoLocations[0].timestamp).toLocaleTimeString("es-AR")
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
