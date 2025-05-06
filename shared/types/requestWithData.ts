import User from "types/user";
import { Request } from "express";

export default interface RequestWithData extends Request {
    data?: {
        device_id?: string,
        user?: User,
        [key: string]: unknown
    }
}   