import pg from "pg"
import { env } from "../env.js"
import { logger } from "@workspace/logger"

const { Pool } = pg

export const dbPool = new Pool({
  connectionString: env.DATABASE_URL,
})

export async function initDb() {
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
  } catch (error) {
    logger.error(`❌ Database initialization failed: ${error}`)
  }
}
