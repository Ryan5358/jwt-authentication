import { Request, Response } from "express";
import { findUsers } from "@shared-repositories/userRepository";
import * as jwtService from "@services/jwtService";
import UserCredentialsSchema, { UserEntrySchema } from "@validators/userValidator";
import { generateResponse, generateInternalErrorResponse, generateValidationErroResponse } from "@shared-utils/responseUtils";
import { ACCESS_TOKEN_EXPIRATION, REFRESH_TOKEN_EXPIRATION } from "@constants/jwtConstants";
import { clearAllCookies, generateCookies } from "@utils/cookieUtils";
import RequestWithData from "@shared-types/requestWithData";
import { tokenDetails, tokenLifetime, tokensDetails } from "@shared-utils/jwtUtils";
import User, { UserCredentials, UserPlainData } from "@shared-types/user";
import { validateValueWith } from "@shared-utils/validatorUtils";
import bcrypt from "bcrypt"
import { isOwnedBy } from "@shared-repositories/userDeviceRepository";

export const logout = async (req: RequestWithData, res: Response) => {
    try {
        const { 
            device_id: deviceId,
            access_user: accessUser
        } = req.data as { device_id: string, access_user: User }
        
        const { 
            access_token: accessToken,
            refresh_token: refreshToken,
        } = req.cookies

        const deleted =  await jwtService.revokeRefreshToken(refreshToken, deviceId)
        
        if (!deleted) {
            res.status(403).json(generateResponse(
                "The provided device ID or refresh token is invalid.",
                { 
                    title: "invalid_tokens_device_id", 
                    details: {
                        device_id: deviceId,
                        tokens: tokensDetails(accessToken, refreshToken)
                    }
                },
                "error"
            ))
            return
        }

        const blacklisted = await jwtService.blacklistAccessToken(accessToken)

        if (!blacklisted) {
            res.status(403).json(generateResponse(
                "The provided access token is invalid.",
                { title: "invalid_access_token" },
                "error"
            ))
            return
        }

        clearAllCookies(req as Request, res, ["/auth", "/user"])
        res.json(generateResponse(
            `User #${accessUser.id} logged out successfully.`,
            {
                title: "user_log_out",
                details: { 
                    user: accessUser,
                }
            },
            "info"
        ))
    } catch(error) {
        console.error(error)
        res.status(500).json(generateInternalErrorResponse());
    }
}

export const login = async (req: RequestWithData, res: Response) => {
    try {
        const { 
            device_id: deviceId,
        } = req.data as { device_id: string }

        const userCreds = req.body as UserCredentials

        const { error } = validateValueWith(UserCredentialsSchema, userCreds)

        if (error) {
            res.status(400).json(generateValidationErroResponse(error))
        } else {
            const userData = (await findUsers({ username: userCreds.username }))[0]

            if (!userData || !await bcrypt.compare(userCreds.password, userData.password_hash)) {
                res.status(401).json(generateResponse(
                    "The username or passsword is incorrect.",
                    { title: "invalid_credentials" },
                    "error"
                ))
                return
            }

            // Validate if device is legitimate
            const isLegitimate = await isOwnedBy(deviceId, userData.id);
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

            const { password_hash, ...user } = userData

            if(user) {
                const accessToken = jwtService.generateAccessToken(user, ACCESS_TOKEN_EXPIRATION)
                const refreshToken = await jwtService.createRefreshTokenSession(user, deviceId, REFRESH_TOKEN_EXPIRATION)
                
                generateCookies(res, ["/auth", "/user"], {user_id: user.id}, {access_token: accessToken}, {refresh_token: refreshToken})
                res.json(generateResponse(
                    `Log in successfully.`,
                    {
                        title: "user_log_in",
                        details: { 
                            user: user,
                            tokens: tokensDetails(accessToken, refreshToken)
                        }
                    },
                    "info"
                ))
            } else {        
                res.status(401).json(generateResponse(
                    "The username does not exist.",
                    { title: "user_not_exist" },
                    "error"
                ))
            }
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(generateInternalErrorResponse());
    }
}

export const token = async (req: RequestWithData, res: Response) => {
    try {
        const { 
            device_id: deviceId,
            access_user: accessUser
        } = req.data as { device_id: string, access_user: User }

        // Access the access_token and refresh_token directly from cookies
        const { 
            access_token: accessToken,
            refresh_token: refreshToken,
            user_id: userId
        } = req.cookies
        
        const newAccessToken = await jwtService.regenerateAccessToken(accessToken, refreshToken, accessUser, deviceId, ACCESS_TOKEN_EXPIRATION)

        if (newAccessToken == "access_token_already_valid") {
            res.json(generateResponse(
                `The provided access token is still valid for ${tokenLifetime(accessToken)}. A new token cannot be generated.`,
                {
                    title: newAccessToken,
                    details: { access_token: tokenDetails(accessToken) }
                },
                "info"
            ))
        } else if (newAccessToken) {
            generateCookies(res, ["/auth", "/user"], {user_id: userId}, {access_token: newAccessToken}, {refresh_token: refreshToken})
            // generateCookies(res,["/auth"], )
            res.json(generateResponse(
                `New access token is issued.`,
                {
                    title: "refresh_acess_token",
                    details: { 
                        user: accessUser,
                        tokens: tokensDetails(newAccessToken, refreshToken)
                    }
                },
                "info"
            ))
        } else {
            res.status(403).json(generateResponse(
                "The provided refresh token or access token is invalid.",
                { 
                    title: "invalid_tokens",
                    details:{ tokens: tokensDetails(accessToken, refreshToken) }
                },
                "error"
            ))
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(generateInternalErrorResponse());
    }
}


export const register = async (req: RequestWithData, res: Response) => {
    try {
        const newUserPlainData = req.body as UserPlainData

        const { 
            device_id: deviceId,
        } = req.data as { device_id: string }

        const { error } = validateValueWith(UserEntrySchema, newUserPlainData)

        if (error) {
            res.status(400).json(generateValidationErroResponse(error))
        } else {
            const registered = await jwtService.registerNewUser(newUserPlainData, deviceId)

            if (!registered) {
                res.status(409).json(generateResponse(
                    "Username already taken. Please choose a different one",
                    { title: "username_taken" },
                    "error"
                ))
                return
            }

            await login(req, res)
        }

    } catch (error) {
        console.error(error)
        res.status(500).json(generateInternalErrorResponse());
    }
}