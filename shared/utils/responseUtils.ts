import { OptionalResponsePayload, ErrorResponse, InfoResponse, GenericResponse } from "types/responses";
import Joi from "joi";
import { errorMessages } from "./validatorUtils";

export function generateResponse<T extends "error" | "info" | "generic">(
    message: string,
    optionalFields?: OptionalResponsePayload,
    responseType?: T
): T extends "error" ? ErrorResponse : T extends "info" ? InfoResponse : GenericResponse {
    let payload: Partial<ErrorResponse & InfoResponse & GenericResponse> = { };

    if (optionalFields) {
        // Handle `title` field first, replacing it with `error` or `info` if needed
        if (optionalFields.title) {
            if (responseType === "info") {
                payload["info"] = optionalFields.title;
            } else if (responseType === "error") {
                payload["error"] = optionalFields.title;
            } else {
                (payload as any)["title"] = optionalFields.title;
            }
        }
    }

    // Add `message` immediately after title/info/error
    payload["message"] = message

    // Add any optional fields provided to the payload
    Object.entries(optionalFields!!).forEach(([field, value]) => {
        if (field !== "title") {
            (payload as any)[field] = value;
        }
    });

    payload["timestamp"] = new Date().toISOString().slice(0, -5) + 'Z'

    return payload as any;
}

export function generateValidationErroResponse(error: Joi.ValidationError, title: string = "bad_request") {
    return generateResponse(
        "Validation Error",
        {
            title: title,
            details: errorMessages(error)
        },
        "error"
    )
}

export function generateInternalErrorResponse() {
    return generateResponse(
        "An error occurred while processing your request.",
        { title: "internal_server_error" },
        "error"
    )
}