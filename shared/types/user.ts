import { mapTo } from "@shared-utils/dataUtils";

export default interface User {
    id: number;
    username: string;
    email?: string;
}

export const userKeys: (keyof User)[] = ['id', 'username', 'email']

export const createUser = (data: any) => mapTo<User>(data, userKeys)

export interface UserData extends User {
    password_hash: string;
}

export const userDataKeys: (keyof UserData)[] = [...userKeys, 'password_hash']

export const createUserData = (data: any) => mapTo<UserData>(data, userDataKeys)

export interface UserPlainData extends User {
    password: string;
}

export interface UserCredentials {
    username: string;
    password: string;
}