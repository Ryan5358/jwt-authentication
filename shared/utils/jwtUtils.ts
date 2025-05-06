import { mapTo } from "./dataUtils"
import jwt from "jsonwebtoken"
import ms from "ms"

export function signToken(payload: jwt.JwtPayload, secret: string, expiresIn?: string, otherOptions?: jwt.SignOptions ): string {
    const options = {
        expiresIn,
        ...otherOptions
    }
    return jwt.sign(payload, secret, options)
}

function getTokenPayload(token: string) {
    const payload = jwt.decode(token) as jwt.JwtPayload
    const { 
        sub,
        iss,
        iat,
        exp,
        ...data 
    } = payload as { 
        sub: string,
        iss: string, 
        iat: number
        exp: number 
        data: Record<string, unknown>
    }
    return { sub, iss, iat, exp, data }
}

export function getTokenClaim(token: string, claim: string) {
    const payload = getTokenPayload(token)

    if (claim in payload) {
        return (payload as any)[claim]
    } else {
        return (payload.data as any)[claim]
    }
}

export function extractDataOf<T>(token: string, keys: (keyof T)[]) {
    const { data } = getTokenPayload(token)
    return mapTo<T>(data, keys)
}

export function tokensDetails(accessToken: string, refreshToken: string) {
    return {
        access_token: tokenDetails(accessToken),
        refresh_token: tokenDetails(refreshToken)
    }
}

export function tokenLifetime(token: string) {
    const { 
        exp 
    } = getTokenPayload(token)

    return ms((exp - (Date.now() / 1000)) * 1000)
}

export function tokenDetails(token: string) {
    const { 
        sub,
        iss,
        exp 
    } = getTokenPayload(token)

    return {
        subject: sub,
        iss,
        expires_in: ms((exp - (Date.now() / 1000)) * 1000),
    }

}