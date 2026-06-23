import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ command }) => {
  // Defaults seguros para build (producción) y para entornos donde no pasás env vars.
  // En Replit se solía exigir PORT/BASE_PATH; ahora se permiten defaults.
  const rawPort = process.env.PORT ?? "3000";
  const port = Number(rawPort);
  const basePath = (process.env.BASE_PATH ?? "/").trim() || "/";

  const extraReplitPlugins =
    process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
        ]
      : [];

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...extraReplitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      target: "esnext",
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-motion": ["framer-motion"],
            "vendor-player": ["hls.js"],
            "vendor-ui": ["lucide-react"],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "wouter", "@tanstack/react-query", "lucide-react"],
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      headers: {
        "X-Frame-Options": "ALLOWALL",
        "Content-Security-Policy": "frame-ancestors *",
      },
      fs: {
        strict: true,
      },
      middlewareMode: false,
      // Fallback para SPA: cualquier ruta no encontrada vuelve a index.html
      middleware: [
        // Middleware simple para SPA fallback
        (req, res, next) => {
          if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.includes('.')) {
            req.url = '/';
          }
          next?.();
        },
      ],
    },
    preview: {
      // preview usa el mismo puerto
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
