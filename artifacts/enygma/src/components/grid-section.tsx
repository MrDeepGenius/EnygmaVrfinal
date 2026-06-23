import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { PosterCard } from "./poster-card";

interface GridSectionProps {
  title: string;
  subtitle?: string;
  items: any[];
  type: "movie" | "serie" | "anime";
  viewAllHref?: string;
  maxItems?: number;
}

export function GridSection({ title, subtitle, items, type, viewAllHref, maxItems = 6 }: GridSectionProps) {
  if (!items || items.length < 2) return null;
  const displayItems = items.slice(0, maxItems);

  return (
    <section className="px-4 md:px-10 lg:px-16 xl:px-20 mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[20px] sm:text-[22px] font-bold text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-[13px] text-white/40 mt-0.5">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-0.5 text-[12px] text-white/40 hover:text-white/70 transition-colors font-medium flex-shrink-0 ml-4"
          >
            Ver todo <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {displayItems.map((item, idx) => (
          <PosterCard key={item.id} item={item} type={type} variant="grid" eager={idx < 2} />
        ))}
      </div>
    </section>
  );
}
