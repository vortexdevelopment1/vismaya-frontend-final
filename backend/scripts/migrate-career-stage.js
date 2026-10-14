/**
 * Migration Script: Migrate Career Stage Values
 * early_career -> emerging
 * mid_level    -> experienced
 * veteran      -> experienced
 *
 * Usage:
 *   node scripts/migrate-career-stage.js           (dry-run by default)
 *   node scripts/migrate-career-stage.js --apply   (apply changes)
 */

const mongoose = require("mongoose");
const TalentProfile = require("../src/models/talentProfile.model");
require("dotenv").config();

const MAPPING = {
    early_career: "emerging",
    mid_level: "experienced",
    veteran: "experienced"
};

async function runMigration() {
    const isApply = process.argv.includes("--apply") || process.argv.includes("--execute");
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/vismaya-backend";

    console.log(`[CareerStageMigration] Running in ${isApply ? "APPLY" : "DRY-RUN"} mode...`);
    await mongoose.connect(mongoUri);

    const oldStages = Object.keys(MAPPING);
    const profilesToMigrate = await TalentProfile.find({
        careerStage: { $in: oldStages }
    });

    console.log(`[CareerStageMigration] Found ${profilesToMigrate.length} profile(s) needing migration.`);

    let migratedCount = 0;
    for (const profile of profilesToMigrate) {
        const targetStage = MAPPING[profile.careerStage];
        console.log(`  - Profile ${profile.vismayaId} (${profile._id}): '${profile.careerStage}' -> '${targetStage}'`);
        if (isApply) {
            profile.careerStage = targetStage;
            await profile.save();
            migratedCount++;
        }
    }

    if (isApply) {
        console.log(`[CareerStageMigration] Successfully migrated ${migratedCount} profiles.`);
    } else {
        console.log(`[CareerStageMigration] Dry-run complete. Run with --apply to execute changes.`);
    }

    await mongoose.disconnect();
}

if (require.main === module) {
    runMigration().catch(err => {
        console.error("Migration error:", err);
        process.exit(1);
    });
}

module.exports = { runMigration };
