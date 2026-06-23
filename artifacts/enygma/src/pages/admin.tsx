import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, MoveUp, MoveDown, Download, Eye, EyeOff, Save, Check, ChevronDown, ChevronUp, Loader2, X, Globe } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminPremiumTab } from "@/components/admin-premium-tab";
import { AdminCollectionBuilder } from "@/components/admin-collection-builder";
import { AdminGeolocationTab } from "@/components/admin-geolocation-tab";
import { AdminLogin } from "@/components/admin-login";
import { AdminCustomSections } from "@/components/admin-custom-sections";
import { AdminSearchTab } from "@/components/admin-search-tab";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface BannerItem {
  id: string;
  titulo: string;
  tipo: "movie" | "serie" | "anime";
  posterUrl: string | null;
  backdropUrl: string | null;
  year?: string;
  tmdbId?: number;
}

interface CustomSection {
  id: string;
  title: string;
  description?: string;
  position: number;
  items: BannerItem[];
  createdAt: string;
  updatedAt: string;
}

interface AdminConfig {
  banner: { override: boolean; items: BannerItem[] };
  top10: { override: boolean; items: BannerItem[] };
  hiddenSections: string[];
  customSections: CustomSection[];
}

const DEFAULT_SECTIONS = [
  { key: "top10", label: "Top 10 en ENYGMA" },
  { key: "trending", label: "Tendencias" },
  { key: "recommended", label: "Recomendados para ti" },
  { key: "latestMovies", label: "Últimas Películas Añadidas" },
  { key: "latestSeries", label: "Últimas Series" },
  { key: "latestAnime", label: "Últimos Anime" },
];

const TMDB_TYPES = [
  { key: "trending", label: "Tendencias (Semana)" },
  { key: "popular_movies", label: "Películas Populares" },
  { key: "popular_series", label: "Series Populares" },
  { key: "upcoming", label: "Próximos Estrenos" },
  { key: "top_rated", label: "Mejor Valoradas (Películas)" },
  { key: "top_rated_series", label: "Mejor Valoradas (Series)" },
];

type Tab = "secciones" | "banner" | "top10" | "tmdb" | "premium" | "geolocation" | "search";

function SaveBadge({ saved }: { saved: boolean }) {
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all ${saved ? "bg-green-900/50 text-green-400" : "bg-white/5 text-white/30"}`}>
      {saved ? <><Check className="w-3 h-3" />Guardado</> : <><Save className="w-3 h-3" />Sin guardar</>}
    </span>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [authenticated, setAuthenticated] = useState(() => {
    // Check if already authenticated in this session
    try {
      return sessionStorage.getItem("admin_authenticated") === "true";
    } catch {
      return false;
    }
  });
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [tab, setTab] = useState<Tab>("secciones");
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbItems, setTmdbItems] = useState<BannerItem[]>([]);
  const [tmdbType, setTmdbType] = useState("trending");
  const [tmdbSectionTitle, setTmdbSectionTitle] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showCollectionBuilder, setShowCollectionBuilder] = useState(false);
  const [allCatalogItems, setAllCatalogItems] = useState<any[]>([]);
  const [selectedItemsForNewSection, setSelectedItemsForNewSection] = useState<any[]>([]);

  // Drafts (Banner / Top10) + buscadores
  const [bannerDraft, setBannerDraft] = useState<
    Partial<BannerItem> & { position?: number | "" }
  >({ tipo: "movie", position: "" });
  const [top10Draft, setTop10Draft] = useState<
    Partial<BannerItem> & { position?: number | "" }
  >({ tipo: "movie", position: "" });

  const [bannerNameQuery, setBannerNameQuery] = useState("");
  const [top10NameQuery, setTop10NameQuery] = useState("");

  const [bannerTmdbLoading, setBannerTmdbLoading] = useState(false);
  const [top10TmdbLoading, setTop10TmdbLoading] = useState(false);
  const [bannerTmdbResults, setBannerTmdbResults] = useState<
    Array<{
      tmdbId: number;
      titulo: string;
      tipo: BannerItem["tipo"];
      posterUrl: string | null;
      backdropUrl: string | null;
      year?: string;
      overview?: string;
    }>
  >([]);
  const [top10TmdbResults, setTop10TmdbResults] = useState<
    Array<{
      tmdbId: number;
      titulo: string;
      tipo: BannerItem["tipo"];
      posterUrl: string | null;
      backdropUrl: string | null;
      year?: string;
      overview?: string;
    }>
  >([]);

  const [bannerCatalogLoading, setBannerCatalogLoading] = useState(false);
  const [top10CatalogLoading, setTop10CatalogLoading] = useState(false);
  const [bannerCatalogResults, setBannerCatalogResults] = useState<
    Array<{ id: string; titulo: string; tipo: BannerItem["tipo"]; posterUrl: string | null; año?: string | null }>
  >([]);
  const [top10CatalogResults, setTop10CatalogResults] = useState<
    Array<{ id: string; titulo: string; tipo: BannerItem["tipo"]; posterUrl: string | null; año?: string | null }>
  >([]);

  const normalize = (s: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const addItemAtPosition = (
    items: BannerItem[],
    item: BannerItem,
    pos: number | "" | undefined,
    max?: number,
  ): BannerItem[] => {
    const filtered = items.filter((i) => i.id !== item.id);
    const arr = [...filtered];
    const idx =
      typeof pos === "number" && Number.isFinite(pos)
        ? Math.max(0, Math.min(arr.length, pos - 1))
        : arr.length;
    arr.splice(idx, 0, item);
    return typeof max === "number" ? arr.slice(0, max) : arr;
  };

  const fetchCatalogSearch = async (q: string) => {
    const url = `${BASE}/api/content/search?q=${encodeURIComponent(q)}&limit=20`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error buscando en catálogo");
    const data = await res.json();
    const flatten = (arr: any[], tipo: BannerItem["tipo"]) =>
      (arr || []).map((x) => ({
        id: x.id,
        titulo: x.titulo,
        tipo,
        posterUrl: x.posterUrl ?? null,
        año: x.año ?? null,
      }));
    return [
      ...flatten(data.movies || [], "movie"),
      ...flatten(data.series || [], "serie"),
      ...flatten(data.anime || [], "anime"),
    ] as Array<{ id: string; titulo: string; tipo: BannerItem["tipo"]; posterUrl: string | null; año?: string | null }>;
  };

  const fetchContentDetails = async (tipo: BannerItem["tipo"], id: string) => {
    const endpoint =
      tipo === "movie"
        ? `${BASE}/api/content/movies/${encodeURIComponent(id)}`
        : tipo === "serie"
          ? `${BASE}/api/content/series/${encodeURIComponent(id)}`
          : `${BASE}/api/content/anime/${encodeURIComponent(id)}`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error("No se pudo traer el detalle del contenido");
    const data = await res.json();
    // series/anime devuelven { series, episodes, seasons }
    return tipo === "movie" ? data : data.series;
  };

  const fetchTmdbSearch = async (q: string, tipo: BannerItem["tipo"]) => {
    const url = `${BASE}/api/admin/tmdb-search?q=${encodeURIComponent(q)}&tipo=${encodeURIComponent(tipo)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error buscando en TMDB");
    const data = await res.json();
    return (data.items || []) as Array<{
      tmdbId: number;
      titulo: string;
      tipo: BannerItem["tipo"];
      posterUrl: string | null;
      backdropUrl: string | null;
      year?: string;
      overview?: string;
    }>;
  };

  const autoPickCatalogMatch = (
    tmdbItem: { titulo: string; year?: string; tipo: BannerItem["tipo"] },
    catalogItems: Array<{ id: string; titulo: string; tipo: BannerItem["tipo"]; año?: string | null }>,
  ) => {
    const tTitle = normalize(tmdbItem.titulo);
    const tYear = (tmdbItem.year || "").trim();
    const sameType = catalogItems.filter((c) => c.tipo === tmdbItem.tipo);
    const exact = sameType.find((c) => normalize(c.titulo) === tTitle && (!tYear || (c.año || "") === tYear));
    return exact ?? sameType.find((c) => normalize(c.titulo) === tTitle) ?? null;
  };

  const selectCatalogItemForBanner = async (item: { id: string; titulo: string; tipo: BannerItem["tipo"] }) => {
    try {
      const details = await fetchContentDetails(item.tipo, item.id);
      setBannerDraft((p) => ({
        ...p,
        id: item.id,
        tipo: item.tipo,
        titulo: details.titulo || item.titulo,
        posterUrl: details.posterUrl ?? p.posterUrl ?? null,
        backdropUrl: details.backdropUrl ?? p.backdropUrl ?? null,
        year: details.año ?? p.year,
      }));
    } catch {
      // fallback: al menos setear id/titulo
      setBannerDraft((p) => ({ ...p, id: item.id, tipo: item.tipo, titulo: item.titulo }));
    }
  };

  const selectCatalogItemForTop10 = async (item: { id: string; titulo: string; tipo: BannerItem["tipo"] }) => {
    try {
      const details = await fetchContentDetails(item.tipo, item.id);
      setTop10Draft((p) => ({
        ...p,
        id: item.id,
        tipo: item.tipo,
        titulo: details.titulo || item.titulo,
        posterUrl: details.posterUrl ?? p.posterUrl ?? null,
        backdropUrl: details.backdropUrl ?? p.backdropUrl ?? null,
        year: details.año ?? p.year,
      }));
    } catch {
      setTop10Draft((p) => ({ ...p, id: item.id, tipo: item.tipo, titulo: item.titulo }));
    }
  };

  useEffect(() => {
    fetch(`${BASE}/api/admin/config`)
      .then((r) => r.json())
      .then((d) => { setConfig(d); setSaved(true); })
      .catch(() => {
        setConfig({ banner: { override: false, items: [] }, top10: { override: false, items: [] }, hiddenSections: [], customSections: [] });
      });

    // Load all catalog items for collection builder
    fetch(`${BASE}/api/content/search?q=&limit=10000`)
      .then((r) => r.json())
      .then((d) => {
        const items = [
          ...(d.movies || []).map((m: any) => ({ ...m, tipo: "movie" })),
          ...(d.series || []).map((s: any) => ({ ...s, tipo: "serie" })),
          ...(d.anime || []).map((a: any) => ({ ...a, tipo: "anime" })),
        ];
        setAllCatalogItems(items);
      })
      .catch(() => setAllCatalogItems([]));
  }, []);

  const updateConfig = useCallback((updater: (c: AdminConfig) => AdminConfig) => {
    setConfig((prev) => { if (!prev) return prev; return updater(prev); });
    setSaved(false);
  }, []);

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/api/admin/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const syncSheets = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${BASE}/api/admin/sync-sheets`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Refrescar cache del frontend para que se vean cambios al instante.
        queryClient.invalidateQueries();
        alert("✅ Google Sheets sincronizado correctamente");
      } else {
        alert("❌ Error: " + (data.message || "Error desconocido"));
      }
    } catch (e) {
      alert("❌ Error de conexión: " + String(e));
    } finally {
      setSyncing(false);
    }
  };

  const toggleHiddenSection = (key: string) => {
    updateConfig((c) => ({
      ...c,
      hiddenSections: c.hiddenSections.includes(key)
        ? c.hiddenSections.filter((k) => k !== key)
        : [...c.hiddenSections, key],
    }));
  };

  const addCustomSection = () => {
    if (!newSectionTitle.trim()) return;
    const id = `custom_${Date.now()}`;
    updateConfig((c) => ({
      ...c,
      customSections: [...c.customSections, { id, title: newSectionTitle.trim(), position: c.customSections.length, items: [] }],
    }));
    setNewSectionTitle("");
  };

  const removeCustomSection = (id: string) => {
    updateConfig((c) => ({ ...c, customSections: c.customSections.filter((s) => s.id !== id) }));
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    updateConfig((c) => {
      const arr = [...c.customSections];
      const idx = arr.findIndex((s) => s.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return c;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...c, customSections: arr.map((s, i) => ({ ...s, position: i })) };
    });
  };

  const removeSectionItem = (sectionId: string, itemId: string) => {
    updateConfig((c) => ({
      ...c,
      customSections: c.customSections.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
      ),
    }));
  };

  const fetchTmdb = async () => {
    setTmdbLoading(true);
    setTmdbItems([]);
    try {
      const res = await fetch(`${BASE}/api/admin/tmdb-fetch?type=${tmdbType}`);
      const data = await res.json();
      setTmdbItems(data.items || []);
      setTmdbSectionTitle(TMDB_TYPES.find((t) => t.key === tmdbType)?.label || "Sección TMDB");
    } finally {
      setTmdbLoading(false);
    }
  };

  const saveTmdbAsSection = () => {
    if (!tmdbItems.length || !tmdbSectionTitle.trim()) return;
    const id = `tmdb_${Date.now()}`;
    updateConfig((c) => ({
      ...c,
      customSections: [
        ...c.customSections,
        { id, title: tmdbSectionTitle.trim(), position: c.customSections.length, items: tmdbItems },
      ],
    }));
    setTmdbItems([]);
    setTab("secciones");
  };

  const addBannerItem = () => {
    if (!bannerDraft.id || !bannerDraft.titulo) return;
    const item: BannerItem = {
      id: bannerDraft.id,
      titulo: bannerDraft.titulo,
      tipo: (bannerDraft.tipo as BannerItem["tipo"]) || "movie",
      posterUrl: bannerDraft.posterUrl || null,
      backdropUrl: bannerDraft.backdropUrl || null,
      year: bannerDraft.year,
      tmdbId: bannerDraft.tmdbId,
    };
    updateConfig((c) => ({
      ...c,
      banner: {
        ...c.banner,
        items: addItemAtPosition(c.banner.items, item, bannerDraft.position, 10),
      },
    }));
    setBannerDraft({ tipo: "movie", position: "" });
    setBannerNameQuery("");
    setBannerCatalogResults([]);
    setBannerTmdbResults([]);
  };

  const removeBannerItem = (id: string) => {
    updateConfig((c) => ({ ...c, banner: { ...c.banner, items: c.banner.items.filter((i) => i.id !== id) } }));
  };

  const addTop10Item = () => {
    if (!top10Draft.id || !top10Draft.titulo) return;
    const item: BannerItem = {
      id: top10Draft.id,
      titulo: top10Draft.titulo,
      tipo: (top10Draft.tipo as BannerItem["tipo"]) || "movie",
      posterUrl: top10Draft.posterUrl || null,
      backdropUrl: top10Draft.backdropUrl || null,
      year: top10Draft.year,
      tmdbId: top10Draft.tmdbId,
    };
    updateConfig((c) => ({
      ...c,
      top10: {
        ...c.top10,
        items: addItemAtPosition(c.top10.items, item, top10Draft.position, 10),
      },
    }));
    setTop10Draft({ tipo: "movie", position: "" });
    setTop10NameQuery("");
    setTop10CatalogResults([]);
    setTop10TmdbResults([]);
  };

  const removeTop10Item = (id: string) => {
    updateConfig((c) => ({ ...c, top10: { ...c.top10, items: c.top10.items.filter((i) => i.id !== id) } }));
  };

  if (!authenticated) {
    return <AdminLogin onAuthenticate={() => setAuthenticated(true)} />;
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#7B2FBE] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 border-b border-white/10 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/home")} className="text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-[#7B2FBE] font-bold font-display tracking-widest uppercase text-lg">ENYGMA</span>
            <span className="text-white/30 text-sm">/ Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <SaveBadge saved={saved} />
            <button
              onClick={syncSheets}
              disabled={syncing}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded transition-all"
              title="Sincronizar Google Sheets manualmente"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Sincronizar
            </button>
            <button
              onClick={saveConfig}
              disabled={saving || saved}
              className="flex items-center gap-2 bg-[#7B2FBE] hover:bg-[#6a28a6] disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg mb-8 overflow-x-auto">
          {([
            { key: "secciones", label: "Secciones" },
            { key: "banner", label: "Banner" },
            { key: "top10", label: "Top 10" },
            { key: "tmdb", label: "Importar de TMDB" },
            { key: "search", label: "🔍 Búsqueda" },
            { key: "premium", label: "💎 Premium" },
            { key: "geolocation", label: "🌍 Geolocalización" },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === t.key ? "bg-[#7B2FBE] text-white" : "text-white/50 hover:text-white"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* SECCIONES TAB */}
        {tab === "secciones" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-1">Secciones de Inicio</h2>
              <p className="text-white/40 text-sm mb-4">Activa o desactiva las secciones predeterminadas del home.</p>
              <div className="space-y-2">
                {DEFAULT_SECTIONS.map((s) => {
                  const hidden = config.hiddenSections.includes(s.key);
                  return (
                    <div key={s.key} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 hover:bg-white/8 transition-colors">
                      <span className={`text-sm font-medium ${hidden ? "text-white/30 line-through" : "text-white"}`}>{s.label}</span>
                      <button onClick={() => toggleHiddenSection(s.key)} className={`p-1.5 rounded transition-colors ${hidden ? "text-white/30 hover:text-white" : "text-[#7B2FBE] hover:text-red-400"}`}>
                        {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-white/10" />

            <div>
              <h2 className="text-lg font-bold mb-1">Secciones Personalizadas</h2>
              <p className="text-white/40 text-sm mb-4">Crea secciones propias con contenido de TMDB o manual.</p>

              {/* Add new section */}
              <div className="flex gap-2 mb-4">
                <input
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newSectionTitle.trim() && setShowCollectionBuilder(true)}
                  placeholder="Nombre de la nueva sección..."
                  className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
                />
                <button onClick={() => newSectionTitle.trim() && setShowCollectionBuilder(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  Crear
                </button>
              </div>

              {/* Collection Builder Modal */}
              {showCollectionBuilder && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
                  <div className="bg-black border border-white/20 rounded-xl p-6 w-full max-w-5xl my-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-white">Seleccionar películas/series</h2>
                        <p className="text-white/40 text-sm mt-1">Creando sección: "<span className="text-[#7B2FBE]">{newSectionTitle}</span>"</p>
                      </div>
                      <button onClick={() => {
                        setShowCollectionBuilder(false);
                        setSelectedItemsForNewSection([]);
                      }} className="text-white/60 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <AdminCollectionBuilder
                      allItems={allCatalogItems}
                      selectedItems={selectedItemsForNewSection}
                      onItemsChange={setSelectedItemsForNewSection}
                      isLoading={allCatalogItems.length === 0}
                    />

                    <div className="mt-6 flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setShowCollectionBuilder(false);
                          setSelectedItemsForNewSection([]);
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          if (newSectionTitle.trim() && selectedItemsForNewSection.length > 0) {
                            const id = `custom_${Date.now()}`;
                            updateConfig((c) => ({
                              ...c,
                              customSections: [
                                ...c.customSections,
                                { 
                                  id, 
                                  title: newSectionTitle.trim(), 
                                  position: c.customSections.length, 
                                  items: selectedItemsForNewSection as any 
                                },
                              ],
                            }));
                            setNewSectionTitle("");
                            setSelectedItemsForNewSection([]);
                            setShowCollectionBuilder(false);
                          }
                        }}
                        disabled={selectedItemsForNewSection.length === 0}
                        className="px-4 py-2 bg-[#7B2FBE] hover:bg-[#6a28a6] disabled:opacity-40 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
                      >
                        Guardar ({selectedItemsForNewSection.length}) Película{selectedItemsForNewSection.length !== 1 ? "s" : ""}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing custom sections */}
              {config.customSections.length === 0 && (
                <div className="text-center py-10 text-white/20 text-sm border border-dashed border-white/10 rounded-lg">
                  No hay secciones personalizadas. Crea una arriba o importa desde TMDB.
                </div>
              )}
              <div className="space-y-3">
                {config.customSections.map((section, idx) => (
                  <div key={section.id} className="bg-white/5 rounded-xl border border-white/8">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveSection(section.id, -1)} disabled={idx === 0} className="text-white/30 hover:text-white disabled:opacity-10 transition-colors p-0.5">
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => moveSection(section.id, 1)} disabled={idx === config.customSections.length - 1} className="text-white/30 hover:text-white disabled:opacity-10 transition-colors p-0.5">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{section.title}</p>
                        <p className="text-white/30 text-xs">{section.items.length} items</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)} className="text-white/50 hover:text-white transition-colors p-1.5">
                          {expandedSection === section.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => removeCustomSection(section.id)} className="text-white/30 hover:text-[#7B2FBE] transition-colors p-1.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {expandedSection === section.id && (
                      <div className="border-t border-white/8 px-4 py-3">
                        {section.items.length === 0 ? (
                          <p className="text-white/30 text-sm text-center py-4">Sin items. Importa desde TMDB o agrega manualmente.</p>
                        ) : (
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {section.items.map((item) => (
                              <div key={item.id} className="flex-shrink-0 w-20 relative group">
                                {item.posterUrl ? (
                                  <img src={item.posterUrl} alt={item.titulo} className="w-20 h-28 object-cover rounded-lg" />
                                ) : (
                                  <div className="w-20 h-28 bg-white/10 rounded-lg flex items-center justify-center text-xs text-white/30 text-center px-1">{item.titulo}</div>
                                )}
                                <button
                                  onClick={() => removeSectionItem(section.id, item.id)}
                                  className="absolute top-1 right-1 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#7B2FBE]"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <p className="text-xs text-white/60 mt-1 truncate">{item.titulo}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BANNER TAB */}
        {tab === "banner" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold mb-1">Banner Principal</h2>
                <p className="text-white/40 text-sm">Personaliza qué contenido aparece en el banner de inicio.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-sm">{config.banner.override ? "Override activo" : "Automático"}</span>
                <button
                  onClick={() => updateConfig((c) => ({ ...c, banner: { ...c.banner, override: !c.banner.override } }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.banner.override ? "bg-[#7B2FBE]" : "bg-white/20"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${config.banner.override ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            {config.banner.override && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/40 mb-1 block">Nombre (buscá por título)</label>
                    <input
                      value={bannerNameQuery}
                      onChange={(e) => setBannerNameQuery(e.target.value)}
                      placeholder="Ej: Batman, Shrek, Stranger Things..."
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Tipo</label>
                    <select
                      value={bannerDraft.tipo || "movie"}
                      onChange={(e) => setBannerDraft((p) => ({ ...p, tipo: e.target.value as BannerItem["tipo"] }))}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B2FBE]"
                    >
                      <option value="movie">Película</option>
                      <option value="serie">Serie</option>
                      <option value="anime">Anime</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex gap-2">
                    <button
                      onClick={async () => {
                        const q = bannerNameQuery.trim();
                        if (!q) return;
                        setBannerTmdbLoading(true);
                        setBannerTmdbResults([]);
                        try {
                          const results = await fetchTmdbSearch(q, (bannerDraft.tipo as any) || "movie");
                          setBannerTmdbResults(results);
                        } finally {
                          setBannerTmdbLoading(false);
                        }
                      }}
                      disabled={bannerTmdbLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      title="Buscar por nombre en TMDB"
                    >
                      {bannerTmdbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Buscar en TMDB
                    </button>
                    <button
                      onClick={async () => {
                        const q = bannerNameQuery.trim();
                        if (!q) return;
                        setBannerCatalogLoading(true);
                        setBannerCatalogResults([]);
                        try {
                          const results = await fetchCatalogSearch(q);
                          setBannerCatalogResults(results);
                        } finally {
                          setBannerCatalogLoading(false);
                        }
                      }}
                      disabled={bannerCatalogLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      title="Busca dentro de tu catálogo (Google Sheets)"
                    >
                      {bannerCatalogLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Buscar en Catálogo
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Posición (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={bannerDraft.position ?? ""}
                      onChange={(e) => {
                        const v = e.target.value === "" ? "" : Math.max(1, Math.min(10, Number(e.target.value)));
                        setBannerDraft((p) => ({ ...p, position: v }));
                      }}
                      placeholder="(opcional)"
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-1 block">ID interno (Sheets)</label>
                    <input
                      value={bannerDraft.id || ""}
                      onChange={(e) => setBannerDraft((p) => ({ ...p, id: e.target.value }))}
                      placeholder="Ej: id_unico / id..."
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/40 mb-1 block">Título</label>
                    <input
                      value={bannerDraft.titulo || ""}
                      onChange={(e) => setBannerDraft((p) => ({ ...p, titulo: e.target.value }))}
                      placeholder="Se completa solo cuando elegís un resultado"
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      onClick={addBannerItem}
                      disabled={!bannerDraft.id || !bannerDraft.titulo || bannerDraft.id.startsWith("tmdb_movie_")}
                      title={bannerDraft.id?.startsWith("tmdb_movie_") ? "Primero debes seleccionar la película desde tu catálogo" : ""}
                      className="w-full flex items-center justify-center gap-2 bg-[#7B2FBE] hover:bg-[#6a28a6] disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {bannerDraft.id?.startsWith("tmdb_movie_") ? "⚠️ Selecciona desde tu Catálogo" : "Agregar al Banner"}
                    </button>
                  </div>
                </div>

                {/* Resultados TMDB */}
                {bannerTmdbResults.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-xs text-white/40 mb-2">Resultados TMDB (elegí uno para autocompletar)</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {bannerTmdbResults.map((r) => (
                        <button
                          key={r.tmdbId}
                          onClick={async () => {
                            setBannerDraft((p) => ({
                              ...p,
                              tmdbId: r.tmdbId,
                              year: r.year,
                              overview: r.overview,
                              tipo: r.tipo,
                              titulo: r.titulo,
                              posterUrl: r.posterUrl,
                              backdropUrl: r.backdropUrl,
                            }));
                            setBannerNameQuery(r.titulo);

                            // Intentar traer el ID interno desde el catálogo automáticamente
                            setBannerCatalogLoading(true);
                            try {
                              const catalog = await fetchCatalogSearch(r.titulo);
                              setBannerCatalogResults(catalog);
                              const best = autoPickCatalogMatch(r, catalog);
                              if (best) await selectCatalogItemForBanner(best);
                            } finally {
                              setBannerCatalogLoading(false);
                            }
                          }}
                          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-left transition-colors"
                        >
                          {r.posterUrl ? (
                            <img src={r.posterUrl} alt={r.titulo} className="w-10 h-14 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-14 bg-white/10 rounded" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{r.titulo}</p>
                            <p className="text-xs text-white/40">{r.tipo}{r.year ? ` • ${r.year}` : ""}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resultados Catálogo */}
                {bannerCatalogResults.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-xs text-white/40 mb-2">Tu catálogo (Google Sheets)</p>
                    <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-auto pr-1">
                      {bannerCatalogResults.map((r) => (
                        <button
                          key={`${r.tipo}:${r.id}`}
                          onClick={() => selectCatalogItemForBanner(r)}
                          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-left transition-colors"
                        >
                          {r.posterUrl ? (
                            <img src={r.posterUrl} alt={r.titulo} className="w-10 h-14 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-14 bg-white/10 rounded" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{r.titulo}</p>
                            <p className="text-xs text-white/40">ID: {r.id}{r.año ? ` • ${r.año}` : ""}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {config.banner.items.length === 0 && (
                    <div className="w-full text-center py-10 text-white/20 text-sm border border-dashed border-white/10 rounded-lg">
                      Sin items en el banner. Agrega contenido arriba.
                    </div>
                  )}
                  {config.banner.items.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-28 relative group">
                      {item.posterUrl ? (
                        <img src={item.posterUrl} alt={item.titulo} className="w-28 h-40 object-cover rounded-xl" />
                      ) : (
                        <div className="w-28 h-40 bg-white/10 rounded-xl flex items-center justify-center text-xs text-white/30 text-center px-2">{item.titulo}</div>
                      )}
                      <button
                        onClick={() => removeBannerItem(item.id)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#7B2FBE]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-xs text-white/60 mt-1.5 truncate">{item.titulo}</p>
                      <p className="text-xs text-[#7B2FBE]/60">{item.tipo}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!config.banner.override && (
              <div className="text-center py-12 text-white/20 text-sm border border-dashed border-white/10 rounded-xl">
                El banner se genera automáticamente desde el catálogo.<br />Activa el override para personalizarlo.
              </div>
            )}
          </div>
        )}

        {/* TOP 10 TAB */}
        {tab === "top10" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold mb-1">Top 10 en ENYGMA</h2>
                <p className="text-white/40 text-sm">Controla manualmente qué aparece en el Top 10.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-sm">{config.top10.override ? "Override activo" : "Automático"}</span>
                <button
                  onClick={() => updateConfig((c) => ({ ...c, top10: { ...c.top10, override: !c.top10.override } }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.top10.override ? "bg-[#7B2FBE]" : "bg-white/20"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${config.top10.override ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            {config.top10.override && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/40 mb-1 block">Nombre (buscá por título)</label>
                    <input
                      value={top10NameQuery}
                      onChange={(e) => setTop10NameQuery(e.target.value)}
                      placeholder="Ej: El Padrino, Friends, Naruto..."
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Tipo</label>
                    <select
                      value={top10Draft.tipo || "movie"}
                      onChange={(e) => setTop10Draft((p) => ({ ...p, tipo: e.target.value as BannerItem["tipo"] }))}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7B2FBE]"
                    >
                      <option value="movie">Película</option>
                      <option value="serie">Serie</option>
                      <option value="anime">Anime</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex gap-2">
                    <button
                      onClick={async () => {
                        const q = top10NameQuery.trim();
                        if (!q) return;
                        setTop10TmdbLoading(true);
                        setTop10TmdbResults([]);
                        try {
                          const results = await fetchTmdbSearch(q, (top10Draft.tipo as any) || "movie");
                          setTop10TmdbResults(results);
                        } finally {
                          setTop10TmdbLoading(false);
                        }
                      }}
                      disabled={top10TmdbLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      title="Buscar por nombre en TMDB"
                    >
                      {top10TmdbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Buscar en TMDB
                    </button>
                    <button
                      onClick={async () => {
                        const q = top10NameQuery.trim();
                        if (!q) return;
                        setTop10CatalogLoading(true);
                        setTop10CatalogResults([]);
                        try {
                          const results = await fetchCatalogSearch(q);
                          setTop10CatalogResults(results);
                        } finally {
                          setTop10CatalogLoading(false);
                        }
                      }}
                      disabled={top10CatalogLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      title="Busca dentro de tu catálogo (Google Sheets)"
                    >
                      {top10CatalogLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Buscar en Catálogo
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Posición (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={top10Draft.position ?? ""}
                      onChange={(e) => {
                        const v = e.target.value === "" ? "" : Math.max(1, Math.min(10, Number(e.target.value)));
                        setTop10Draft((p) => ({ ...p, position: v }));
                      }}
                      placeholder="Ej: 1"
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-1 block">ID interno (Sheets)</label>
                    <input
                      value={top10Draft.id || ""}
                      onChange={(e) => setTop10Draft((p) => ({ ...p, id: e.target.value }))}
                      placeholder="Ej: id_unico / id..."
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/40 mb-1 block">Título</label>
                    <input
                      value={top10Draft.titulo || ""}
                      onChange={(e) => setTop10Draft((p) => ({ ...p, titulo: e.target.value }))}
                      placeholder="Se completa solo cuando elegís un resultado"
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      onClick={addTop10Item}
                      disabled={!top10Draft.id || !top10Draft.titulo || top10Draft.id.startsWith("tmdb_movie_")}
                      title={top10Draft.id?.startsWith("tmdb_movie_") ? "Primero debes seleccionar la película desde tu catálogo" : ""}
                      className="w-full flex items-center justify-center gap-2 bg-[#7B2FBE] hover:bg-[#6a28a6] disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {top10Draft.id?.startsWith("tmdb_movie_") ? "⚠️ Selecciona desde tu Catálogo" : "Agregar al Top 10"}
                    </button>
                  </div>
                </div>

                {/* Resultados TMDB */}
                {top10TmdbResults.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-xs text-white/40 mb-2">Resultados TMDB (elegí uno para autocompletar)</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {top10TmdbResults.map((r) => (
                        <button
                          key={r.tmdbId}
                          onClick={async () => {
                            setTop10Draft((p) => ({
                              ...p,
                              tmdbId: r.tmdbId,
                              year: r.year,
                              overview: r.overview,
                              tipo: r.tipo,
                              titulo: r.titulo,
                              posterUrl: r.posterUrl,
                              backdropUrl: r.backdropUrl,
                            }));
                            setTop10NameQuery(r.titulo);

                            setTop10CatalogLoading(true);
                            try {
                              const catalog = await fetchCatalogSearch(r.titulo);
                              setTop10CatalogResults(catalog);
                              const best = autoPickCatalogMatch(r, catalog);
                              if (best) await selectCatalogItemForTop10(best);
                            } finally {
                              setTop10CatalogLoading(false);
                            }
                          }}
                          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-left transition-colors"
                        >
                          {r.posterUrl ? (
                            <img src={r.posterUrl} alt={r.titulo} className="w-10 h-14 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-14 bg-white/10 rounded" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{r.titulo}</p>
                            <p className="text-xs text-white/40">{r.tipo}{r.year ? ` • ${r.year}` : ""}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resultados Catálogo */}
                {top10CatalogResults.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-xs text-white/40 mb-2">Tu catálogo (Google Sheets)</p>
                    <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-auto pr-1">
                      {top10CatalogResults.map((r) => (
                        <button
                          key={`${r.tipo}:${r.id}`}
                          onClick={() => selectCatalogItemForTop10(r)}
                          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-left transition-colors"
                        >
                          {r.posterUrl ? (
                            <img src={r.posterUrl} alt={r.titulo} className="w-10 h-14 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-14 bg-white/10 rounded" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{r.titulo}</p>
                            <p className="text-xs text-white/40">ID: {r.id}{r.año ? ` • ${r.año}` : ""}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {config.top10.items.length === 0 && (
                    <div className="text-center py-10 text-white/20 text-sm border border-dashed border-white/10 rounded-lg">
                      Sin items. Agrega contenido arriba.
                    </div>
                  )}
                  {config.top10.items.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-4 bg-white/5 rounded-lg px-4 py-3">
                      <span className="text-4xl font-bold font-display text-white/20 w-10 text-right leading-none">{i + 1}</span>
                      {item.posterUrl && <img src={item.posterUrl} alt={item.titulo} className="w-10 h-14 object-cover rounded" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.titulo}</p>
                        <p className="text-white/30 text-xs capitalize">{item.tipo}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            updateConfig((c) => {
                              const arr = [...c.top10.items];
                              if (i > 0) [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
                              return { ...c, top10: { ...c.top10, items: arr } };
                            });
                          }}
                          disabled={i === 0}
                          className="text-white/30 hover:text-white disabled:opacity-10 p-1 transition-colors"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            updateConfig((c) => {
                              const arr = [...c.top10.items];
                              if (i < arr.length - 1) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                              return { ...c, top10: { ...c.top10, items: arr } };
                            });
                          }}
                          disabled={i === config.top10.items.length - 1}
                          className="text-white/30 hover:text-white disabled:opacity-10 p-1 transition-colors"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeTop10Item(item.id)} className="text-white/30 hover:text-[#7B2FBE] p-1 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!config.top10.override && (
              <div className="text-center py-12 text-white/20 text-sm border border-dashed border-white/10 rounded-xl">
                El Top 10 se genera automáticamente desde el catálogo.<br />Activa el override para controlarlo manualmente.
              </div>
            )}
          </div>
        )}

        {/* TMDB TAB */}
        {tab === "tmdb" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-1">Importar desde TMDB</h2>
              <p className="text-white/40 text-sm mb-4">Trae contenido de TMDB y guárdalo como una sección del home.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Tipo de contenido</label>
                <select
                  value={tmdbType}
                  onChange={(e) => setTmdbType(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#7B2FBE]"
                >
                  {TMDB_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchTmdb}
                  disabled={tmdbLoading}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors w-full justify-center"
                >
                  {tmdbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Traer de TMDB
                </button>
              </div>
            </div>

            {tmdbItems.length > 0 && (
              <>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {tmdbItems.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-24">
                      {item.posterUrl ? (
                        <img src={item.posterUrl} alt={item.titulo} className="w-24 h-36 object-cover rounded-xl" />
                      ) : (
                        <div className="w-24 h-36 bg-white/10 rounded-xl flex items-center justify-center text-xs text-white/30 text-center px-1">{item.titulo}</div>
                      )}
                      <p className="text-xs text-white/60 mt-1.5 truncate">{item.titulo}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                  <p className="text-sm font-semibold text-white/70">Guardar como sección</p>
                  <div className="flex gap-3">
                    <input
                      value={tmdbSectionTitle}
                      onChange={(e) => setTmdbSectionTitle(e.target.value)}
                      placeholder="Nombre de la sección..."
                      className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
                    />
                    <button
                      onClick={saveTmdbAsSection}
                      className="flex items-center gap-2 bg-[#7B2FBE] hover:bg-[#6a28a6] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Guardar Sección
                    </button>
                  </div>
                  <p className="text-xs text-white/30">{tmdbItems.length} items se agregarán a la sección. Luego guarda los cambios.</p>
                </div>
              </>
            )}

            {!tmdbLoading && tmdbItems.length === 0 && (
              <div className="text-center py-12 text-white/20 text-sm border border-dashed border-white/10 rounded-xl">
                Selecciona un tipo de contenido y presiona "Traer de TMDB"
              </div>
            )}
          </div>
        )}

        {/* PREMIUM TAB */}
        {tab === "premium" && (
          <AdminPremiumTab />
        )}

        {/* GEOLOCATION TAB */}
        {tab === "geolocation" && (
          <AdminGeolocationTab />
        )}

        {/* SEARCH TAB */}
        {tab === "search" && (
          <AdminSearchTab />
        )}

        <div className="h-16" />
      </div>
    </div>
  );
}
