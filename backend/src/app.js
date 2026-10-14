const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { apiLimiter, adminLimiter } = require("./middleware/rateLimit.middleware");
const requestIdMiddleware = require("./middleware/requestId.middleware");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const testRoutes = require("./routes/test.routes");
const adminRoutes = require("./routes/admin.routes");
const organizationRoutes = require("./routes/organization.routes");
const projectRoutes = require("./routes/project.routes");
const opportunityRoutes = require("./routes/opportunity.routes");
const applicationRoutes = require("./routes/application.routes");
const auditionRoutes = require("./routes/audition.routes");
const notificationRoutes = require("./routes/notification.routes");
const talentProfileRoutes = require("./routes/talentProfile.routes");
const mediaRoutes = require("./routes/media.routes");
const verificationRoutes = require("./routes/verification.routes");
const creditRoutes = require("./routes/credit.routes");
const paymentRoutes = require("./routes/payment.routes");
const taxonomyRoutes = require("./routes/taxonomy.routes");
const successStoryRoutes = require("./routes/successStory.routes");
const publicRoutes = require("./routes/public.routes");

const app = express();

// Set trust proxy per S7
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 0));

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
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
    : ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "http://127.0.0.1:3000", "http://127.0.0.1:5173"];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes("*") || process.env.NODE_ENV !== "production") {
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
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

// Test routes (exposed in non-production environments)
if (process.env.NODE_ENV !== "production") {
    app.use("/api/test", testRoutes);
}

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
app.use("/api/credits", creditRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/taxonomy", taxonomyRoutes);
app.use("/api/success-stories", successStoryRoutes);
app.use("/api", publicRoutes);

// 7. 404 Route Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Resource not found: ${req.method} ${req.originalUrl}`
    });
});

// 8. Centralized Production-Safe Error Handler (S10, S11)
app.use((err, req, res, next) => {
    const requestId = req.id || req.requestId;

    // Handle CORS error specifically
    if (err.message && err.message.includes("CORS policy violation")) {
        return res.status(403).json({
            success: false,
            message: "Cross-Origin Request Blocked by CORS Policy"
        });
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Malformed JSON in request payload"
        });
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
        const messages = Object.values(err.errors || {}).map(e => e.message);
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

module.exports = app;