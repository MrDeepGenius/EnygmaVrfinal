interface WatchProvider {
  providerId: number;
  name: string;
  logoPath: string | null;
}

interface StreamingPlatformsProps {
  providers?: WatchProvider[];
  contentId?: string;
}

export function StreamingPlatforms({ providers = [] }: StreamingPlatformsProps) {
  if (providers.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-bold text-white/35 uppercase tracking-[0.15em] mb-3">Disponible en</p>
      <div className="flex flex-wrap gap-2.5">
        {providers.map((p) => (
          <div
            key={p.providerId}
            className="group relative flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 bg-white/5 border border-white/10 hover:border-white/25"
            title={p.name}
          >
            {p.logoPath ? (
              <img
                src={p.logoPath}
                alt={p.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center">
                <span className="text-white text-[10px] font-black">{p.name.charAt(0)}</span>
              </div>
            )}
            <span className="text-xs font-semibold text-white/70 whitespace-nowrap hidden sm:block">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
