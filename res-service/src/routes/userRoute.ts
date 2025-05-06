import { getPosts } from "@controllers/userController"
import { authenticateToken } from "@middlewares/authenticateToken"
import { validateCookies } from "@shared-middlewares/validateCookies"
import { validateDeviceId } from "@shared-middlewares/validateDeviceId"
import { validateTokensPayload } from "@shared-middlewares/validateTokensPayload"
import express from "express"
const router = express.Router()

router.use(validateDeviceId)
router.use(validateCookies)
router.use(authenticateToken)
router.use(validateTokensPayload)

router.get("/posts", getPosts)

export default router