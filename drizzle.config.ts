import { Config, defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "./dev.db",
  },
  verbose: true,
  strict: true,
}) satisfies Config
