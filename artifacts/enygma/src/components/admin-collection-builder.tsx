import { useState, useMemo } from "react";
import { Search, X, Plus, Trash2 } from "lucide-react";

interface Item {
  id: string;
  titulo: string;
  posterUrl?: string;
  año?: string;
  tipo: "movie" | "serie" | "anime";
}

interface CollectionBuilderProps {
  allItems: Item[];
  selectedItems: Item[];
  onItemsChange: (items: Item[]) => void;
  isLoading?: boolean;
}

export function AdminCollectionBuilder({
  allItems,
  selectedItems,
  onItemsChange,
  isLoading = false,
}: CollectionBuilderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const query = searchQuery.toLowerCase();
    return allItems.filter((item) =>
      item.titulo.toLowerCase().includes(query)
    );
  }, [allItems, searchQuery]);

  // Get unselected items
  const unselectedItems = useMemo(() => {
    return filteredItems.filter(
      (item) => !selectedItems.some((s) => s.id === item.id && s.tipo === item.tipo)
    );
  }, [filteredItems, selectedItems]);

  const handleSelectItem = (item: Item) => {
    onItemsChange([...selectedItems, item]);
  };

  const handleRemoveItem = (id: string, tipo: string) => {
    onItemsChange(
      selectedItems.filter((item) => !(item.id === id && item.tipo === tipo))
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Buscar película o serie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#7B2FBE] transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Available Items */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 text-sm">
            Películas / Series Disponibles
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#7B2FBE] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : unselectedItems.length > 0 ? (
              unselectedItems.map((item) => (
                <button
                  key={`${item.tipo}-${item.id}`}
                  onClick={() => handleSelectItem(item)}
                  className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors group text-left"
                >
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.titulo}
                      className="w-10 h-14 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-white/10 rounded flex items-center justify-center text-xs text-white/30">
                      No img
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate group-hover:text-[#7B2FBE] transition-colors">
                      {item.titulo}
                    </p>
                    <div className="flex gap-2 text-xs text-white/40">
                      <span>{item.año || "—"}</span>
                      <span className="capitalize">
                        {item.tipo === "movie"
                          ? "Película"
                          : item.tipo === "serie"
                          ? "Serie"
                          : "Anime"}
                      </span>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-white/60 group-hover:text-[#7B2FBE] transition-colors flex-shrink-0" />
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-white/40 text-sm">
                {searchQuery
                  ? "No se encontraron resultados"
                  : "Todas las películas están seleccionadas"}
              </div>
            )}
          </div>
        </div>

        {/* Selected Items */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 text-sm">
            Seleccionadas ({selectedItems.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => (
                <div
                  key={`${item.tipo}-${item.id}`}
                  className="flex items-center gap-3 bg-[#7B2FBE]/20 border border-[#7B2FBE]/50 p-2 rounded-lg group"
                >
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.titulo}
                      className="w-10 h-14 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-white/10 rounded flex items-center justify-center text-xs text-white/30">
                      No img
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{item.titulo}</p>
                    <div className="flex gap-2 text-xs text-white/40">
                      <span>{item.año || "—"}</span>
                      <span className="capitalize">
                        {item.tipo === "movie"
                          ? "Película"
                          : item.tipo === "serie"
                          ? "Serie"
                          : "Anime"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id, item.tipo)}
                    className="p-1 hover:bg-red-600/50 rounded transition-colors text-white/60 hover:text-white flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/40 text-sm">
                Selecciona películas/series de la izquierda
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
