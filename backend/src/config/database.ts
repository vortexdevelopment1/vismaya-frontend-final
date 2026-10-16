import mongoose from "mongoose";
import dns from "dns";

export const connectDatabase = async (): Promise<void> => {
    try {
        const uri = process.env.MONGODB_URI;

        // Prefer the host's DNS resolver. Some corporate, VPN and sandbox networks
        // block public resolvers (8.8.8.8/1.1.1.1), which made Atlas SRV URIs hang
        // before the API server could start. An explicit override remains available
        // for deployments that need one; it is never applied implicitly.
        const configuredDnsServers = process.env.MONGODB_DNS_SERVERS
            ?.split(",")
            .map((server) => server.trim())
            .filter(Boolean);
        if (process.env.NODE_ENV !== "test" && uri && uri.startsWith("mongodb+srv://") && configuredDnsServers?.length) {
            try {
                dns.setServers(configuredDnsServers);
            } catch (dnsErr) {
                console.warn("MongoDB DNS override could not be applied; using system DNS.");
            }
        }

        if (!uri) {
            throw new Error("MONGODB_URI is not defined");
        }

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 15000),
            connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 15000)
        });

        console.log("MongoDB connected successfully");
    } catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : String(error);
        console.error("MongoDB connection failed:", errMessage);
        process.exit(1);
    }
};

export default connectDatabase;
