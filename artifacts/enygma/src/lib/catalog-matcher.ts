/**
 * Helper para matchear películas de TMDB con el catálogo local
 */

interface CatalogItem {
  id: string;
  titulo: string;
  año?: string | null;
  tipo: "movie" | "serie" | "anime";
  posterUrl?: string | null;
}

export function normalize(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Busca una película en el catálogo por título y año
 * Retorna el item del catálogo si lo encuentra
 */
export function findInCatalog(
  tmdbTitle: string,
  tmdbYear: string | undefined,
  tmdbType: "movie" | "serie" | "anime",
  catalogItems: CatalogItem[]
): CatalogItem | null {
  if (!tmdbTitle || catalogItems.length === 0) return null;

  const normalizedTmdbTitle = normalize(tmdbTitle);
  const tmdbYearNum = tmdbYear ? parseInt(tmdbYear, 10) : null;

  // Filtrar por tipo primero
  const sameType = catalogItems.filter(item => item.tipo === tmdbType);

  // Buscar exacta por título normalizado + año
  if (tmdbYearNum) {
    const exactMatch = sameType.find(
      item =>
        normalize(item.titulo) === normalizedTmdbTitle &&
        (item.año ? parseInt(item.año, 10) === tmdbYearNum : false)
    );
    if (exactMatch) return exactMatch;
  }

  // Buscar exacta solo por título
  const titleMatch = sameType.find(
    item => normalize(item.titulo) === normalizedTmdbTitle
  );
  if (titleMatch) return titleMatch;

  // Buscar por similitud (contiene)
  const partialMatch = sameType.find(
    item =>
      normalize(item.titulo).includes(normalizedTmdbTitle) ||
      normalizedTmdbTitle.includes(normalize(item.titulo))
  );
  if (partialMatch) return partialMatch;

  return null;
}

/**
 * Busca múltiples películas de TMDB en el catálogo
 */
export function matchTmdbItemsToCatalog(
  tmdbItems: Array<{ titulo: string; año?: string; tipo: "movie" | "serie" | "anime" }>,
  catalogItems: CatalogItem[]
): {
  matched: CatalogItem[];
  unmatched: Array<{ titulo: string; año?: string; tipo: "movie" | "serie" | "anime" }>;
} {
  const matched: CatalogItem[] = [];
  const unmatched: typeof tmdbItems = [];

  for (const tmdbItem of tmdbItems) {
    const found = findInCatalog(tmdbItem.titulo, tmdbItem.año, tmdbItem.tipo, catalogItems);
    if (found) {
      matched.push(found);
    } else {
      unmatched.push(tmdbItem);
    }
  }

  return { matched, unmatched };
}
