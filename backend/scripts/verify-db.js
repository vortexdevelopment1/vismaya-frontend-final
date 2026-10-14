import "dotenv/config";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import path from "node:path";

import User from "../src/models/user.model.js";
import TalentProfile from "../src/models/talentProfile.model.js";
import Organization from "../src/models/organization.model.js";
import Application from "../src/models/application.model.js";
import Opportunity from "../src/models/opportunity.model.js";
import Audition from "../src/models/audition.model.js";
import MediaItem from "../src/models/mediaItem.model.js";
import CreditLedger from "../src/models/creditLedger.model.js";
import CreditTransaction from "../src/models/creditTransaction.model.js";
import CreditViewHistory from "../src/models/creditViewHistory.model.js";
import ProjectShortlist from "../src/models/projectShortlist.model.js";
import PaymentTransaction from "../src/models/paymentTransaction.model.js";
import Notification from "../src/models/notification.model.js";
import AdminAuditLog from "../src/models/adminAuditLog.model.js";

const runVerification = async () => {
    let failed = 0;
    let mongod = null;
    const logCheck = (name, passed, detail = "") => {
        if (passed) {
            console.log(`[PASS] ${name}${detail ? ` - ${detail}` : ""}`);
        } else {
            console.error(`[FAIL] ${name}${detail ? ` - ${detail}` : ""}`);
            failed++;
        }
    };

    try {
        let mongoUri = process.env.MONGODB_URI_TEST;
        if (!mongoUri) {
            try {
                const { MongoMemoryServer } = await import("mongodb-memory-server");
                mongod = await MongoMemoryServer.create();
                mongoUri = mongod.getUri();
            } catch (e) {
                mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vismaya";
            }
        }
        await mongoose.connect(mongoUri);
        console.log(`Connected to MongoDB for database verification (${mongoUri.startsWith("mongodb://127.0.0.1") || mongoUri.startsWith("mongodb://localhost") ? "in-memory/local" : "remote"})\n`);

        // Ensure indexes are built
        await Promise.all([
            User.init(),
            TalentProfile.init(),
            Organization.init(),
            Application.init(),
            Audition.init(),
            MediaItem.init(),
            CreditViewHistory.init()
        ]);

        // 1. Unique Indexes Check
        const hasUniqueIndex = async (model, keyName) => {
            const indexes = await model.collection.indexes();
            return indexes.some(idx => {
                if (!idx.unique) return false;
                const keys = Object.keys(idx.key);
                if (Array.isArray(keyName)) {
                    return keyName.length === keys.length && keyName.every(k => idx.key[k] !== undefined);
                }
                return keys.length === 1 && keys[0] === keyName;
            });
        };

        const uEmail = await hasUniqueIndex(User, "email");
        const uMobile = await hasUniqueIndex(User, "mobile");
        const tpVismayaId = await hasUniqueIndex(TalentProfile, "vismayaId");
        const tpUserId = await hasUniqueIndex(TalentProfile, "userId");
        const orgUserId = await hasUniqueIndex(Organization, "userId");
        const appUnique = await hasUniqueIndex(Application, ["opportunityId", "talentId"]);
        const cvhUnique = await hasUniqueIndex(CreditViewHistory, ["organizationId", "talentId"]);
        const audUnique = await hasUniqueIndex(Audition, "applicationId");
        const mediaUnique = await hasUniqueIndex(MediaItem, ["owner", "contentHash"]);

        const allIndexes = uEmail && uMobile && tpVismayaId && tpUserId && orgUserId && appUnique && cvhUnique && audUnique && mediaUnique;
        logCheck(
            "1. Unique Indexes Integrity",
            allIndexes,
            `User(email:${uEmail}, mobile:${uMobile}), TalentProfile(vismayaId:${tpVismayaId}, userId:${tpUserId}), Org(userId:${orgUserId}), Application(${appUnique}), CreditView(${cvhUnique}), Audition(${audUnique}), Media(${mediaUnique})`
        );

        // 2. Searchable Profiles Integrity
        const invalidSearchable = await TalentProfile.find({ isSearchable: true }).populate("userId");
        const badSearchable = invalidSearchable.filter(tp => {
            if (!tp.userId) return true;
            return !tp.userId.isPaid || tp.userId.status !== "active" || (tp.profileCompletionPercentage || 0) < 60;
        });
        logCheck("2. Searchable Profiles Gate (isPaid, active, completion>=60)", badSearchable.length === 0, `Violations: ${badSearchable.length}`);

        // 3. Credit Ledger vs Transactions Recomputation
        const ledgers = await CreditLedger.find();
        let ledgerMismatch = 0;
        for (const ledger of ledgers) {
            const txs = await CreditTransaction.find({ organizationId: ledger.organizationId });
            let calculatedBalance = 0;
            for (const tx of txs) {
                if (["registration_grant", "package_purchase", "bundle_purchase", "admin_grant", "refund"].includes(tx.transactionType)) {
                    calculatedBalance += tx.amount;
                } else if (["profile_unlock", "admin_deduct", "feature_purchase"].includes(tx.transactionType)) {
                    calculatedBalance -= tx.amount;
                }
            }
            if (txs.length > 0 && Math.max(0, calculatedBalance) !== ledger.balance) {
                ledgerMismatch++;
            }
        }
        logCheck("3. Credit Ledger Balance Consistency", ledgerMismatch === 0, `Mismatches: ${ledgerMismatch}`);

        // 4. Expired Published Opportunities
        const expiredPublished = await Opportunity.countDocuments({
            status: "published",
            applicationDeadline: { $lt: new Date() }
        });
        logCheck("4. No Expired Published Opportunities", expiredPublished === 0, `Expired but published: ${expiredPublished}`);

        // 5. Selected / Not Selected Applications have Notification
        const decidedApps = await Application.find({ status: { $in: ["selected", "not_selected"] } });
        let missingNotifs = 0;
        for (const app of decidedApps) {
            const notif = await Notification.findOne({
                recipient: app.talentId,
                type: app.status === "selected" ? { $in: ["selected", "application_status_changed"] } : { $in: ["not_selected", "application_status_changed"] }
            });
            if (!notif) missingNotifs++;
        }
        logCheck("5. Application Outcome Notifications Exist", missingNotifs === 0, `Missing notifications: ${missingNotifs}`);

        // 6. Payment Transactions and User isPaid Integrity
        const badSuccessfulPayments = await PaymentTransaction.countDocuments({
            status: "successful",
            $or: [{ invoiceNumber: { $exists: false } }, { invoiceNumber: "" }, { invoiceNumber: null }]
        });
        const paidUsersWithoutPayment = await User.find({ isPaid: true, role: { $ne: "admin" } });
        let orphanPaidUsers = 0;
        for (const u of paidUsersWithoutPayment) {
            const hasTx = await PaymentTransaction.findOne({ userId: u._id, status: "successful" });
            if (!hasTx) orphanPaidUsers++;
        }
        logCheck("6. Payment Invoices and Paid User Consistency", badSuccessfulPayments === 0 && orphanPaidUsers === 0, `Incomplete txs: ${badSuccessfulPayments}, Orphan paid users: ${orphanPaidUsers}`);

        // 7. No Stored Raw Government ID Numbers
        const rawIdsFound = await TalentProfile.countDocuments({
            "identityData.idNumber": { $exists: true, $ne: null, $regex: /^[A-Z0-9]{6,}$/i }
        });
        logCheck("7. Identity ID Numbers Absent or Masked", rawIdsFound === 0, `Raw ID numbers: ${rawIdsFound}`);

        // 8. No ProjectShortlist for Closed/Cancelled/Completed Opportunities
        const inactiveOpps = await Opportunity.find({ status: { $in: ["closed", "cancelled", "completed"] } }).select("_id");
        const inactiveOppIds = inactiveOpps.map(o => o._id);
        const orphanShortlists = await ProjectShortlist.countDocuments({ opportunityId: { $in: inactiveOppIds } });
        logCheck("8. No Shortlists for Inactive Opportunities", orphanShortlists === 0, `Orphan shortlists: ${orphanShortlists}`);

        // 9. Exactly One SuperAdmin User
        const adminCount = await User.countDocuments({ role: "admin" });
        logCheck("9. Single Admin User Constraint", adminCount <= 1, `Admin count: ${adminCount}`);

        // 10. No Passwords, OTPs, Tokens in Audit Meta
        const leakyAuditLogs = await AdminAuditLog.countDocuments({
            $or: [
                { "details.password": { $exists: true } },
                { "details.otp": { $exists: true } },
                { "details.token": { $exists: true } },
                { "meta.password": { $exists: true } },
                { "meta.otp": { $exists: true } },
                { "meta.token": { $exists: true } }
            ]
        });
        logCheck("10. Audit Meta Sanitization (No Passwords/OTPs/Tokens)", leakyAuditLogs === 0, `Leaky logs: ${leakyAuditLogs}`);

        console.log(`\n========================================`);
        await mongoose.disconnect();
        if (mongod) await mongod.stop();

        if (failed === 0) {
            console.log("DATABASE VERIFICATION PASSED (10/10 CHECKS GREEN)");
            console.log("========================================\n");
            process.exit(0);
        } else {
            console.error(`DATABASE VERIFICATION FAILED (${failed} CHECKS FAILED)`);
            console.log("========================================\n");
            process.exit(1);
        }
    } catch (error) {
        console.error("Database verification error:", error);
        await mongoose.disconnect();
        if (mongod) await mongod.stop();
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
    runVerification();
}

export default runVerification;
export { runVerification };
