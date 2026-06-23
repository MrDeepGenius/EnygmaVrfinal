import dotenv from "dotenv";
import path from "node:path";
import app from "./app";
import { logger } from "./lib/logger";
import { getHomeContent } from "./lib/sheets";

// Carga variables desde archivos .env (opcional)
// - artifacts/api-server/.env  (preferido para este servicio)
// - .env en la raíz del repo   (fallback)
dotenv.config({ path: path.join(process.cwd(), "artifacts", "api-server", ".env") });
dotenv.config();

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  getHomeContent()
    .then(() => logger.info("Sheet cache warmed up"))
    .catch((e) => logger.warn({ err: e }, "Sheet cache warm-up failed"));
});
