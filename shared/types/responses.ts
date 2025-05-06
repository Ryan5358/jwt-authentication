export interface ErrorResponse extends GenericResponse {
    error: string;
}

export interface InfoResponse extends GenericResponse {
    info: string;
}

export interface GenericResponse {
    message: string;
    details?: unknown;
    timestamp: string;
}

export interface OptionalResponsePayload {
    title?: string;
    details?: any;
}

