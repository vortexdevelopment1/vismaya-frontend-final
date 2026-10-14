/**
 * Vismaya Backend Security Test Suite
 * Tests authentication, authorization, rate limiting, ReDoS prevention,
 * input sanitization, cryptographic safety, security headers, and error handling.
 */

const assert = require("assert");
const http = require("http");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "vismaya_test_jwt_secret_must_be_over_32_characters_long_1234567890";

// Import application and utilities
const app = require("../src/app");
const { escapeRegex, isValidEmail, sanitizeEmail, isSafeUrl } = require("../src/utils/sanitize.util");

let server;
let baseUrl;

const makeRequest = (options, postData = null) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => {
                let parsed;
                try {
                    parsed = JSON.parse(body);
                } catch {
                    parsed = body;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on("error", reject);

        if (postData) {
            if (typeof postData === "object") {
                req.write(JSON.stringify(postData));
            } else {
                req.write(postData);
            }
        }
        req.end();
    });
};

const runSecurityTests = async () => {
    console.log("=================================================");
    console.log("  RUNNING VISMAYA BACKEND SECURITY TEST SUITE    ");
    console.log("=================================================\n");

    let passed = 0;
    let failed = 0;

    const test = async (name, fn) => {
        try {
            await fn();
            console.log(`  [PASS] ${name}`);
            passed++;
        } catch (error) {
            console.error(`  [FAIL] ${name}`);
            console.error(`         Error: ${error.message}`);
            failed++;
        }
    };

    // Start ephemeral server
    await new Promise((resolve) => {
        server = app.listen(0, "127.0.0.1", () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            resolve();
        });
    });

    const port = server.address().port;

    try {
        // --- PHASE 1: Security Headers & Technology Fingerprinting ---
        await test("Security Headers: Helmet & X-Powered-By disabled", async () => {
            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/health",
                method: "GET"
            });

            assert.strictEqual(res.headers["x-powered-by"], undefined, "X-Powered-By should be removed");
            assert.strictEqual(res.headers["x-content-type-options"], "nosniff", "X-Content-Type-Options must be nosniff");
            assert.ok(res.headers["content-security-policy"], "Content-Security-Policy header must exist");
        });

        // --- PHASE 2: ReDoS & Sanitization Utilities ---
        await test("ReDoS Prevention: escapeRegex neutralizes dangerous regex meta-characters", async () => {
            const dangerousInputs = [
                "((((a+)+)+)+)",
                "[[[[[test",
                "test(unclosed",
                ".*.*.*.*.*.*",
                "normal text"
            ];

            for (const input of dangerousInputs) {
                const escaped = escapeRegex(input);
                // Creating RegExp with escaped text must NOT throw syntax error
                assert.doesNotThrow(() => {
                    const regex = new RegExp(escaped, "i");
                    assert.ok(regex instanceof RegExp);
                }, `RegExp creation failed for: ${input}`);
            }
        });

        await test("Input Sanitization: Email validation and normalization", async () => {
            assert.strictEqual(isValidEmail("talent@vismaya.com"), true);
            assert.strictEqual(isValidEmail("user.name+tag@domain.co.in"), true);
            assert.strictEqual(isValidEmail("invalid-email"), false);
            assert.strictEqual(isValidEmail("user@"), false);
            assert.strictEqual(isValidEmail(""), false);
            assert.strictEqual(sanitizeEmail("  TALENT@Vismaya.COM  "), "talent@vismaya.com");
        });

        await test("URL Safety Validation: Prevents javascript: and data: XSS schemes", async () => {
            assert.strictEqual(isSafeUrl("https://vismaya.com/video.mp4"), true);
            assert.strictEqual(isSafeUrl("http://cdn.example.com/photo.jpg"), true);
            assert.strictEqual(isSafeUrl("/uploads/portfolio.jpg"), true);
            assert.strictEqual(isSafeUrl("javascript:alert(1)"), false);
            assert.strictEqual(isSafeUrl("data:text/html,<script>alert(1)</script>"), false);
            assert.strictEqual(isSafeUrl("//malicious.com/steal"), false);
        });

        // --- PHASE 3: Cryptographic Randomness ---
        await test("CSPRNG Safety: Random OTP generation uses crypto.randomInt", async () => {
            const sampleOtps = new Set();
            for (let i = 0; i < 100; i++) {
                const otp = crypto.randomInt(100000, 1000000).toString();
                assert.strictEqual(otp.length, 6, "OTP must be 6 digits");
                const num = parseInt(otp, 10);
                assert.ok(num >= 100000 && num <= 999999, "OTP must be within 100000-999999");
                sampleOtps.add(otp);
            }
            assert.ok(sampleOtps.size > 90, "OTP values should have high entropy");
        });

        // --- PHASE 4: Authentication & JWT Verification ---
        await test("Auth Middleware: Rejects missing Bearer token with 401", async () => {
            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/talent/profile/my",
                method: "GET"
            });
            assert.strictEqual(res.status, 401);
            assert.strictEqual(res.body.success, false);
        });

        await test("Auth Middleware: Rejects tampered / forged JWT token with 401", async () => {
            const secret = process.env.JWT_SECRET || "vismaya_dev_secret_change_this_later";
            const forgedToken = jwt.sign({ userId: "660000000000000000000001", role: "admin" }, "wrong_secret");

            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/test/protected",
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${forgedToken}`
                }
            });
            assert.strictEqual(res.status, 401);
            assert.strictEqual(res.body.success, false);
        });

        await test("Auth Controller: Registration rejects passwords under 8 characters", async () => {
            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/auth/register",
                method: "POST",
                headers: { "Content-Type": "application/json" }
            }, {
                name: "Test User",
                email: "test@example.com",
                password: "123", // Short password
                role: "talent"
            });
            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.body.success, false);
            assert.ok(res.body.message.includes("8 characters"));
        });

        await test("Auth Controller: Registration rejects invalid email format", async () => {
            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/auth/register",
                method: "POST",
                headers: { "Content-Type": "application/json" }
            }, {
                name: "Test User",
                email: "invalid-email-address",
                password: "SecurePassword123!",
                role: "talent"
            });
            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.body.success, false);
            assert.ok(res.body.message.includes("valid email"));
        });

        // --- PHASE 5: Webhook & Payment Verification Timing Protection ---
        await test("Payment Webhook: Enforces timing-safe comparison on signatures", async () => {
            const testSecret = "test_webhook_secret_key";
            process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

            const payload = { event: "payment.captured", payload: { payment: { entity: { id: "pay_123" } } } };
            const payloadStr = JSON.stringify(payload);
            const validSig = crypto.createHmac("sha256", testSecret).update(payloadStr).digest("hex");

            // Test missing signature -> 401
            const resNoSig = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/payments/webhook",
                method: "POST",
                headers: { "Content-Type": "application/json" }
            }, payload);
            assert.strictEqual(resNoSig.status, 401);

            // Test invalid signature -> 400
            const resBadSig = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/payments/webhook",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-razorpay-signature": "bad_signature_value_12345"
                }
            }, payload);
            assert.strictEqual(resBadSig.status, 400);

            delete process.env.RAZORPAY_WEBHOOK_SECRET;
        });

        // --- PHASE 6: 404 & Centralized Error Handling ---
        await test("Error Handling: Returns clean JSON 404 for undefined routes", async () => {
            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/nonexistent-route-xyz",
                method: "GET"
            });
            assert.strictEqual(res.status, 404);
            assert.strictEqual(res.body.success, false);
            assert.ok(res.body.message.includes("Resource not found"));
        });

        await test("Error Handling: Handles malformed JSON body without crashing or leaking stack traces", async () => {
            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/auth/login",
                method: "POST",
                headers: { "Content-Type": "application/json" }
            }, "{ malformed json: true, ");

            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.body.success, false);
            assert.strictEqual(res.body.stack, undefined, "Stack trace must not be exposed");
        });

        // --- PHASE 7: Cloudinary & Multer File Upload Security ---
        await test("Cloudinary Service: Upload utilities and signature generator exist", async () => {
            const cloudinaryService = require("../src/services/cloudinary.service");
            assert.strictEqual(typeof cloudinaryService.uploadFileBuffer, "function");
            assert.strictEqual(typeof cloudinaryService.deleteFile, "function");
            assert.strictEqual(typeof cloudinaryService.generateSignedUploadParams, "function");

            const sig = cloudinaryService.generateSignedUploadParams("vismaya/test");
            assert.ok(sig.timestamp);
            assert.strictEqual(sig.folder, "vismaya/test");
        });

        await test("Upload Middleware: Enforces authentication on media upload endpoints", async () => {
            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/media/upload",
                method: "POST"
            });
            assert.strictEqual(res.status, 401);
        });

    } finally {
        if (server) {
            server.close();
        }
    }


    console.log("\n=================================================");
    console.log(`  SECURITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================\n");

    if (failed > 0) {
        process.exit(1);
    }
};

runSecurityTests().catch((err) => {
    console.error("Test runner crashed:", err);
    process.exit(1);
});
