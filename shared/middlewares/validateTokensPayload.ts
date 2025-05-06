import { Response, NextFunction } from "express"
import User, { createUser, userKeys } from "@shared-types/user"
import { isOwnedBy } from "@shared-repositories/userDeviceRepository"
import { findUsers } from "@shared-repositories/userRepository"
import RequestWithData from "@shared-types/requestWithData"
import { extractDataOf, tokenDetails, getTokenClaim, tokensDetails } from "@shared-utils/jwtUtils"
import { generateResponse } from "@shared-utils/responseUtils"

export async function validateTokensPayload(req: RequestWithData, res: Response, next: NextFunction) {
    const { 
        access_token: accessToken,
        refresh_token: refreshToken,
    } = req.cookies

    // Validate if access token is issued to a valid/existing user
    const accessUser = createUser((await findUsers(extractDataOf<User>(accessToken, userKeys)))[0])


    if (!accessUser) {
        res.status(403).json(generateResponse(
            "The user of this token cannot be found",
            { 
                title: "user_not_found",
                details:{ access_token: tokenDetails(accessToken) }
            },
            "error"
        ))
        return
    }

    // Validate if tokens are issued to the same user
    const isSameUser = getTokenClaim(accessToken, "sub") == getTokenClaim(refreshToken, "sub")

    if (!isSameUser) {
        res.status(403).json(generateResponse(
            "The tokens provided are not issue to the same user.",
            { 
                title: "invalid_tokens",
                details:{ tokens: tokensDetails(accessToken, refreshToken) }
            },
            "error"
        ))
        return
    }


    // Validate if device is legitimate
    const { device_id: deviceId } = req.data as { device_id: string }
    const isLegitimate = await isOwnedBy(deviceId, accessUser.id);
    if (!isLegitimate) {
        res.status(403).json(
            generateResponse(
                'You are accessing on an unregistered device',
                { title: "illegitimate_device" },
                "error"
            )
        )
        return
    }

    req.data = { ...req.data, access_user: accessUser }
    next()
}