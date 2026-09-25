import express from "express"
import cors from "cors"
import { morganMiddleware } from "@workspace/logger"
import { errorHandler } from "@workspace/middlewares"
import urlRoutes from "./routes/url.routes.js"

const app = express()

app.use(morganMiddleware)
app.use(cors())
app.use(express.json())

app.use("/", urlRoutes)

app.use(errorHandler)

export default app
