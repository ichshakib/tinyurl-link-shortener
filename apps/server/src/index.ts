import app from "./app.js"
import { env } from "./env.js"
import { initDb } from "./lib/db.js"
import { logger } from "@workspace/logger"

async function startServer() {
  try {
    await initDb()

    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`)
    })
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error}`)
    process.exit(1)
  }
}

startServer()
