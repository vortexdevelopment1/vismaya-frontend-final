const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Session = require("../../src/models/session.model");

/**
 * Generate a valid Bearer token for a given user object
 */
const generateAuthToken = async (user, options = {}) => {
    let sessionId = options.sessionId;
    
    if (!options.noSession && !sessionId) {
        sessionId = crypto.randomBytes(32).toString("hex");
        await Session.create({
            userId: user._id,
            sessionId,
            deviceInfo: "Test Client",
            ipAddress: "127.0.0.1",
            userAgent: "Jest Test Suite",
            isValid: true,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
    }

    const payload = {
        userId: user._id.toString(),
        role: user.role,
        ...(sessionId ? { sessionId } : {})
    };

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "vismaya_test_jwt_secret_must_be_over_32_characters_long_1234567890",
        { expiresIn: options.expiresIn || "7d" }
    );

    return {
        token,
        bearerHeader: `Bearer ${token}`,
        sessionId
    };
};

const getAuthHeader = (token) => {
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
};

module.exports = {
    generateAuthToken,
    getAuthHeader
};

