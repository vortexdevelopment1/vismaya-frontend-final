const crypto = require("crypto");

/**
 * Request ID Middleware
 * Assigns or preserves a unique x-request-id header for distributed tracing and audit logging
 */
const requestIdMiddleware = (req, res, next) => {
    const incomingId = req.headers["x-request-id"];
    const requestId = (incomingId && typeof incomingId === "string" && incomingId.trim()) 
        ? incomingId.trim() 
        : crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");

    req.id = requestId;
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
};

module.exports = requestIdMiddleware;
