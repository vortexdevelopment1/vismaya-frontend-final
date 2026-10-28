import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

import app from "./app.js";
import connectDatabase from "./config/database.js";
import { startDeadlineChecker, stopDeadlineChecker } from "./jobs/deadlineChecker.job.js";

const PORT = process.env.PORT || 5000;

const KNOWN_JWT_DENY_LIST = [
    "vismaya_dev_secret_change_this_later",
    "your_super_secret_jwt_key_here_min_32_characters",
    "your_super_secret_jwt_key_here",
    "secret",
    "jwt_secret",
    "default_secret",
    "change_this_later",
    "password123",
    "12345678901234567890123456789012"
];

const KNOWN_MONGO_DENY_LIST = [
    "mongodb://localhost:27017/vismaya_placeholder",
    "mongodb+srv://<username>:<password>@cluster0.mongodb.net/vismaya?retryWrites=true&w=majority"
];

/**
 * Validate essential environment configuration
 * Enforces strong security keys on startup
 */
export const validateEnvironment = (env: NodeJS.ProcessEnv = process.env): boolean => {
    // Skip strict production/development validation in test environment
    if (env.NODE_ENV === "test") {
        return true;
    }

    const errors: string[] = [];

    // 1. MONGODB_URI validation
    if (!env.MONGODB_URI || typeof env.MONGODB_URI !== "string" || env.MONGODB_URI.trim().length === 0) {
        errors.push("MONGODB_URI is missing or empty.");
    } else if (KNOWN_MONGO_DENY_LIST.includes(env.MONGODB_URI.trim()) || env.MONGODB_URI.includes("<username>")) {
        errors.push("MONGODB_URI contains default placeholder values. Please provide a valid database URI.");
    }

    // 2. JWT_SECRET validation
    if (!env.JWT_SECRET || typeof env.JWT_SECRET !== "string") {
        errors.push("JWT_SECRET is missing.");
    } else {
        const trimmedSecret = env.JWT_SECRET.trim();
        if (trimmedSecret.length < 32) {
            errors.push(`JWT_SECRET is too short (${trimmedSecret.length} chars). It must be at least 32 characters long.`);
        }
        if (KNOWN_JWT_DENY_LIST.includes(trimmedSecret)) {
            errors.push("JWT_SECRET matches a known insecure default or placeholder. Generate a strong cryptographically secure secret.");
        }
    }

    // 3. PAYMENT_MODE validation
    const paymentMode = (env.PAYMENT_MODE as string) || "mock";
    if (paymentMode === "razorpay" && env.NODE_ENV !== "test") {
        if (!env.RAZORPAY_KEY_ID || typeof env.RAZORPAY_KEY_ID !== "string" || env.RAZORPAY_KEY_ID.trim().length === 0) {
            errors.push("RAZORPAY_KEY_ID is missing or empty when PAYMENT_MODE=razorpay.");
        }
        if (!env.RAZORPAY_KEY_SECRET || typeof env.RAZORPAY_KEY_SECRET !== "string" || env.RAZORPAY_KEY_SECRET.trim().length === 0) {
            errors.push("RAZORPAY_KEY_SECRET is missing or empty when PAYMENT_MODE=razorpay.");
        }
    } else if (env.NODE_ENV === "production" && paymentMode === "mock") {
        console.warn("⚠️ NOTICE: Running with PAYMENT_MODE='mock' in production environment.");
    }

    if (errors.length > 0) {
        const errorMessage = `FATAL CONFIGURATION ERROR:\n- ${errors.join("\n- ")}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    return true;
};

export const startServer = async (): Promise<void> => {
    try {
        validateEnvironment();
    } catch (err) {
        process.exit(1);
    }

    await connectDatabase();

    startDeadlineChecker(60 * 60 * 1000); // Check hourly

    const server = app.listen(PORT, () => {
        console.log(`Vismaya backend running on http://localhost:${PORT}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
        console.log(`Received ${signal}. Shutting down server gracefully...`);
        stopDeadlineChecker();
        server.close(() => {
            console.log("HTTP server closed.");
            process.exit(0);
        });

        // Force shutdown after 10 seconds if connections don't drain
        setTimeout(() => {
            console.error("Forcing shutdown after timeout.");
            process.exit(1);
        }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

const isMainModule = (): boolean => {
    if (!process.argv[1]) return false;
    try {
        const currentFile = path.resolve(fileURLToPath(import.meta.url));
        const scriptFile = path.resolve(process.argv[1]);
        return currentFile === scriptFile;
    } catch {
        return false;
    }
};

if (isMainModule()) {
    startServer();
}
