import { Response, NextFunction } from "express";
import RequestWithData from "types/requestWithData";

export function validateDeviceId(req: RequestWithData, res: Response, next: NextFunction) {
    const deviceId = req.headers['x-device-id'] as string;

    if (!deviceId) {
        res.status(400).json({
            error: "missing_headers",
            message: "The 'X-Device-ID' header is required for this request."
        });
        return
    }

    req.data = { ...req.data, device_id: deviceId }
    next();
};