import { login, logout, register, token } from '@controllers/jwtConroller'
import { validateCookies } from "@shared-middlewares/validateCookies"
import { validateDeviceId } from "@shared-middlewares/validateDeviceId"
import { validateTokensPayload } from "@shared-middlewares/validateTokensPayload"
import express from 'express'
const router = express.Router()

router.use(validateDeviceId)

router.post("/login", login)
router.post("/register", register)

router.use(validateCookies)
router.use(validateTokensPayload)

router.post("/logout", logout)
router.post("/token", token)

export default router