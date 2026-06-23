import { useState, useRef, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { useRatings, type Rating } from "@/lib/use-ratings";

interface RatingButtonProps {
  id: string;
}

const OPTIONS: { value: Rating; icon: React.ReactNode; label: string }[] = [
  { value: "dislike", icon: <ThumbsDown className="w-5 h-5" />, label: "No me gusta" },
  { value: "like",    icon: <ThumbsUp   className="w-5 h-5" />, label: "Me gusta" },
  { value: "love",    icon: <Heart      className="w-5 h-5" />, label: "Me encanta" },
];

export function RatingButton({ id }: RatingButtonProps) {
  const { rate, getRating } = useRatings();
  const current = getRating(id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const ActiveIcon = current === "love"
    ? <Heart      className="w-6 h-6 text-[#E50914] fill-[#E50914]" />
    : current === "like"
    ? <ThumbsUp   className="w-6 h-6 text-white fill-white" />
    : current === "dislike"
    ? <ThumbsDown className="w-6 h-6 text-white fill-white" />
    : <ThumbsUp   className="w-6 h-6 text-white" />;

  return (
    <div ref={ref} className="relative flex flex-col items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-center gap-1.5"
      >
        {ActiveIcon}
        <span className="text-[11px] text-white/55">
          {current === "love" ? "Me encanta" : current === "like" ? "Me gusta" : current === "dislike" ? "No me gusta" : "Clasificar"}
        </span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-zinc-800 border border-white/10 rounded-full px-3 py-2 shadow-2xl">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { rate(id, opt.value); setOpen(false); }}
              title={opt.label}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                current === opt.value
                  ? "bg-white text-black scale-110"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
