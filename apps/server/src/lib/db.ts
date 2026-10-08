import pg from "pg"
import { env } from "../env.js"
import { logger } from "@workspace/logger"

const { Pool } = pg

export const dbPool = new Pool({
  connectionString: env.DATABASE_URL,
})

export async function initDb(retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS urls (
          id SERIAL PRIMARY KEY,
          original_url TEXT NOT NULL,
          short_code TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          clicks INTEGER DEFAULT 0
        )
      `)
      logger.info("✅ Database initialized")
      return
    } catch (error) {
      if (attempt < retries) {
        logger.warn(
          `⏳ Database connection not ready (attempt ${attempt}/${retries}): ${error}. Retrying in ${delayMs / 1000}s...`
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      } else {
        logger.error(
          `❌ Database initialization failed after ${retries} attempts: ${error}`
        )
        throw error
      }
    }
  }
}
