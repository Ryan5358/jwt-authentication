import { Response, NextFunction } from "express";
import RequestWithData from "types/requestWithData";
import { generateValidationErroResponse } from "@shared-utils/responseUtils";
import { validateValueWith } from "@shared-utils/validatorUtils";
import { CookiesSchema } from "@shared-validators/cookiesValidator";

export function validateCookies(req: RequestWithData, res: Response, next: NextFunction) {
    // Access the access_token and refresh_token directly from cookies
    const { error } = validateValueWith(CookiesSchema, req.cookies)
    // Validate if both tokens are present in the cookies
    if (error) {
        res.status(400).json(generateValidationErroResponse(error));
        return
    }

    next()
}