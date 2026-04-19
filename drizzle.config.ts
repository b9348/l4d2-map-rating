import { defineConfig } from "drizzle-kit"
import "dotenv/config"

// 让 drizzle-kit 读 .env.local(Next.js 惯用名,dotenv 默认只读 .env)
import { config } from "dotenv"
config({ path: ".env.local" })

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
