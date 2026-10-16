import bcrypt from "bcrypt";
import express, { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import {  createSession  } from "../services/session.service.js";

import {  authenticateUser  } from "../middleware/auth.middleware.js";
import {  authorizeRoles  } from "../middleware/role.middleware.js";

const router = express.Router();

router.get(
    "/protected",
    authenticateUser,
    (req: Request, res: Response) => {
        res.json({
            success: true,
            message: "You have access to this protected route",
            user: req.user
        });
    }
);

router.get(
    "/admin-only",
    authenticateUser,
    authorizeRoles("admin"),
    (req: Request, res: Response) => {
        res.json({
            success: true,
            message: "Welcome Admin. You have access to this route.",
            user: req.user
        });
    }
);

router.post("/setup-test-user", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ success: false, message: "Forbidden in production" });
    }

    // F-02: Restrict test route to local loopback or require valid X-Test-Secret
    const clientIp = req.ip || req.socket.remoteAddress || "";
    const isLoopback = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(clientIp) || clientIp.includes("127.0.0.1");
    const testSecretHeader = req.headers["x-test-secret"];
    const expectedSecret = process.env.TEST_SECRET;

    if (!isLoopback && (!expectedSecret || testSecretHeader !== expectedSecret)) {
        return res.status(403).json({
            success: false,
            message: "Access forbidden: test endpoints are restricted to localhost or require valid X-Test-Secret header"
        });
    }

    try {
        const { email, role, name, password } = req.body;

        if (role && !["talent", "organization"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be 'talent' or 'organization'. Admin creation via test route is strictly forbidden."
            });
        }

        let user = await User.findOne({ email: email?.toLowerCase() });

        if (user && (user.role === "admin" || (user as any).isSuperAdmin)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Cannot modify admin users via test routes."
            });
        }

        if (!user) {
            const hashedPassword = await bcrypt.hash(password || "Test@12345", 10);
            user = await User.create({
                name: name || "Test User",
                email: email?.toLowerCase(),
                password: hashedPassword,
                role: role || "talent",
                status: "active",
                isEmailVerified: true,
                isPaid: true
            } as any);
        } else {
            user.status = "active";
            user.isEmailVerified = true;
            user.isPaid = true;
            if (role) user.role = role;
            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }
            await user.save();
        }

        const session = await createSession(user._id, {
            ip: "127.0.0.1",
            headers: { "user-agent": "IntegrationTestRunner/1.0" }
        });
        const sessionId = session?.sessionId;

        const token = jwt.sign(
            { userId: user._id.toString(), role: user.role, email: user.email, sessionId },
            (process.env.JWT_SECRET as string),
            { expiresIn: "7d" }
        );

        res.json({ success: true, token, user });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;