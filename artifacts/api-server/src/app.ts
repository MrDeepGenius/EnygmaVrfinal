import express, { type Express } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(compression());
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Try to serve frontend static files if they exist
const frontendDir = path.join(__dirname, "../../enygma/dist/public");
try {
  app.use(express.static(frontendDir, { maxAge: "1d" }));
  // SPA fallback - serve index.html for all non-API routes
  app.use((_req, res, next) => {
    const indexPath = path.join(frontendDir, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err && !res.headersSent) {
        // If index.html not found, return API server info
        res.status(200).json({ 
          message: "ENYGMA API Server", 
          status: "running",
          note: "Frontend assets not available. Build frontend with: pnpm run build"
        });
      }
    });
  });
} catch (e) {
  // If frontend not built, provide helpful error page
  app.use((_req, res) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ENYGMA - Building...</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { background: #050505; color: white; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { text-align: center; }
            h1 { font-size: 2em; color: #E50914; }
            p { color: #b3b3b3; margin: 20px 0; }
            .spinner { display: inline-block; width: 40px; height: 40px; border: 4px solid #E50914; border-top: 4px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h1>ENYGMA</h1>
            <p>El frontend está siendo compilado...</p>
            <p style="font-size: 0.9em;">Si ves este mensaje repetidamente, compila el frontend con:</p>
            <code style="background: #0D0D0D; padding: 10px; display: inline-block; border-radius: 4px; margin-top: 10px;">pnpm run build</code>
            <p style="margin-top: 30px; font-size: 0.85em;">API Server está activo en /api</p>
          </div>
        </body>
      </html>
    `;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });
  logger.warn("Frontend static files not found, showing build message");
}

export default app;
