import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { fileURLToPath } from "node:url";
import path from "node:path";
import User from "../src/models/user.model.js";

export const createAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/vismaya";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for admin creation");

        const existingAdmin = await User.findOne({ role: "admin" });
        if (existingAdmin) {
            console.log(`An admin user already exists (${existingAdmin.email}). Creating a second admin is blocked.`);
            await mongoose.disconnect();
            process.exit(0);
        }

        const email = process.env.ADMIN_EMAIL || "admin@vismaya.com";
        const password = process.env.ADMIN_PASSWORD || "AdminSuperSecure2026!";
        const name = process.env.ADMIN_NAME || "Vismaya SuperAdmin";

        const hashedPassword = await bcrypt.hash(password, 12);

        const newAdmin = await User.create({
            name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "admin",
            status: "active",
            isPaid: true
        });

        console.log(`SuperAdmin created successfully: ${newAdmin.email}`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Failed to create admin:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

const isMainModule = () => {
    if (!process.argv[1]) return false;
    try {
        return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
    } catch {
        return false;
    }
};

if (isMainModule()) {
    createAdmin();
}

export default createAdmin;
