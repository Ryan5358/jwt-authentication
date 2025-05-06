import { DEFAULT_COOKIE_EXPIRATION } from "@constants/jwtConstants";
import { Request, Response } from "express";
import ms from "ms";

export function generateCookies(res: Response, paths: string[], ...tokens: Record<string, string | number>[]) {
    tokens.forEach((tokenObj) => {
        const [key, token] = Object.entries(tokenObj)[0]

        paths.forEach(path => {
            res.cookie(key, token, {
                httpOnly: true,    // E nsures the cookie is not accessible via JavaScript
                secure: process.env.NODE_ENV === "production",  // Only set cookies over HTTPS in production
                sameSite: "strict", // Controls how cookies are sent with cross-site requests
                maxAge: ms(DEFAULT_COOKIE_EXPIRATION),
                path: path
            });
        })
    })
}

export const clearAllCookies = (req: Request, res: Response, paths: string[]) => {
    const cookies = req.cookies;

    // Iterate over each cookie in the request
    for (const cookieName in cookies) {
        // Delete the cookie by setting its max age to zero or a past date
        paths.forEach(path => {
            res.clearCookie(cookieName, { path: path })
        })
    }
};