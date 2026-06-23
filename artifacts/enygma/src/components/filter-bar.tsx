import { useRef } from "react";
import { ChevronDown } from "lucide-react";

interface FilterBarProps {
  genres: string[];
  genre: string;
  onGenre: (g: string) => void;
  yearOptions: number[];
  year: string;
  onYear: (y: string) => void;
  total: number;
  accentClass?: string;
}

export function FilterBar({
  genres,
  genre,
  onGenre,
  yearOptions,
  year,
  onYear,
  total,
  accentClass = "",
}: FilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-10 lg:px-16 xl:px-20">
        <div className="flex items-center gap-4 h-14">

          {/* Genre scroll */}
          <div
            ref={scrollRef}
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0"
            style={{ maskImage: "linear-gradient(to right, transparent 0%, black 2%, black 92%, transparent 100%)" }}
          >
            {["Todos", ...genres].map((g) => {
              const isActive = g === "Todos" ? !genre : genre === g;
              return (
                <button
                  key={g}
                  onClick={() => onGenre(g === "Todos" ? "" : g)}
                  className={`
                    flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold
                    transition-all duration-200 select-none whitespace-nowrap
                    ${isActive
                      ? "bg-white text-black"
                      : "text-white/50 hover:text-white hover:bg-white/10"
                    }
                  `}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-white/10 flex-shrink-0" />

          {/* Year dropdown */}
          {yearOptions.length > 0 && (
            <div className="relative flex-shrink-0 group">
              <select
                value={year}
                onChange={(e) => onYear(e.target.value)}
                className={`
                  appearance-none bg-transparent pr-6 pl-0 py-1
                  text-[13px] font-semibold cursor-pointer
                  border-none outline-none
                  transition-colors duration-200
                  ${year ? "text-white" : "text-white/50 hover:text-white"}
                `}
              >
                <option value="" className="bg-[#141414] text-white">Año</option>
                {yearOptions.map((y) => (
                  <option key={y} value={String(y)} className="bg-[#141414] text-white">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors duration-200 ${year ? "text-white" : "text-white/40"}`}
              />
            </div>
          )}

          {/* Result count */}
          {total > 0 && (
            <>
              <div className="w-px h-5 bg-white/10 flex-shrink-0" />
              <span className="text-white/30 text-[12px] font-medium flex-shrink-0 tabular-nums hidden sm:block">
                {total.toLocaleString("es")} títulos
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
