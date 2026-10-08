import dotenv from "dotenv"
dotenv.config()

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://user:password@localhost:5432/tinyurl",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  URL_GENERATION_SERVICE_URL:
    process.env.URL_GENERATION_SERVICE_URL || "localhost:50051",
}
