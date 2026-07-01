import { useState, useEffect } from "react";
import { Loader2, Trash2, Globe, MapPin, Users, TrendingUp, Calendar, Activity } from "lucide-react";

interface GeoLocation {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  timestamp: string;
  userAgent: string;
}

interface GeoStats {
  totalVisits: number;
  uniqueVisitors: number;
  today: number;
  yesterday: number;
  last7Days: number;
  dailyCounts: Record<string, number>;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AdminGeolocationTab() {
  const [geoLocations, setGeoLocations] = useState<GeoLocation[]>([]);
  const [stats, setStats] = useState<GeoStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [geoRes, statsRes] = await Promise.all([
        fetch(`${BASE}/api/geo/list`),
        fetch(`${BASE}/api/geo/stats`),
      ]);
      const geoData = await geoRes.json();
      const statsData = await statsRes.json();
      setGeoLocations(geoData.locations || []);
      setStats(statsData);
    } catch (e) {
      console.error("Error fetching geo data:", e);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    if (!confirm("¿Limpiar TODOS los registros y contadores?")) return;
    try {
      await fetch(`${BASE}/api/geo/clear`, { method: "POST" });
      setGeoLocations([]);
      setStats(null);
    } catch (e) {
      alert("Error al limpiar data");
    }
  };

  const byCountry: Record<string, GeoLocation[]> = {};
  geoLocations.forEach((geo) => {
    if (!byCountry[geo.country]) byCountry[geo.country] = [];
    byCountry[geo.country].push(geo);
  });
  const countries = Object.entries(byCountry).sort(([, a], [, b]) => b.length - a.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Ingresos y Visitas</h2>
          <p className="text-white/40 text-sm">Monitoreo en tiempo real. Se actualiza cada 10 segundos.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Actualizar
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Main counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Unique visitors — main KPI */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#E50914]/20 to-[#E50914]/5 border border-[#E50914]/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-[#E50914]/20 rounded-full p-3">
            <Users className="w-8 h-8 text-[#E50914]" />
          </div>
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Personas Unicas</p>
            <p className="text-white font-black text-5xl leading-none mt-1">
              {stats?.uniqueVisitors ?? 0}
            </p>
            <p className="text-white/30 text-xs mt-1">IPs distintas registradas</p>
          </div>
        </div>

        {/* Today */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-white/40" />
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Hoy</p>
          </div>
          <p className="text-white font-black text-4xl">{stats?.today ?? 0}</p>
          <p className="text-white/30 text-xs mt-1">vs {stats?.yesterday ?? 0} ayer</p>
        </div>

        {/* Last 7 days */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-white/40" />
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">7 Dias</p>
          </div>
          <p className="text-white font-black text-4xl">{stats?.last7Days ?? 0}</p>
          <p className="text-white/30 text-xs mt-1">Total: {stats?.totalVisits ?? 0}</p>
        </div>
      </div>

      {/* By Country */}
      <div>
        <h3 className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3">Por Pais</h3>
        <div className="space-y-3">
          {countries.length > 0 ? (
            countries.map(([country, locations]) => (
              <div key={country} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#E50914]" />
                    {country} ({locations[0]?.countryCode || "XX"})
                  </h3>
                  <span className="bg-[#E50914]/15 text-[#E50914] text-xs font-bold px-3 py-1 rounded-full">
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
                        <code className="text-[#E50914] font-mono text-sm font-bold">{geo.ip}</code>
                        <span className="text-white/40 text-xs">
                          {new Date(geo.timestamp).toLocaleString("es-AR")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/60">
                        <span>{geo.city || "—"}</span>
                        <span>{geo.region || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-white/40">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Sin registros aun</p>
              <p className="text-xs mt-2">Los ingresos se registran automaticamente cuando alguien abre la app</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
