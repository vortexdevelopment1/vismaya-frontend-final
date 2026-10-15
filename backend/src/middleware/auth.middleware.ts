import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { validateSession } from "../services/session.service.js";
import { JwtCustomPayload } from "../types/index.js";

export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!,
            { algorithms: ["HS256"] }
        ) as JwtCustomPayload;

        // Verify that the user exists and is active in the database
        const user = await User.findById(decoded.userId).select("_id role status email isPaid");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account no longer exists"
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: `Account is ${user.status}. Access denied.`
            });
        }

        // Reject tokens lacking sessionId unless legacy flag is enabled
        const allowLegacyTokens = process.env.ALLOW_LEGACY_TOKENS === "true";
        if (!decoded.sessionId && !allowLegacyTokens) {
            return res.status(401).json({
                success: false,
                message: "Session identifier missing in authentication token. Please log in again."
            });
        }

        // Check server-side session revocation
        if (decoded.sessionId) {
            const isValidSession = await validateSession(decoded.sessionId, user._id);
            if (!isValidSession) {
                return res.status(401).json({
                    success: false,
                    message: "Session has expired or been revoked. Please log in again."
                });
            }
        }

        req.user = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
            status: user.status,
            isPaid: user.isPaid,
            sessionId: decoded.sessionId || null
        };

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ["HS256"] }) as JwtCustomPayload;
        const user = await User.findById(decoded.userId).select("_id role status email isPaid");

        if (user && user.status === "active") {
            req.user = {
                userId: user._id.toString(),
                role: user.role,
                email: user.email,
                status: user.status,
                isPaid: user.isPaid
            };
        }
        next();
    } catch (error) {
        // Continue as unauthenticated guest if token is invalid or expired
        next();
    }
};

export default {
    authenticateUser,
    optionalAuth
};
