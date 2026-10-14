/**
 * Authentication Provider Abstraction (Google OAuth)
 * Strict signature and identity verification via google-auth-library
 */
const { OAuth2Client } = require("google-auth-library");

let client = null;

const getOAuth2Client = () => {
    if (!client && process.env.GOOGLE_CLIENT_ID) {
        client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }
    return client;
};

/**
 * Verify Google ID Token
 * @param {string} idToken
 * @returns {Promise<{sub: string, email: string, name: string, picture: string, email_verified: boolean}>}
 */
const verifyGoogleToken = async (idToken) => {
    if (!idToken || typeof idToken !== "string") {
        throw new Error("Missing or invalid ID token");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;

    // Test environment stub: only enabled when explicitly configured in test mode
    if (process.env.NODE_ENV === "test" && process.env.ALLOW_FAKE_GOOGLE_TOKENS === "true") {
        if (idToken.startsWith("valid_google_token_")) {
            const email = idToken.replace("valid_google_token_", "").toLowerCase().trim();
            return {
                sub: `google_sub_${Buffer.from(email).toString("hex").slice(0, 16)}`,
                email,
                name: email.split("@")[0],
                picture: "https://example.com/photo.jpg",
                email_verified: true
            };
        }
        if (idToken.startsWith("unverified_google_token_")) {
            const email = idToken.replace("unverified_google_token_", "").toLowerCase().trim();
            return {
                sub: `google_sub_${Buffer.from(email).toString("hex").slice(0, 16)}`,
                email,
                name: email.split("@")[0],
                picture: "https://example.com/photo.jpg",
                email_verified: false
            };
        }
        // If it's a test token but not valid, or if testing invalid tokens
    }

    // Fail closed if GOOGLE_CLIENT_ID is missing
    if (!clientId) {
        throw new Error("Google authentication is not configured on the server (missing GOOGLE_CLIENT_ID)");
    }

    try {
        const oauthClient = getOAuth2Client();
        const ticket = await oauthClient.verifyIdToken({
            idToken,
            audience: clientId
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error("Unable to extract payload from Google token");
        }

        if (payload.email_verified !== true) {
            throw new Error("Google email address is not verified");
        }

        return {
            sub: payload.sub,
            email: payload.email.toLowerCase().trim(),
            name: payload.name || payload.email.split("@")[0],
            picture: payload.picture || "",
            email_verified: payload.email_verified === true
        };
    } catch (err) {
        throw new Error(err.message || "Invalid Google ID token signature or claims");
    }
};

module.exports = {
    verifyGoogleToken
};
