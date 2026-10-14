const crypto = require("crypto");
const Session = require("../models/session.model");

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Create a new server-side session for a logged-in user
 */
const createSession = async (userId, req = {}) => {
    try {
        const sessionId = crypto.randomBytes(32).toString("hex");
        const ipAddress = req.ip || (req.headers && (req.headers["x-forwarded-for"] || req.socket?.remoteAddress)) || "127.0.0.1";
        const userAgent = (req.headers && req.headers["user-agent"]) || "Unknown Client";
        
        let deviceInfo = "Web Browser";
        if (userAgent.includes("Mobile")) deviceInfo = "Mobile App / Browser";
        else if (userAgent.includes("Postman") || userAgent.includes("curl")) deviceInfo = "API Client";

        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

        const session = await Session.create({
            userId,
            sessionId,
            deviceInfo,
            ipAddress: typeof ipAddress === "string" ? ipAddress.split(",")[0].trim() : "127.0.0.1",
            userAgent,
            isValid: true,
            expiresAt
        });

        return session;
    } catch (error) {
        console.error("Create session error:", error);
        return null;
    }
};

/**
 * Validate that a session is active and not revoked
 */
const validateSession = async (sessionId, userId) => {
    if (!sessionId) return true; // Backward compatibility if token has no sessionId attached
    try {
        const session = await Session.findOne({
            sessionId,
            userId,
            isValid: true,
            expiresAt: { $gt: new Date() }
        });

        if (!session) return false;

        // Debounced update of lastActiveAt
        const now = Date.now();
        if (!session.lastActiveAt || now - session.lastActiveAt.getTime() > 60 * 1000) {
            session.lastActiveAt = new Date(now);
            await session.save();
        }

        return true;
    } catch (error) {
        console.error("Validate session error:", error);
        return false;
    }
};

/**
 * Get all active sessions for a user
 */
const getUserSessions = async (userId, currentSessionId) => {
    const sessions = await Session.find({
        userId,
        isValid: true,
        expiresAt: { $gt: new Date() }
    }).sort({ lastActiveAt: -1 }).lean();

    return sessions.map(s => ({
        sessionId: s.sessionId,
        deviceInfo: s.deviceInfo,
        ipAddress: s.ipAddress,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        isCurrent: s.sessionId === currentSessionId
    }));
};

/**
 * Revoke a specific session
 */
const revokeSession = async (userId, sessionId) => {
    return await Session.findOneAndUpdate(
        { userId, sessionId },
        { isValid: false },
        { returnDocument: "after" }
    );
};

/**
 * Revoke all sessions for a user (Logout all)
 */
const revokeAllUserSessions = async (userId) => {
    return await Session.updateMany(
        { userId, isValid: true },
        { isValid: false }
    );
};

module.exports = {
    createSession,
    validateSession,
    getUserSessions,
    revokeSession,
    revokeAllUserSessions
};
