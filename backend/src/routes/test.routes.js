const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Otp = require("../models/otp.model");
const { createSession } = require("../services/session.service");

const { authenticateUser } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

const router = express.Router();

router.get(
    "/protected",
    authenticateUser,
    (req, res) => {
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
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome Admin. You have access to this route.",
            user: req.user
        });
    }
);

router.post("/setup-test-user", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ success: false, message: "Forbidden in production" });
    }
    try {
        const { email, role, name } = req.body;
        let user = await User.findOne({ email: email?.toLowerCase() });
        if (!user) {
            user = await User.create({
                name: name || "Test User",
                email: email?.toLowerCase(),
                passwordHash: "test_dummy_hash",
                role: role || "talent",
                status: "active",
                isEmailVerified: true,
                isPaid: true
            });
        } else {
            user.status = "active";
            user.isEmailVerified = true;
            user.isPaid = true;
            if (role) user.role = role;
            await user.save();
        }

        const { sessionId } = await createSession({
            userId: user._id,
            userAgent: "IntegrationTestRunner/1.0",
            ipAddress: "127.0.0.1"
        });

        const token = jwt.sign(
            { userId: user._id.toString(), role: user.role, email: user.email, sessionId },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ success: true, token, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;