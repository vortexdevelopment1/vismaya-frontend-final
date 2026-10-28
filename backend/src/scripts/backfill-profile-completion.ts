/**
 * Backfill Profile Completion Script
 * 
 * Purpose:
 * Analyzes existing talent profiles and calculates their weighted, profession-aware
 * profile completion score using the authoritative calculateProfileCompletionDetails function.
 * 
 * Safety & Usage:
 * - BY DEFAULT, THIS IS A DRY RUN (read-only). It does not write to the database.
 * - Prints a comparison table: Profile Name, Old %, New %, Searchable Before/After, Can-Apply Before/After.
 * - Warns if any currently searchable or apply-eligible profile falls below 60%.
 * - ONLY persists `profileCompletionPercentage` and updates `isSearchable` when run with the `--apply` flag.
 * 
 * Usage:
 *   npx ts-node src/scripts/backfill-profile-completion.ts          # Dry run (default)
 *   npx ts-node src/scripts/backfill-profile-completion.ts --apply  # Live database update
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import TalentProfile from "../models/talentProfile.model.js";
import User from "../models/user.model.js";
import { calculateProfileCompletionDetails } from "../utils/profileCompletion.util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface ProfileAuditRow {
    vismayaId: string;
    name: string;
    profession: string;
    oldPercentage: number;
    newPercentage: number;
    searchableBefore: boolean;
    searchableAfter: boolean;
    canApplyBefore: boolean;
    canApplyAfter: boolean;
    isDropBelow60: boolean;
}

async function runBackfill() {
    const isApplyMode = process.argv.includes("--apply");

    console.log("================================================================================");
    console.log(` Vismaya Profile Completion Backfill — ${isApplyMode ? "LIVE APPLY MODE" : "DRY RUN MODE"}`);
    console.log("================================================================================");

    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/vismaya";
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB: ${mongoUri.replace(/:([^:@]{3,})@/, ":***@")}`);

    const profiles = await TalentProfile.find().lean();
    console.log(`Found ${profiles.length} total talent profile(s) in database.\n`);

    const auditRows: ProfileAuditRow[] = [];
    const warnings: string[] = [];

    // Preload all users for membership check
    const userIds = profiles.map(p => p.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select("_id isPaid status").lean();
    const userMap = new Map<string, any>(users.map(u => [u._id.toString(), u]));

    for (const profile of profiles) {
        const oldPct = profile.profileCompletionPercentage ?? 0;
        const details = calculateProfileCompletionDetails(profile);
        const newPct = details.percentage;

        const user = profile.userId ? userMap.get(profile.userId.toString()) : null;
        const isPaid = Boolean(profile.isPaid || user?.isPaid);
        const isActive = user?.status === "active";
        const isInformational = Boolean(profile.isInformational);

        // Eligibility before vs after
        const searchableBefore = Boolean(profile.isSearchable);
        const searchableAfter = !isInformational && newPct >= 60 && isPaid && isActive;

        const canApplyBefore = isInformational ? true : (oldPct >= 60 && isPaid);
        const canApplyAfter = isInformational ? true : (newPct >= 60 && isPaid);

        const isDropBelow60 = oldPct >= 60 && newPct < 60;
        if (isDropBelow60) {
            warnings.push(
                `[WARNING] Profile ${profile.vismayaId || profile._id} (${profile.stageName || profile.firstName || "Unknown"}) drops from ${oldPct}% to ${newPct}%! Previously eligible, now below 60%.`
            );
        }

        const name = (profile.stageName || `${profile.firstName || ""} ${profile.lastName || ""}`).trim() || "Unnamed Talent";
        const profession = profile.primaryProfession || profile.primaryDesignation || profile.category || "General";

        auditRows.push({
            vismayaId: profile.vismayaId || String(profile._id).slice(-8),
            name: name.slice(0, 20),
            profession: profession.slice(0, 18),
            oldPercentage: oldPct,
            newPercentage: newPct,
            searchableBefore,
            searchableAfter,
            canApplyBefore,
            canApplyAfter,
            isDropBelow60
        });

        // If --apply is specified, persist the update
        if (isApplyMode) {
            await TalentProfile.updateOne(
                { _id: profile._id },
                {
                    $set: {
                        profileCompletionPercentage: newPct,
                        isSearchable: searchableAfter
                    }
                }
            );
        }
    }

    // Print Formatted Table
    console.log(
        "ID".padEnd(12) +
        " | " + "Name".padEnd(20) +
        " | " + "Profession".padEnd(18) +
        " | " + "Old %".padStart(6) +
        " | " + "New %".padStart(6) +
        " | " + "Search (Old/New)" +
        " | " + "Apply (Old/New)" +
        " | " + "Status"
    );
    console.log("-".repeat(105));

    for (const row of auditRows) {
        const searchStatus = `${row.searchableBefore ? "Yes" : "No "} -> ${row.searchableAfter ? "Yes" : "No "}`;
        const applyStatus = `${row.canApplyBefore ? "Yes" : "No "} -> ${row.canApplyAfter ? "Yes" : "No "}`;
        const flag = row.isDropBelow60 ? "!! DROPPED !!" : (row.newPercentage >= 60 ? "Eligible" : "Incomplete");

        console.log(
            row.vismayaId.padEnd(12) +
            " | " + row.name.padEnd(20) +
            " | " + row.profession.padEnd(18) +
            " | " + `${row.oldPercentage}%`.padStart(6) +
            " | " + `${row.newPercentage}%`.padStart(6) +
            " | " + searchStatus.padEnd(16) +
            " | " + applyStatus.padEnd(15) +
            " | " + flag
        );
    }

    console.log("-".repeat(105));
    console.log(`Total Profiles Analyzed: ${auditRows.length}`);
    const droppedCount = auditRows.filter(r => r.isDropBelow60).length;
    console.log(`Profiles Dropped Below 60%: ${droppedCount}`);
    console.log(`Searchable Profiles: Before = ${auditRows.filter(r => r.searchableBefore).length}, After = ${auditRows.filter(r => r.searchableAfter).length}`);
    console.log(`Apply Eligible: Before = ${auditRows.filter(r => r.canApplyBefore).length}, After = ${auditRows.filter(r => r.canApplyAfter).length}`);

    if (warnings.length > 0) {
        console.log("\n========================= WARNINGS =========================");
        warnings.forEach(w => console.warn(w));
        console.log("============================================================\n");
    } else {
        console.log("\n[OK] No currently eligible profiles fall below the 60% threshold.");
    }

    if (!isApplyMode) {
        console.log("\n[NOTICE] This was a DRY RUN. No database records were modified.");
        console.log("To apply these completion updates to the database, run with: --apply");
    } else {
        console.log("\n[SUCCESS] Successfully applied profile completion updates to database.");
    }

    await mongoose.disconnect();
}

runBackfill().catch((err) => {
    console.error("Backfill script error:", err);
    process.exit(1);
});
