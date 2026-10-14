import mongoose from "mongoose";
import dns from "dns";

export const connectDatabase = async (): Promise<void> => {
    try {
        const uri = process.env.MONGODB_URI;

        // Set public DNS servers only for Atlas SRV connections in non-test environments
        if (process.env.NODE_ENV !== "test" && uri && uri.startsWith("mongodb+srv://")) {
            try {
                dns.setServers(["8.8.8.8", "1.1.1.1"]);
            } catch (dnsErr) {
                // Ignore DNS set server error if restricted
            }
        }

        if (!uri) {
            throw new Error("MONGODB_URI is not defined");
        }

        await mongoose.connect(uri);

        console.log("MongoDB connected successfully");
    } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : String(error);
        console.error("MongoDB connection failed:", errMessage);
        process.exit(1);
    }
};

export default connectDatabase;
