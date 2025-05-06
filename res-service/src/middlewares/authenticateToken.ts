import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RedisClient } from "@shared-libs/redis/redisClient";
import { generateResponse } from "@shared-utils/responseUtils";
import { ACCESS_TOKEN_SECRET } from "@constants/secrets";
import RequestWithData from "@shared-types/requestWithData";
import { mapTo } from "@shared-utils/dataUtils";
import User, { userKeys } from "@shared-types/user";

export async function authenticateToken(req: RequestWithData, res: Response, next: NextFunction) {
    const { access_token: token } = req.cookies

    try {
        // Verify the JWT token synchronously
        const jwtPayload = jwt.verify(token, ACCESS_TOKEN_SECRET) as jwt.JwtPayload
        
        // Check if the token is blacklisted
        const redis = RedisClient.getInstance();

        const blacklisted = await redis.exists(`blacklisted:${token}`);
        if (blacklisted) {
            res.status(401).json(generateResponse(
                "User already logged out. Please log in.",
                { title: 'invalid_token' },
                "error"
            ))
            return
        }

        // If everything is valid, attach user to the request and continue
        req.data = { ...req.data, user: mapTo<User>(jwtPayload, userKeys) }

        next();  // Proceed to next middleware or route handler
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            // If token expired, try refreshing the token
            res.status(401).json(generateResponse(
                "Token expired",
                { title: 'invalid_token' },
                "error"
            ))
        } else {
            console.error(`Failed to authenticate token ${token}`, error);
            res.status(401).json(generateResponse(
                "Failed to verify token",
                { 
                    title: 'invalid_token',
                    details: error
                },
                "error"
            ))
        }
    }
}