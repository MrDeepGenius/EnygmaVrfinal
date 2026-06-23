import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, X, Search, Edit2, Clock } from "lucide-react";
import { AdminCollectionBuilder } from "./admin-collection-builder";

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

interface AdminCustomSectionsProps {
  sections: CustomSection[];
  allItems: any[];
  isLoadingItems: boolean;
  onSectionsChange: (sections: CustomSection[]) => void;
}

export function AdminCustomSections({
  sections,
  allItems,
  isLoadingItems,
  onSectionsChange,
}: AdminCustomSectionsProps) {
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionDescription, setNewSectionDescription] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showCollectionBuilder, setShowCollectionBuilder] = useState<string | null>(null);

  const handleCreateSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection: CustomSection = {
      id: `section_${Date.now()}`,
      title: newSectionTitle.trim(),
      description: newSectionDescription.trim() || undefined,
      position: sections.length,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSectionsChange([...sections, newSection]);
    setNewSectionTitle("");
    setNewSectionDescription("");
  };

  const handleDeleteSection = (id: string) => {
    if (confirm("¿Eliminar esta sección?")) {
      onSectionsChange(sections.filter(s => s.id !== id));
    }
  };

  const handleMoveSection = (id: string, direction: -1 | 1) => {
    const idx = sections.findIndex(s => s.id === id);
    if ((direction === -1 && idx === 0) || (direction === 1 && idx === sections.length - 1)) return;

    const newSections = [...sections];
    [newSections[idx], newSections[idx + direction]] = [newSections[idx + direction], newSections[idx]];
    newSections.forEach((s, i) => (s.position = i));
    onSectionsChange(newSections);
  };

  const handleUpdateSectionItems = (sectionId: string, items: BannerItem[]) => {
    onSectionsChange(
      sections.map(s =>
        s.id === sectionId
          ? { ...s, items, updatedAt: new Date().toISOString() }
          : s
      )
    );
    setShowCollectionBuilder(null);
  };

  const handleRemoveItemFromSection = (sectionId: string, itemId: string) => {
    onSectionsChange(
      sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.filter(i => i.id !== itemId),
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  };

  const handleEditSection = (sectionId: string, newTitle: string) => {
    if (newTitle.trim()) {
      onSectionsChange(
        sections.map(s =>
          s.id === sectionId
            ? { ...s, title: newTitle.trim(), updatedAt: new Date().toISOString() }
            : s
        )
      );
      setEditingSection(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white mb-1">📚 Secciones Personalizadas</h2>
        <p className="text-white/40 text-sm mb-4">
          Crea secciones temáticas con múltiples películas y series. Los usuarios verán estas secciones en el home.
        </p>
      </div>

      {/* Create New Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-bold mb-3 text-sm">Crear Nueva Sección</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nombre de la sección (ej: Películas de Acción)"
            value={newSectionTitle}
            onChange={e => setNewSectionTitle(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE]"
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={newSectionDescription}
            onChange={e => setNewSectionDescription(e.target.value)}
            rows={2}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7B2FBE] resize-none"
          />
          <button
            onClick={handleCreateSection}
            disabled={!newSectionTitle.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#7B2FBE] hover:bg-[#6a28a6] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear Sección
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.length === 0 ? (
          <div className="text-center py-10 text-white/20 text-sm border border-dashed border-white/10 rounded-lg">
            No hay secciones personalizadas. Crea una arriba.
          </div>
        ) : (
          sections.map((section, idx) => (
            <div key={section.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              {/* Section Header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveSection(section.id, -1)}
                    disabled={idx === 0}
                    className="text-white/30 hover:text-white disabled:opacity-10 transition-colors p-0.5"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveSection(section.id, 1)}
                    disabled={idx === sections.length - 1}
                    className="text-white/30 hover:text-white disabled:opacity-10 transition-colors p-0.5"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  {editingSection === section.id ? (
                    <input
                      type="text"
                      defaultValue={section.title}
                      onBlur={e => handleEditSection(section.id, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          handleEditSection(section.id, (e.target as HTMLInputElement).value);
                        }
                      }}
                      autoFocus
                      className="w-full bg-white/10 border border-[#7B2FBE] rounded px-2 py-1 text-sm text-white focus:outline-none"
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-white truncate">{section.title}</p>
                        <button
                          onClick={() => setEditingSection(section.id)}
                          className="text-white/40 hover:text-white transition-colors p-1"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      {section.description && (
                        <p className="text-white/40 text-xs truncate">{section.description}</p>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(section.updatedAt).toLocaleDateString("es-AR")}</span>
                    </div>
                    <span>{section.items.length} película{section.items.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    className="text-white/50 hover:text-white transition-colors p-1.5"
                  >
                    {expandedSection === section.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-white/30 hover:text-[#7B2FBE] transition-colors p-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section Content */}
              {expandedSection === section.id && (
                <div className="border-t border-white/8 px-4 py-4 space-y-4 bg-white/3">
                  {/* Add Movies Button */}
                  <button
                    onClick={() => setShowCollectionBuilder(showCollectionBuilder === section.id ? null : section.id)}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {section.items.length === 0 ? "Agregar Películas" : "Agregar Más"}
                  </button>

                  {/* Collection Builder */}
                  {showCollectionBuilder === section.id && (
                    <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                      <AdminCollectionBuilder
                        allItems={allItems}
                        selectedItems={section.items}
                        onItemsChange={(items) => handleUpdateSectionItems(section.id, items)}
                        isLoading={isLoadingItems}
                      />
                      <div className="mt-4 flex gap-2 justify-end">
                        <button
                          onClick={() => setShowCollectionBuilder(null)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors text-sm font-semibold"
                        >
                          Listo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Movies in Section */}
                  <div className="space-y-2">
                    <p className="text-xs text-white/60 font-semibold">
                      Películas y Series en esta sección:
                    </p>
                    {section.items.length === 0 ? (
                      <p className="text-xs text-white/30 italic">Sin películas aún. Agrega algunas arriba.</p>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {section.items.map(movie => (
                          <div key={movie.id} className="flex-shrink-0 w-16 relative group">
                            {movie.posterUrl ? (
                              <img
                                src={movie.posterUrl}
                                alt={movie.titulo}
                                className="w-16 h-24 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-24 bg-white/10 rounded-lg flex items-center justify-center text-xs text-white/30 text-center px-1">
                                {movie.titulo}
                              </div>
                            )}
                            <button
                              onClick={() => handleRemoveItemFromSection(section.id, movie.id)}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#7B2FBE]"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <p className="text-xs text-white/60 mt-1 truncate text-center">
                              {movie.titulo.substring(0, 10)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
