import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import readline from "node:readline";
import User from "../models/user.model.js";

const askQuestion = (query: string, hidden: boolean = false): Promise<string> => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        if (hidden) {
            process.stdout.write(query);
            let input = "";
            const onData = (char: Buffer) => {
                const s = char.toString("utf8");
                if (s === "\n" || s === "\r" || s === "\u0004") {
                    process.stdin.removeListener("data", onData);
                    rl.close();
                    process.stdout.write("\n");
                    resolve(input.trim());
                } else if (s === "\u0008" || s === "\x7f") {
                    if (input.length > 0) {
                        input = input.slice(0, -1);
                    }
                } else {
                    input += s;
                }
            };
            process.stdin.on("data", onData);
        } else {
            rl.question(query, (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        }
    });
};

export const validateAdminPassword = (password: string): { isValid: boolean; message?: string } => {
    if (!password || password.length < 12) {
        return { isValid: false, message: "Password must be at least 12 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one number" };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one special character" };
    }
    return { isValid: true };
};

export const createAdminBootstrap = async (): Promise<void> => {
    try {
        const isResetMode =
            process.env.ADMIN_RESET === "true" ||
            process.argv.includes("--reset-password") ||
            process.argv.includes("--reset");

        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_TEST;
        if (!mongoUri) {
            console.error("Error: Neither MONGODB_URI nor MONGODB_URI_TEST is defined in environment.");
            process.exit(1);
        }

        if (mongoUri.startsWith("mongodb+srv://")) {
            try {
                const dns = await import("dns");
                dns.setServers(["8.8.8.8", "1.1.1.1"]);
            } catch {}
        }

        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

        // Find existing admin accounts
        const existingAdmins = await User.find({ role: "admin" });

        // --- RECOVERY MODE (Password Reset & Unlock) ---
        if (isResetMode) {
            if (existingAdmins.length === 0) {
                console.error("[ERROR] No administrator account exists to reset. Please run bootstrap without reset flag to create the initial admin.");
                await mongoose.disconnect();
                process.exit(1);
            }

            // Target the primary active admin
            const targetAdmin =
                existingAdmins.find(a => a.email === "vortexcubesdevelopment@gmail.com") ||
                existingAdmins.find(a => a.status === "active") ||
                existingAdmins[0];

            let newPassword = process.env.ADMIN_PASSWORD;
            if (!newPassword) {
                newPassword = await askQuestion(`Enter New Password for Admin '${targetAdmin.email}' (min 12 chars, mixed case, number, symbol): `, true);
            }

            const passValidation = validateAdminPassword(newPassword);
            if (!passValidation.isValid) {
                console.error(`Error: Password validation failed: ${passValidation.message}`);
                await mongoose.disconnect();
                process.exit(1);
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            targetAdmin.password = hashedPassword;
            targetAdmin.adminLockUntil = null;
            targetAdmin.failedAdminLoginAttempts = 0;
            targetAdmin.status = "active";
            await targetAdmin.save();

            console.log(`[SUCCESS] Administrator password reset successfully for '${targetAdmin.email}'. Lockout cleared.`);
            await mongoose.disconnect();
            process.exit(0);
        }

        // --- CREATION MODE (Single-Admin Enforcement) ---
        if (existingAdmins.length > 0) {
            const primaryAdmin = existingAdmins.find(a => a.email === "vortexcubesdevelopment@gmail.com") || existingAdmins[0];
            console.error(`[REFUSED] An administrator account already exists ('${primaryAdmin.email}').`);
            console.error(`The system strictly enforces a SINGLE-ADMIN model. Only one administrator account is permitted.`);
            console.error(`To recover access or reset password for the existing administrator, run with ADMIN_RESET=true or pass the --reset-password flag.`);
            await mongoose.disconnect();
            process.exit(1);
        }

        let email = process.env.ADMIN_EMAIL?.trim();
        let name = process.env.ADMIN_NAME?.trim();
        let password = process.env.ADMIN_PASSWORD;

        if (!email) {
            email = await askQuestion("Enter Administrator Email: ");
        }
        if (!name) {
            name = await askQuestion("Enter Administrator Full Name: ");
        }
        if (!password) {
            password = await askQuestion("Enter Administrator Password (min 12 chars, mixed case, number, symbol): ", true);
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            console.error("Error: A valid ADMIN_EMAIL is required.");
            await mongoose.disconnect();
            process.exit(1);
        }

        if (!name) {
            console.error("Error: ADMIN_NAME is required.");
            await mongoose.disconnect();
            process.exit(1);
        }

        const passValidation = validateAdminPassword(password);
        if (!passValidation.isValid) {
            console.error(`Error: Password validation failed: ${passValidation.message}`);
            await mongoose.disconnect();
            process.exit(1);
        }

        const normalizedEmail = email.toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            console.error(`Error: A user with email '${normalizedEmail}' already exists. Cannot overwrite.`);
            await mongoose.disconnect();
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: "admin",
            isSuperAdmin: true,
            status: "active",
            isEmailVerified: true,
            twoFactorEnabled: true,
            isPaid: true
        });

        console.log(`[SUCCESS] Single administrator account successfully created: '${newAdmin.email}' with ID '${newAdmin._id}'`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error: any) {
        console.error("Failed to run create-admin script:", error.message || error);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
};

// Auto-run if executed directly
if (process.argv[1]?.endsWith("create-admin.ts") || process.argv[1]?.endsWith("create-admin.js")) {
    createAdminBootstrap();
}
