import { Router } from "express"
import * as urlController from "../controllers/url.controller.js"

const router = Router()

router.get("/health", urlController.healthCheck)
router.post("/api/shorten", urlController.shortenUrl)
router.get("/api/urls", urlController.getUrls)
router.delete("/api/urls/:shortCode", urlController.deleteUrl)
router.get("/:shortCode", urlController.redirectUrl)

export default router
