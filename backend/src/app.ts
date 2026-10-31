import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { apiLimiter, adminLimiter } from "./middleware/rateLimit.middleware.js";
import requestIdMiddleware from "./middleware/requestId.middleware.js";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import projectRoutes from "./routes/project.routes.js";
import opportunityRoutes from "./routes/opportunity.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import auditionRoutes from "./routes/audition.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import talentProfileRoutes from "./routes/talentProfile.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import verificationRoutes from "./routes/verification.routes.js";
import creditRoutes from "./routes/credit.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import taxonomyRoutes from "./routes/taxonomy.routes.js";
import successStoryRoutes from "./routes/successStory.routes.js";
import publicRoutes from "./routes/public.routes.js";

const app = express();

// Set trust proxy per S7
app.set("trust proxy", process.env.TRUST_PROXY_HOPS !== undefined ? Number(process.env.TRUST_PROXY_HOPS) : 1);

// Request Tracking Middleware (S11)
app.use(requestIdMiddleware);

// 1. Security Headers (Helmet)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Disable X-Powered-By header to prevent technology fingerprinting
app.disable("x-powered-by");

// 2. CORS Configuration (Configurable & Restricted)
const defaultLocalOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
];

const parseOrigins = (val: string = "") => {
    if (!val) return [];
    return val
        .split(/[,|]/)
        .map(o => o.trim().replace(/\/+$/, ""))
        .filter(Boolean);
};

const allowedOrigins = Array.from(new Set([
    ...defaultLocalOrigins,
    ...parseOrigins(process.env.CORS_ORIGIN),
    ...parseOrigins(process.env.CLIENT_URL)
]));

app.use(cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/+$/, "");
        if (
            allowedOrigins.includes(normalizedOrigin) ||
            allowedOrigins.includes("*") ||
            /\.vercel\.app$/.test(normalizedOrigin) ||
            normalizedOrigin.startsWith("https://vismaya-frontend-final")
        ) {
            return callback(null, true);
        }
        return callback(new Error("CORS policy violation: Origin not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-razorpay-signature", "x-draft-token", "x-request-id"],
    credentials: true,
    maxAge: 86400 // 24 hours preflight cache
}));

// 3. Webhook Raw Body Parser (Mounted BEFORE express.json per S8)
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// 4. Request Body Size Limiting (Prevents Denial of Service via huge payloads)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// 5. General API Rate Limiting
app.use("/api", apiLimiter);

// 6. API Routes
app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

// Test routes (exposed in non-production environments)
if (process.env.NODE_ENV !== "production") {
    app.use("/api/test", testRoutes);
}

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/company", organizationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/auditions", auditionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/talent/profile", talentProfileRoutes);
app.use("/api/talent-profiles", talentProfileRoutes);
app.use("/api/talent", talentProfileRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/verifications", verificationRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/taxonomy", taxonomyRoutes);
app.use("/api/success-stories", successStoryRoutes);
app.use("/api", publicRoutes);

// Root welcome route
app.get("/", (req: Request, res: Response) => {
    res.json({
        success: true,
        message: "Vismaya Backend API is running",
        health: "/health",
        environment: process.env.NODE_ENV || "development"
    });
});

// 7. 404 Route Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Resource not found: ${req.method} ${req.originalUrl}`
    });
});

// 8. Centralized Production-Safe Error Handler (S10, S11)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).id || (req as any).requestId;

    // Handle CORS error specifically
    if (err.message && err.message.includes("CORS policy violation")) {
        return res.status(403).json({
            success: false,
            message: "Cross-Origin Request Blocked by CORS Policy"
        });
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && (err as any).status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Malformed JSON in request payload"
        });
    }

    // Multer deliberately rejects unsupported media before controllers run.
    // Convert those operational errors into client-safe 4xx responses rather
    // than leaking as generic 500s.
    if (err?.name === "MulterError") {
        const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(status).json({
            success: false,
            message: err.code === "LIMIT_FILE_SIZE" ? "Uploaded file exceeds the allowed size" : "Invalid upload request"
        });
    }
    if (err?.message && String(err.message).startsWith("Unsupported file type:")) {
        return res.status(400).json({ success: false, message: err.message });
    }

    // Handle Mongoose CastError / Invalid ObjectId (S10)
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: `Invalid identifier format for field: ${err.path}`
        });
    }

    // Handle Mongoose ValidationError
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors || {}).map((e: any) => e.message);
        return res.status(400).json({
            success: false,
            message: messages[0] || "Validation failed",
            errors: messages
        });
    }

    // Central AppError or generic safe error message
    const statusCode = err.statusCode || err.status || 500;
    const isProduction = process.env.NODE_ENV === "production";

    if (!isProduction && statusCode === 500) {
        console.error(`[Request ${requestId || "N/A"}] Unhandled Error:`, err);
    }

    res.status(statusCode).json({
        success: false,
        message: (statusCode === 500 && isProduction) ? "Internal server error" : (err.message || "An error occurred"),
        ...(requestId ? { requestId } : {})
    });
});

export default app;
