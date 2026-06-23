import { Sparkles } from "lucide-react";

interface PremiumBadgeProps {
  variant?: "premium" | "new" | "top10" | "4k" | "hdr" | "upcoming";
  className?: string;
}

export function PremiumBadge({ variant = "premium", className = "" }: PremiumBadgeProps) {
  const variants = {
    premium: {
      icon: Sparkles,
      label: "Premium",
      bg: "bg-gradient-to-r from-red-700 to-red-600",
      border: "border-purple-500/40",
      glow: "shadow-lg shadow-purple-500/30",
    },
    new: {
      icon: null,
      label: "NUEVO",
      bg: "bg-gradient-to-r from-blue-700 to-blue-600",
      border: "border-blue-500/40",
      glow: "shadow-lg shadow-blue-500/30",
    },
    top10: {
      icon: null,
      label: "TOP 10",
      bg: "bg-gradient-to-r from-yellow-700 to-yellow-600",
      border: "border-yellow-500/40",
      glow: "shadow-lg shadow-yellow-500/20",
    },
    "4k": {
      icon: null,
      label: "4K",
      bg: "bg-gradient-to-r from-purple-700 to-purple-600",
      border: "border-purple-500/40",
      glow: "shadow-lg shadow-purple-500/20",
    },
    hdr: {
      icon: null,
      label: "HDR",
      bg: "bg-gradient-to-r from-green-700 to-green-600",
      border: "border-green-500/40",
      glow: "shadow-lg shadow-green-500/20",
    },
    upcoming: {
      icon: null,
      label: "PRÓXIMAMENTE",
      bg: "bg-gradient-to-r from-gray-700 to-gray-600",
      border: "border-gray-500/40",
      glow: "shadow-lg shadow-gray-500/20",
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 ${config.bg} rounded-lg text-white text-[10px] sm:text-xs font-black uppercase tracking-wider border ${config.border} backdrop-blur-md ${config.glow} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 sm:w-4 sm:h-4" />}
      {config.label}
    </span>
  );
}
