import jwt from 'jsonwebtoken'
import User, { createUser, createUserData, userKeys, UserPlainData } from '@shared-types/user'
import ms from 'ms'
import { RedisHash } from '@shared-libs/redis/redisHash'
import JwtSession from '@_types/jwtSession'
import { REFRESH_TOKEN_EXPIRATION, ACCESS_TOKEN_EXPIRATION, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '@constants/jwtConstants'
import { signToken } from '@shared-utils/jwtUtils'
import { mapTo } from '@shared-utils/dataUtils'
import { RedisClient } from '@shared-libs/redis/redisClient'
import { addUser, findUsers } from '@shared-repositories/userRepository'
import bcrypt from 'bcrypt'
import { addUserDevice } from '@shared-repositories/userDeviceRepository'

const redis = RedisClient.getInstance()
const sessions: Record<string, JwtSession> = {}

export function generateAccessToken(user: User, expiresIn?: string): string {
    return signToken(user, ACCESS_TOKEN_SECRET, expiresIn, { subject: `user:${user.id}` })
}

export function generateRefreshToken(user: User, expiresIn?: string): string {
    return signToken(user, REFRESH_TOKEN_SECRET, expiresIn, { subject: `user:${user.id}` })
}

export async function regenerateAccessToken(accessToken: string, refreshToken: string, user: User, deviceId: string, expiresIn?: string) {
    try {
        const blacklisted = await redis.exists(`blacklisted:${accessToken}`) === 1
        if (blacklisted) return null

        const accessTokenExpired = await new Promise<boolean>((resolve) => {
            jwt.verify(accessToken, ACCESS_TOKEN_SECRET, (err, _) => {
                if (err instanceof jwt.TokenExpiredError) {
                    console.log("Access token expired, regenerating...");
                    resolve(true);
                } else if (err) {
                    console.error("Error verifying access token: ", err);
                    resolve(false);
                } else {
                    resolve(false); // Token is still valid
                }
            });
        });

        jwt.verify(refreshToken, REFRESH_TOKEN_SECRET)

        if (!accessTokenExpired) return "access_token_already_valid"

        const existed = await getRefreshTokenSession(user, deviceId) === refreshToken

        if(existed && accessTokenExpired) {
            return generateAccessToken(mapTo<User>(user, userKeys), expiresIn)
        }

        console.error("Refresh token does not match.");
        return null
    } catch (error) {
        console.error("Error regenarting a new access token ", error)
        throw new Error("Failed to regenerate a new access token")
    }
}

function addSession(sessionKey: string, sessionData: JwtSession) {
    sessions[sessionKey] = sessionData

    setTimeout(() => {
        if (sessionKey in sessions) {
            delete sessions[sessionKey]
        }
    }, ms(REFRESH_TOKEN_EXPIRATION))
}

function getSessionKey(user: User, deviceId: string) {
    return `session:user-${user.id}:device-${deviceId}`
}

export async function createRefreshTokenSession(user: User, deviceId: string, expiresIn: string): Promise<string> {
    const sessionKey = getSessionKey(user, deviceId)
    const session = new RedisHash(sessionKey)
    const REFRESH_TOKEN_EXPIRATION_MS = ms(expiresIn)

    const refreshToken = generateRefreshToken(user, expiresIn)

    try {
        await session.set("refresh_token", refreshToken)
        await session.set("expire_at", new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_MS).toISOString())
        await session.expire( ms(REFRESH_TOKEN_EXPIRATION) / 1000)

        await session.update()

        addSession(sessionKey, session.value as unknown as JwtSession)
        
        return refreshToken
    } catch(error) {
        console.error(`Error when trying to create a session: ${error}`)
        throw new Error("Failed to create a session")
    }
}

async function getRefreshTokenSession(user: User, deviceId: string): Promise<string> {
    const sessionKey = getSessionKey(user, deviceId)

    if(sessionKey in sessions) {
        return sessions[sessionKey].refresh_token
    } else {
        const session = new RedisHash(sessionKey)
        return await session.get("refresh_token") as string
    }
}

export async function blacklistAccessToken(accessToken: string): Promise<boolean> {
    try {
        jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
        await redis.set(`blacklisted:${accessToken}`, accessToken, { px: ms(ACCESS_TOKEN_EXPIRATION) });

        return true;
    } catch (error) {
        if (error instanceof(jwt.TokenExpiredError)) {
            console.error("Error blacklisting access token:", error);
            return true
        }
        throw new Error(`Failed to blacklist access token: ${accessToken}`)
    }
}


export async function revokeRefreshToken(refreshToken: string, deviceId: string): Promise<boolean> {
    try {
        const user = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as jwt.JwtPayload as User;

        if (!user) throw new Error("Invalid user in JWT payload");

        const sessionKey = getSessionKey(user, deviceId);
        const deleted = await redis.del(sessionKey) === 1;

        if (deleted) {
            delete sessions[sessionKey];
        }

        return deleted
    } catch (error) {
        console.error("Error revoking refresh token: ", error)
        throw new Error(`Failed to revoke refresh token: ${refreshToken}`)
    }
}

export async function registerNewUser(newUserData: UserPlainData, deviceId: string) {
    const existing_user = (await findUsers({ username: newUserData.username }))[0]

    if (existing_user) {
        return false
    }

    const newUser = createUserData({  
        ...createUser(newUserData),
        password_hash: await bcrypt.hash(newUserData.password, 10)
    })

    const newUserId = await addUser(newUser)
    await addUserDevice({ device_id: deviceId, user_id: newUserId })
    return true
}