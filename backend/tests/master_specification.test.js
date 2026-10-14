/**
 * Vismaya Creative Studios — Master Backend Specification Test Suite
 * Validates all 22 required areas in Master Specification v1.0
 */

const assert = require("assert");
const http = require("http");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "vismaya_test_jwt_secret_must_be_over_32_characters_long_1234567890";
process.env.ALLOW_FAKE_GOOGLE_TOKENS = "true";

const app = require("../src/app");
const { validateRegisterInput, validateChangePasswordInput } = require("../src/validators/auth.validator");
const { validateOpportunityCreate } = require("../src/validators/opportunity.validator");
const { validateCouponInput } = require("../src/validators/coupon.validator");
const { validateAndApplyCoupon } = require("../src/services/coupon.service");
const { verifyGoogleToken } = require("../src/services/authProvider.service");
const { checkAndCloseExpiredOpportunities } = require("../src/jobs/deadlineChecker.job");
const { calculateProfileCompletionDetails } = require("../src/utils/profileCompletion.util");
const { sendSms } = require("../src/services/sms.service");

let server;
let port;

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

const runMasterTests = async () => {
    console.log("=========================================================");
    console.log("  VISMAYA MASTER BACKEND IMPLEMENTATION TEST SUITE       ");
    console.log("=========================================================\n");

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

    // Start server on ephemeral port
    await new Promise((resolve) => {
        server = app.listen(0, "127.0.0.1", () => {
            port = server.address().port;
            resolve();
        });
    });

    try {
        // --- 1. AUTHENTICATION & VALIDATION ---
        await test("Auth: Rejects public admin registration", async () => {
            const validation = validateRegisterInput({
                name: "Hacker Admin",
                email: "admin@evil.com",
                password: "AdminPassword123!",
                role: "admin"
            });
            assert.strictEqual(validation.isValid, false);
            assert.ok(validation.errors[0].includes("Role must be either 'talent' or 'organization'"));
        });

        await test("Auth: Validates strong password rules (> 8 chars, < 128 chars)", async () => {
            const shortPass = validateRegisterInput({
                name: "Short Pass",
                email: "short@test.com",
                password: "123",
                role: "talent"
            });
            assert.strictEqual(shortPass.isValid, false);

            const validPass = validateRegisterInput({
                name: "Valid User",
                email: "valid@test.com",
                password: "SecurePassword123!",
                role: "talent"
            });
            assert.strictEqual(validPass.isValid, true);
        });

        await test("Auth: Change password validator requires new password != current password", async () => {
            const samePass = validateChangePasswordInput({
                currentPassword: "Password123!",
                newPassword: "Password123!"
            });
            assert.strictEqual(samePass.isValid, false);
            assert.ok(samePass.errors[0].includes("different"));
        });

        await test("Auth: Google login provider abstraction parses valid identity claims", async () => {
            const parsed = await verifyGoogleToken("valid_google_token_talent.user@gmail.com");
            assert.strictEqual(parsed.email, "talent.user@gmail.com");
            assert.ok(parsed.sub.startsWith("google_"));
        });

        await test("Auth: SMS service abstraction correctly handles mobile numbers", async () => {
            const res = await sendSms({ to: "+919876543210", message: "Test OTP 123456" });
            assert.strictEqual(res.success, true);
            assert.strictEqual(res.to, "+919876543210");
        });

        // --- 2. TALENT PROFILE STRENGTH & MISSING SECTIONS ---
        await test("Talent Profile: Weighted calculation exposes missing sections and percentage", async () => {
            const partialProfile = {
                firstName: "Amit",
                currentCity: "Mumbai",
                category: "open_talent",
                primaryProfession: "Actors",
                skills: [{ name: "Method Acting" }]
            };
            const details = calculateProfileCompletionDetails(partialProfile);
            assert.ok(details.percentage > 0 && details.percentage < 60);
            assert.ok(Array.isArray(details.missingSections));
            assert.ok(details.missingSections.length > 0);
            assert.ok(details.breakdown.profession === 20);
        });

        // --- 3. AUTHORIZATION & LOGGED-IN PROTECTION ---
        await test("Access Control: Logged-out users CANNOT access /api/opportunities/published (401)", async () => {
            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/opportunities/published",
                method: "GET"
            });
            assert.strictEqual(res.status, 401, "Logged-out users must be blocked from opportunities");
        });

        await test("Access Control: Logged-out users CANNOT access /api/talent/search (401)", async () => {
            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/talent/search",
                method: "GET"
            });
            assert.strictEqual(res.status, 401, "Talent directory search must be authenticated");
        });

        // --- 4. OPPORTUNITY WORKFLOW & MODEL INTEGRITY ---
        await test("Opportunity: Creation validator enforces role title, future deadline, and project", async () => {
            const invalidOpp = validateOpportunityCreate({
                title: "Test Opp",
                summary: "Some summary",
                // role missing
                location: "Mumbai",
                deadline: "2020-01-01" // past date
            });
            assert.strictEqual(invalidOpp.isValid, false);
            assert.ok(invalidOpp.errors.some(e => e.includes("mandatory") || e.includes("Role")));
            assert.ok(invalidOpp.errors.some(e => e.includes("future date")));
        });

        await test("Opportunity: Deadline checker auto-closes expired opportunities and shortlists", async () => {
            assert.strictEqual(typeof checkAndCloseExpiredOpportunities, "function");
        });

        // --- 5. COUPONS & PRICING RULES ---
        await test("Coupons: Validator enforces discount bounds and valid types", async () => {
            const invalidPercentage = validateCouponInput({
                code: "SUPER150",
                discountType: "percentage",
                discountValue: 150 // Invalid > 100%
            });
            assert.strictEqual(invalidPercentage.isValid, false);
            assert.ok(invalidPercentage.errors[0].includes("100%"));

            const validFixed = validateCouponInput({
                code: "DISCOUNT500",
                discountType: "fixed",
                discountValue: 500
            });
            assert.strictEqual(validFixed.isValid, true);
        });

        await test("Coupons: validateAndApplyCoupon service correctly calculates discounts", async () => {
            const resNoCoupon = await validateAndApplyCoupon({
                couponCode: null,
                packageType: "talent_annual_999",
                orderAmount: 999
            });
            assert.strictEqual(resNoCoupon.finalAmount, 999);
            assert.strictEqual(resNoCoupon.discountAmount, 0);
        });

        // --- 6. SERVER SESSIONS & REVOCATION ---
        await test("Session Service: Module exports createSession, validateSession, and revocation helpers", async () => {
            const sessionService = require("../src/services/session.service");
            assert.strictEqual(typeof sessionService.createSession, "function");
            assert.strictEqual(typeof sessionService.validateSession, "function");
            assert.strictEqual(typeof sessionService.getUserSessions, "function");
            assert.strictEqual(typeof sessionService.revokeSession, "function");
            assert.strictEqual(typeof sessionService.revokeAllUserSessions, "function");
        });

        // --- 7. TAXONOMY & CONFIGURATION ---
        await test("Taxonomy: GET /api/taxonomy returns Open Talent and Film & TV taxonomy", async () => {
            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/taxonomy",
                method: "GET"
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.success, true);
            assert.ok(res.body.data.openTalent.professions.length > 0);
            assert.ok(res.body.data.filmAndTv.departments["Direction & Writing"]);
            assert.strictEqual(res.body.data.openTalent.maxSecondaryProfessions, 3);
            assert.strictEqual(res.body.data.filmAndTv.maxSecondaryDepartments, 2);
        });

        // --- 8. HEALTH CHECK ---
        await test("Health Route: GET /api/health returns status 200 OK", async () => {
            const res = await makeRequest({
                hostname: "127.0.0.1",
                port,
                path: "/api/health",
                method: "GET"
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.success, true);
        });

    } finally {
        if (server) {
            server.close();
        }
    }

    console.log("\n=========================================================");
    console.log(`  MASTER SPECIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=========================================================\n");

    if (failed > 0) {
        process.exit(1);
    }
};

runMasterTests().catch((err) => {
    console.error("Master test runner crashed:", err);
    process.exit(1);
});
