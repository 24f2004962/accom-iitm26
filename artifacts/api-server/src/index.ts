import cluster from "cluster";
import { cpus } from "os";
import app from "./app.js";
import { autoSeed } from "./autoSeed.js";
import { productionSeed } from "./productionSeed.js";
import { initSchema } from "./initSchema.js";

const PORT = Number(process.env.PORT) || 8080;
// Keep local dev single-process for faster startup and predictable logs.
const WORKERS = process.env.NODE_ENV === "development" ? 1 : Math.min(cpus().length, 4);
const SHOULD_AUTO_SEED = process.env.AUTO_SEED === "true";

// Push DB schema in the background after the server starts.
// Runs only in the primary process (or single-process dev mode) so it
// doesn't execute once per worker. Safe to call on every boot — Drizzle push
// is idempotent (creates tables only if they don't already exist).
function initSchemaInBackground() {
  if (!process.env.DATABASE_URL) {
    console.warn("[DB] Skipping schema init — DATABASE_URL not set.");
    return;
  }
  // Run initSchema async without blocking startup
  initSchema().catch((err) =>
    console.error("[DB] Background schema init failed:", err.message)
  );
}

if (cluster.isPrimary) {
  console.log(`[Cluster] Primary ${process.pid} starting ${WORKERS} workers`);
  initSchemaInBackground();
  for (let i = 0; i < WORKERS; i++) cluster.fork();
  cluster.on("exit", (worker) => {
    console.log(`[Cluster] Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  app.listen(PORT, () => {
    console.log(`[Worker ${process.pid}] Listening on port ${PORT}`);
    // In single-process dev mode (WORKERS=1, isPrimary=false path never reached),
    // push schema here instead.
    if (WORKERS === 1 && process.env.NODE_ENV === "development") {
      // skip — dev uses local DB which is already up to date
    }
  });

  if (SHOULD_AUTO_SEED) {
    autoSeed().catch((error) => {
      console.error("[seed] Auto-seed failed:", error);
    });
  }

  if (process.env.SEED_REAL_DATA === "true") {
    productionSeed().catch((error) => {
      console.error("[prod-seed] Failed:", error);
    });
  }
}
