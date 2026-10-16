import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Central AppError Class and Async Handler Wrapper
 */
export class AppError extends Error {
    public statusCode: number;
    public status: "fail" | "error";
    public isOperational: boolean;
    public details: unknown;

    constructor(message: string, statusCode = 500, details: unknown = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async Handler Wrapper to eliminate try-catch boilerplate in route controllers
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown
): RequestHandler => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
    AppError,
    asyncHandler
};
