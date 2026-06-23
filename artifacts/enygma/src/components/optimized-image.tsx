import { useState, useEffect, useRef } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  onLoad?: () => void;
}

/**
 * Optimized Image component with lazy loading and blur placeholder
 * Reduces initial page load by deferring off-screen images
 */
export function OptimizedImage({
  src,
  alt,
  className = "",
  loading = "lazy",
  fetchPriority = "auto",
  onLoad,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(loading === "eager");
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (loading !== "lazy" || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            imgRef.current.src = src;
            observer.unobserve(imgRef.current);
          }
        });
      },
      { rootMargin: "100px" }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src, loading]);

  return (
    <div className={`relative overflow-hidden bg-zinc-900 ${className}`}>
      {/* Blur placeholder */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse" />
      )}

      <img
        ref={imgRef}
        src={loading === "eager" ? src : undefined}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${error ? "hidden" : ""}`}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={() => setError(true)}
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <span className="text-xs text-zinc-500">Imagen no disponible</span>
        </div>
      )}
    </div>
  );
}
