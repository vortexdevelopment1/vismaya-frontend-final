const mongoose = require("mongoose");
const dns = require("dns");

const connectDatabase = async () => {
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

        await mongoose.connect(uri);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDatabase;