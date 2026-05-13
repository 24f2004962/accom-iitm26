import { defineConfig } from "drizzle-kit";
import path from "path";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("[drizzle] DATABASE_URL is not set — schema push will be skipped.");
  process.exit(0); // exit cleanly so the build/start command chain continues
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: { url },
});
