import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Request ID Middleware
 * Assigns or preserves a unique x-request-id header for distributed tracing and audit logging
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const incomingId = req.headers["x-request-id"];
    const requestId = (incomingId && typeof incomingId === "string" && incomingId.trim()) 
        ? incomingId.trim() 
        : (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex"));

    req.id = requestId;
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
};

export default requestIdMiddleware;
