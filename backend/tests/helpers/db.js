import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod = null;

/**
 * Connect to in-memory MongoDB instance for tests
 */
export const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (process.env.NODE_ENV !== "test") {
        throw new Error("Refusing to run tests when NODE_ENV !== 'test'");
    }

    try {
        mongod = await MongoMemoryServer.create({
            instance: {
                launchTimeout: 60000
            },
            binary: {
                version: "6.0.16"
            }
        });
        const uri = mongod.getUri();

        if (!uri.includes("127.0.0.1") && !uri.includes("localhost") && !uri.includes("test")) {
            throw new Error("Refusing to connect: test Mongo URI must be local or contain 'test'");
        }

        await mongoose.connect(uri);
    } catch (err) {
        console.error("Failed to start MongoMemoryServer, attempting fallback", err);
        const fallbackUri = process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/vismaya_test";
        await mongoose.connect(fallbackUri);
    }
};

/**
 * Clear all data from all collections between test runs
 */
export const clearDB = async () => {
    if (mongoose.connection.readyState !== 1) return;
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
};

/**
 * Close database connection and stop memory server
 */
export const disconnectDB = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (mongod) {
        await mongod.stop();
        mongod = null;
    }
};

export default {
    connectDB,
    clearDB,
    disconnectDB
};
